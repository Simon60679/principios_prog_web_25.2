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
    // Garante que as tabelas existam
    before(async () => {
        await sequelize.sync({ force: true });
    });

    // Limpa as tabelas antes de cada teste para garantir isolamento
    beforeEach(async () => {
        // Ordem de destruição importa devido às chaves estrangeiras
        await CartItem.destroy({ where: {} });
        await Purchase.destroy({ where: {} }); // Cascata deve limpar PurchaseItems
        await Sale.destroy({ where: {} });     // Cascata deve limpar SaleItems
        await Cart.destroy({ where: {} });
        await Product.destroy({ where: {} });
        await User.destroy({ where: {} });
    });

    // Helper para configurar o cenário: Vendedor, Comprador, Produto e Token
    const setupScenario = async () => {
        // 1. Criar Vendedor
        const seller = await User.create({
            name: "Vendedor Loja",
            email: "seller@store.com",
            password: "password123"
        });

        // 2. Criar Comprador
        const buyer = await User.create({
            name: "Cliente Final",
            email: "buyer@home.com",
            password: "password123"
        });

        // 3. Criar Carrinho do Comprador
        await Cart.create({ userId: buyer.id });

        // 4. Login do Comprador para obter token
        const loginRes = await request(app)
            .post("/auth/login")
            .send({ email: "buyer@home.com", password: "password123" });
        const token = loginRes.body.token;
        if (!token) {
            throw new Error("Falha ao obter token de autenticação no setup do teste. Verifique se o login está funcionando.");
        }

        // 5. Criar Produto com Estoque inicial de 10
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

            // Adiciona 2 itens ao carrinho manualmente (simulando estado pré-checkout)
            await CartItem.create({
                cartId: buyer.id,
                productId: product.id,
                quantity: 2
            });

            // Executa o Checkout
            const res = await request(app)
                .post(`/checkout/${buyer.id}`)
                .set("Authorization", `Bearer ${token}`);

            // 1. Verifica resposta da API
            expect(res.status).to.equal(201);
            expect(res.body.message).to.include("sucesso");
            expect(res.body.purchase).to.have.property("id");
            expect(Number(res.body.purchase.totalAmount)).to.equal(2000.00); // 2 * 1000

            // 2. Verifica Integridade: Compra criada
            const purchase = await Purchase.findOne({ where: { userId: buyer.id } });
            expect(purchase).to.not.be.null;

            // 3. Verifica Integridade: Venda criada para o vendedor
            const sale = await Sale.findOne({ where: { sellerId: seller.id } });
            expect(sale).to.not.be.null;
            expect(Number(sale?.totalAmount)).to.equal(2000.00);

            // 4. Verifica Integridade: Estoque reduzido
            const updatedProduct = await Product.findByPk(product.id);
            expect(updatedProduct?.stock).to.equal(8); // 10 - 2

            // 5. Verifica Integridade: Carrinho limpo
            const cartItems = await CartItem.findAll({ where: { cartId: buyer.id } });
            expect(cartItems).to.have.lengthOf(0);
        });

        it("deve falhar se o estoque for insuficiente", async () => {
            const { buyer, token, product } = await setupScenario();

            // Tenta comprar 15 itens (Estoque é 10)
            await CartItem.create({
                cartId: buyer.id,
                productId: product.id,
                quantity: 15
            });

            const res = await request(app)
                .post(`/checkout/${buyer.id}`)
                .set("Authorization", `Bearer ${token}`);

            // O controller deve retornar 409 (Conflict) para erros de regra de negócio (estoque)
            expect(res.status).to.equal(409);
            expect(res.body.message).to.include("Estoque insuficiente");

            // Verifica se o estoque permaneceu intacto (Rollback funcionou)
            const p = await Product.findByPk(product.id);
            expect(p?.stock).to.equal(10);
        });

        it("deve retornar 400 se tentar finalizar com carrinho vazio", async () => {
            const { buyer, token } = await setupScenario();

            // Carrinho está vazio

            const res = await request(app)
                .post(`/checkout/${buyer.id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).to.equal(400);
            expect(res.body.message).to.include("Carrinho vazio");
        });
    });
});
