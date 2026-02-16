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

        it("deve retornar 404 ao tentar adicionar produto inexistente", async () => {
            const { user, token } = await setupScenario();

            const res = await request(app)
                .post("/cart/add")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    userId: user.id,
                    productId: 99999,
                    quantity: 1
                });

            expect(res.status).to.equal(404);
        });

        it("deve impedir adição de quantidade maior que o estoque disponível", async () => {
            const { user, token, product } = await setupScenario();

            const res = await request(app)
                .post("/cart/add")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    userId: user.id,
                    productId: product.id,
                    quantity: product.stock + 5
                });

            expect(res.status).to.equal(400);
        });

        it("deve impedir que um usuário adicione itens ao carrinho de outro (Segurança)", async () => {
            const { token, product } = await setupScenario();
            const otherUser = await User.create({ name: "Other", email: "other@test.com", password: "123" });
            await Cart.create({ userId: otherUser.id });

            const res = await request(app)
                .post("/cart/add")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    userId: otherUser.id,
                    productId: product.id,
                    quantity: 1
                });

            expect(res.status).to.equal(403);
        });

        it("deve incrementar a quantidade se o item já existir no carrinho", async () => {
            const { user, token, product } = await setupScenario();

            await request(app)
                .post("/cart/add")
                .set("Authorization", `Bearer ${token}`)
                .send({ userId: user.id, productId: product.id, quantity: 1 });

            const res = await request(app)
                .post("/cart/add")
                .set("Authorization", `Bearer ${token}`)
                .send({ userId: user.id, productId: product.id, quantity: 2 });

            expect(res.status).to.equal(201);
            expect(res.body.quantity).to.equal(3);
        });

        it("deve retornar 400 se campos obrigatórios estiverem faltando", async () => {
            const { user, token } = await setupScenario();

            const res = await request(app)
                .post("/cart/add")
                .set("Authorization", `Bearer ${token}`)
                .send({ userId: user.id });

            expect(res.status).to.equal(400);
        });

        it("deve retornar 401 se o token não for fornecido", async () => {
            const { user, product } = await setupScenario();

            const res = await request(app)
                .post("/cart/add")
                .send({
                    userId: user.id,
                    productId: product.id,
                    quantity: 1
                });

            expect(res.status).to.equal(401);
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

        it("deve impedir que um usuário acesse o carrinho de outro (Segurança)", async () => {
            const { user } = await setupScenario();

            await User.create({ name: "Hacker", email: "hacker@test.com", password: "123" });
            const loginRes = await request(app)
                .post("/auth/login")
                .send({ email: "hacker@test.com", password: "123" });
            const tokenB = loginRes.body.token;

            const res = await request(app)
                .get(`/users/${user.id}/cart`)
                .set("Authorization", `Bearer ${tokenB}`);

            expect(res.status).to.be.oneOf([401, 403]);
        });

        it("deve retornar uma lista de itens vazia se o carrinho estiver vazio", async () => {
            const { user, token } = await setupScenario();

            const res = await request(app)
                .get(`/users/${user.id}/cart`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).to.equal(200);
            expect(res.body.items).to.be.an("array").that.is.empty;
        });

        it("deve retornar 401 se o token não for fornecido", async () => {
            const { user } = await setupScenario();

            const res = await request(app).get(`/users/${user.id}/cart`);

            expect(res.status).to.equal(401);
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

        it("deve retornar 404 ao tentar diminuir item que não está no carrinho", async () => {
            const { user, token, product } = await setupScenario();

            const res = await request(app)
                .patch(`/cart/${user.id}/item/${product.id}/decrease`)
                .set("Authorization", `Bearer ${token}`)
                .send({ quantity: 1 });

            expect(res.status).to.equal(404);
        });

        it("deve impedir que um usuário diminua item do carrinho de outro (Segurança)", async () => {
            const { token, product } = await setupScenario();
            const otherUser = await User.create({ name: "Other", email: "other@test.com", password: "123" });

            const res = await request(app)
                .patch(`/cart/${otherUser.id}/item/${product.id}/decrease`)
                .set("Authorization", `Bearer ${token}`)
                .send({ quantity: 1 });

            expect(res.status).to.equal(403);
        });

        it("deve remover o item se a quantidade diminuída resultar em zero ou menos", async () => {
            const { user, token, product } = await setupScenario();

            await request(app)
                .post("/cart/add")
                .set("Authorization", `Bearer ${token}`)
                .send({ userId: user.id, productId: product.id, quantity: 2 });

            const res = await request(app)
                .patch(`/cart/${user.id}/item/${product.id}/decrease`)
                .set("Authorization", `Bearer ${token}`)
                .send({ quantity: 2 });

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property("deleted", true);
        });

        it("deve retornar 400 ao tentar diminuir uma quantidade inválida (negativa ou zero)", async () => {
            const { user, token, product } = await setupScenario();

            const res = await request(app)
                .patch(`/cart/${user.id}/item/${product.id}/decrease`)
                .set("Authorization", `Bearer ${token}`)
                .send({ quantity: -5 });

            expect(res.status).to.equal(400);
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

        it("deve impedir que um usuário remova item do carrinho de outro (Segurança)", async () => {
            const { token, product } = await setupScenario();
            const otherUser = await User.create({ name: "Other", email: "other@test.com", password: "123" });

            const res = await request(app)
                .delete(`/cart/${otherUser.id}/item/${product.id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).to.equal(403);
        });

        it("deve retornar 404 ao tentar remover item que não está no carrinho", async () => {
            const { user, token, product } = await setupScenario();

            const res = await request(app)
                .delete(`/cart/${user.id}/item/${product.id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).to.equal(404);
        });
    });
});