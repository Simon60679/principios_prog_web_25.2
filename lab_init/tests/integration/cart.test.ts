import request from "supertest";
import { expect } from "chai";
import app from "../../src/app";
import User from "../../src/models/User";
import Product from "../../src/models/Product";
import Cart from "../../src/models/Cart";
import CartItem from "../../src/models/CartItem";
import sequelize from "../../src/config/database";

describe("Integração - Carrinho", () => {
    before(async () => {
        await sequelize.sync({ force: true });
    });

    beforeEach(async () => {
        // Limpa tabelas na ordem correta para evitar erros de FK
        await CartItem.destroy({ where: {} });
        await Cart.destroy({ where: {} });
        await Product.destroy({ where: {} });
        await User.destroy({ where: {} });
    });

    const setupScenario = async () => {
        const user = await User.create({
            name: "Shopper",
            email: "shopper@test.com",
            password: "password123"
        });

        await Cart.create({ userId: user.id });

        const loginRes = await request(app)
            .post("/auth/login")
            .send({
                email: "shopper@test.com",
                password: "password123"
            });
        const token = loginRes.body.token;

        const product = await Product.create({
            name: "Produto Teste",
            price: 100.00,
            description: "Descrição Teste",
            stock: 10,
            userId: user.id
        });

        return { user, token, product };
    };

    describe("POST /cart/add", () => {
        it("deve adicionar um item ao carrinho com sucesso", async () => {
            const { user, token, product } = await setupScenario();

            const res = await request(app)
                .post("/cart/add")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    userId: user.id,
                    productId: product.id,
                    quantity: 2
                });

            expect(res.status).to.equal(201);
            expect(res.body.quantity).to.equal(2);
            expect(res.body.productId).to.equal(product.id);
        });

        it("deve retornar 400 se tentar adicionar quantidade inválida", async () => {
            const { user, token, product } = await setupScenario();

            const res = await request(app)
                .post("/cart/add")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    userId: user.id,
                    productId: product.id,
                    quantity: -1
                });

            expect(res.status).to.equal(400);
        });
    });

    describe("GET /users/:userId/cart", () => {
        it("deve retornar o carrinho do usuário com os itens", async () => {
            const { user, token, product } = await setupScenario();

            await request(app)
                .post("/cart/add")
                .set("Authorization", `Bearer ${token}`)
                .send({ userId: user.id, productId: product.id, quantity: 1 });

            const res = await request(app)
                .get(`/users/${user.id}/cart`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property("items");
            expect(res.body.items).to.be.an("array");
            expect(res.body.items[0].product.name).to.equal(product.name);
        });
    });

    describe("PATCH /cart/:userId/item/:productId/decrease", () => {
        it("deve diminuir a quantidade de um item", async () => {
            const { user, token, product } = await setupScenario();

            await request(app)
                .post("/cart/add")
                .set("Authorization", `Bearer ${token}`)
                .send({ userId: user.id, productId: product.id, quantity: 5 });

            const res = await request(app)
                .patch(`/cart/${user.id}/item/${product.id}/decrease`)
                .set("Authorization", `Bearer ${token}`)
                .send({ quantity: 2 });

            expect(res.status).to.equal(200);
            expect(res.body.item.quantity).to.equal(3);
        });
    });

    describe("DELETE /cart/:userId/item/:productId", () => {
        it("deve remover um item do carrinho", async () => {
            const { user, token, product } = await setupScenario();

            await request(app)
                .post("/cart/add")
                .set("Authorization", `Bearer ${token}`)
                .send({ userId: user.id, productId: product.id, quantity: 1 });

            const res = await request(app)
                .delete(`/cart/${user.id}/item/${product.id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).to.equal(200);
            expect(res.body.message).to.include("removido completamente");
        });
    });
});