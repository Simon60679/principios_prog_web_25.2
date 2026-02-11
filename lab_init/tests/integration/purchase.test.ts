import request from "supertest";
import { expect } from "chai";
import app from "../../src/app";
import User from "../../src/models/User";
import Product from "../../src/models/Product";
import Cart from "../../src/models/Cart";
import CartItem from "../../src/models/CartItem";
import Purchase from "../../src/models/Purchase";
import Sale from "../../src/models/Sale";
import sequelize from "../../src/config/database";

describe("Integração - Transação (Checkout)", () => {

    before(async () => {
        await sequelize.sync({ force: true });
    });

    beforeEach(async () => {
        // Ordem de destruição importa devido às chaves estrangeiras
        await CartItem.destroy({ where: {} });
        await Purchase.destroy({ where: {} });
        await Sale.destroy({ where: {} });
        await Cart.destroy({ where: {} });
        await Product.destroy({ where: {} });
        await User.destroy({ where: {} });
    });

    const setupScenario = async () => {
        const seller = await User.create({
            name: "Vendedor Loja",
            email: "seller@store.com",
            password: "password123"
        });

        const buyer = await User.create({
            name: "Cliente Final",
            email: "buyer@home.com",
            password: "password123"
        });

        await Cart.create({ userId: buyer.id });

        const loginRes = await request(app)
            .post("/auth/login")
            .send({ email: "buyer@home.com", password: "password123" });
        const token = loginRes.body.token;
        if (!token) {
            throw new Error("Falha ao obter token de autenticação no setup do teste. Verifique se o login está funcionando.");
        }

        const product = await Product.create({
            name: "Smartphone",
            price: 1000.00,
            description: "Top de linha",
            stock: 10,
            userId: seller.id
        });

        return { seller, buyer, token, product };
    };

    describe("POST /checkout/:userId", () => {
        it("deve finalizar uma compra com sucesso (Happy Path)", async () => {
            const { buyer, seller, token, product } = await setupScenario();

            await CartItem.create({
                cartId: buyer.id,
                productId: product.id,
                quantity: 2
            });

            const res = await request(app)
                .post(`/checkout/${buyer.id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).to.equal(201);
            expect(res.body.message).to.include("sucesso");
            expect(res.body.purchase).to.have.property("id");
            expect(Number(res.body.purchase.totalAmount)).to.equal(2000.00);

            const purchase = await Purchase.findOne({ where: { userId: buyer.id } });
            expect(purchase).to.not.be.null;

            const sale = await Sale.findOne({ where: { sellerId: seller.id } });
            expect(sale).to.not.be.null;
            expect(Number(sale?.totalAmount)).to.equal(2000.00);

            const updatedProduct = await Product.findByPk(product.id);
            expect(updatedProduct?.stock).to.equal(8);

            const cartItems = await CartItem.findAll({ where: { cartId: buyer.id } });
            expect(cartItems).to.have.lengthOf(0);
        });

        it("deve falhar se o estoque for insuficiente", async () => {
            const { buyer, token, product } = await setupScenario();

            await CartItem.create({
                cartId: buyer.id,
                productId: product.id,
                quantity: 15
            });

            const res = await request(app)
                .post(`/checkout/${buyer.id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).to.equal(409);
            expect(res.body.message).to.include("Estoque insuficiente");

            const p = await Product.findByPk(product.id);
            expect(p?.stock).to.equal(10);
        });

        it("deve retornar 400 se tentar finalizar com carrinho vazio", async () => {
            const { buyer, token } = await setupScenario();

            const res = await request(app)
                .post(`/checkout/${buyer.id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).to.equal(400);
            expect(res.body.message).to.include("Carrinho vazio");
        });

        it("deve gerar vendas separadas para múltiplos vendedores", async () => {
            const { buyer, seller, token, product } = await setupScenario();

            const seller2 = await User.create({
                name: "Vendedor Extra",
                email: "seller2@store.com",
                password: "password123"
            });

            const product2 = await Product.create({
                name: "Fone de Ouvido",
                price: 200.00,
                description: "Bluetooth",
                stock: 20,
                userId: seller2.id
            });

            await CartItem.bulkCreate([
                { cartId: buyer.id, productId: product.id, quantity: 1 },
                { cartId: buyer.id, productId: product2.id, quantity: 2 }
            ]);

            const res = await request(app)
                .post(`/checkout/${buyer.id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).to.equal(201);
            expect(Number(res.body.purchase.totalAmount)).to.equal(1400.00);

            const sale1 = await Sale.findOne({ where: { sellerId: seller.id } });
            const sale2 = await Sale.findOne({ where: { sellerId: seller2.id } });

            expect(sale1).to.not.be.null;
            expect(Number(sale1?.totalAmount)).to.equal(1000.00);
            expect(sale2).to.not.be.null;
            expect(Number(sale2?.totalAmount)).to.equal(400.00);
        });

        it("deve retornar 401 se não autenticado", async () => {
            const { buyer } = await setupScenario();
            const res = await request(app).post(`/checkout/${buyer.id}`);
            expect(res.status).to.equal(401);
        });

        it("deve retornar 403 ao tentar finalizar a compra de outro usuário", async () => {
            const { token } = await setupScenario();
            const otherUser = await User.create({ name: "Outro Comprador", email: "other@test.com", password: "123" });

            const res = await request(app)
                .post(`/checkout/${otherUser.id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).to.equal(403);
        });

        it("deve aceitar checkout com quantidade exata do estoque disponível", async () => {
            const { buyer, token, product } = await setupScenario();

            await CartItem.create({
                cartId: buyer.id,
                productId: product.id,
                quantity: 10  // exato do estoque
            });

            const res = await request(app)
                .post(`/checkout/${buyer.id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).to.equal(201);

            const updatedProduct = await Product.findByPk(product.id);
            expect(updatedProduct?.stock).to.equal(0);  // ← ÚNICO foco
        });
    });

    describe("GET /users/:userId/purchases (Histórico de Compras)", () => {
        it("deve retornar a lista de compras do usuário", async () => {
            const { buyer, token, product } = await setupScenario();

            await CartItem.create({
                cartId: buyer.id,
                productId: product.id,
                quantity: 1
            });

            await request(app)
                .post(`/checkout/${buyer.id}`)
                .set("Authorization", `Bearer ${token}`);

            const res = await request(app)
                .get(`/users/${buyer.id}/purchases`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).to.equal(200);
            expect(res.body).to.be.an("array");
            expect(res.body).to.have.lengthOf(1);
            expect(Number(res.body[0].totalAmount)).to.equal(1000.00);
            expect(res.body[0].items).to.have.lengthOf(1);
            expect(res.body[0].items[0].productName).to.equal("Smartphone");
        });

        it("deve retornar 401 se não autenticado ao acessar próprias compras", async () => {
            const { buyer } = await setupScenario();
            const res = await request(app).get(`/users/${buyer.id}/purchases`);
            expect(res.status).to.equal(401);
        });

        it("deve retornar 403 ao tentar acessar compras de outro usuário", async () => {
            const { token } = await setupScenario();
            const otherUser = await User.create({
                name: "Outro Comprador",
                email: "other@test.com",
                password: "123"
            });
            const res = await request(app)
                .get(`/users/${otherUser.id}/purchases`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).to.equal(403);
        });
    });

    describe("GET /users/:userId/sales (Histórico de Vendas)", () => {
        it("deve retornar a lista de vendas do vendedor", async () => {
            const { buyer, seller, token, product } = await setupScenario();

            await CartItem.create({
                cartId: buyer.id,
                productId: product.id,
                quantity: 2
            });

            await request(app)
                .post(`/checkout/${buyer.id}`)
                .set("Authorization", `Bearer ${token}`);

            const sellerLoginRes = await request(app)
                .post("/auth/login")
                .send({ email: "seller@store.com", password: "password123" });
            const sellerToken = sellerLoginRes.body.token;

            const res = await request(app)
                .get(`/users/${seller.id}/sales`)
                .set("Authorization", `Bearer ${sellerToken}`);

            expect(res.status).to.equal(200);
            expect(res.body).to.be.an("array");
            expect(res.body).to.have.lengthOf(1);
            expect(Number(res.body[0].totalAmount)).to.equal(2000.00);
            expect(res.body[0]).to.have.property('soldItems');
            expect(res.body[0].soldItems[0]).to.have.property('productName');
            expect(res.body[0].soldItems[0]).to.have.property('quantity');
            expect(res.body[0].soldItems[0]).to.have.property('productPrice');
        });

        it("deve retornar 401 se não autenticado ao acessar próprias vendas", async () => {
            const { seller } = await setupScenario();
            const res = await request(app).get(`/users/${seller.id}/sales`);
            expect(res.status).to.equal(401);
        });

        it("deve retornar 403 ao tentar acessar vendas de outro usuário", async () => {
            const { token } = await setupScenario();
            const otherSeller = await User.create({
                name: "Outro Vendedor",
                email: "otherseller@test.com",
                password: "123"
            });
            const res = await request(app)
                .get(`/users/${otherSeller.id}/sales`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).to.equal(403);
        });
    });
});
