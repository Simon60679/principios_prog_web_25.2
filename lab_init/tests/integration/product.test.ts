import request from "supertest";
import { expect } from "chai";
import app from "../../src/app";
import Product from "../../src/models/Product";
import User from "../../src/models/User";
import sequelize from "../../src/config/database";

describe("Integração - Produtos", () => {
    // Garante que as tabelas existam
    before(async () => {
        await sequelize.sync({ force: true });
    });

    // Limpa as tabelas antes de cada teste
    beforeEach(async () => {
        // A ordem importa por causa das chaves estrangeiras (Product depende de User)
        await Product.destroy({ where: {} });
        await User.destroy({ where: {} });
    });

    // Helper para criar usuário e obter token
    const createUserAndGetToken = async () => {
        await User.create({
            name: "Product Owner",
            email: "owner@test.com",
            password: "password123"
        });

        const res = await request(app)
            .post("/auth/login")
            .send({
                email: "owner@test.com",
                password: "password123"
            });
        
        return res.body.token;
    };

    describe("POST /products", () => {
        it("deve criar um produto com sucesso quando autenticado", async () => {
            const token = await createUserAndGetToken();

            const res = await request(app)
                .post("/products")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Novo Produto",
                    price: 99.90,
                    description: "Descrição do produto",
                    stock: 10
                });

            expect(res.status).to.equal(201);
            expect(res.body).to.have.property("id");
            expect(res.body.name).to.equal("Novo Produto");
            expect(res.body.userId).to.be.a("number"); // Verifica se associou ao usuário do token
        });

        it("deve retornar erro (401/403) se tentar criar sem token", async () => {
            const res = await request(app)
                .post("/products")
                .send({
                    name: "Produto Pirata",
                    price: 10,
                    description: "Sem auth",
                    stock: 1
                });

            expect(res.status).to.be.oneOf([401, 403]);
        });

        it("deve retornar 400 se faltarem campos obrigatórios", async () => {
            const token = await createUserAndGetToken();

            const res = await request(app)
                .post("/products")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Produto Incompleto"
                    // price e description faltando
                });

            expect(res.status).to.equal(400);
        });
    });

    describe("GET /products", () => {
        it("deve retornar lista de produtos (rota pública)", async () => {
            // Cria um usuário para ser o dono do produto
            const user = await User.create({
                name: "Seller",
                email: "seller@test.com",
                password: "123"
            });

            // Cria um produto diretamente no banco
            await Product.create({
                name: "Produto Existente",
                price: 50.00,
                description: "Descrição",
                stock: 5,
                userId: user.id
            });

            const res = await request(app).get("/products");

            expect(res.status).to.equal(200);
            expect(res.body).to.be.an("array");
            expect(res.body).to.have.lengthOf(1);
            expect(res.body[0].name).to.equal("Produto Existente");
        });
    });

    describe("PATCH /products/:id/stock", () => {
        it("deve atualizar o estoque do produto", async () => {
            const token = await createUserAndGetToken();

            const user = await User.findOne({ where: { email: "owner@test.com" } });
            
            const product = await Product.create({
                name: "Produto para Estoque",
                price: 10,
                description: "Desc",
                stock: 5,
                userId: user!.id
            });

            const res = await request(app)
                .patch(`/products/${product.id}/stock`)
                .set("Authorization", `Bearer ${token}`)
                .send({ stock: 20 });

            expect(res.status).to.equal(200);
            expect(res.body.product.stock).to.equal(20);
        });
    });

    describe("DELETE /products/:id", () => {
        it("deve deletar um produto com sucesso", async () => {
            const token = await createUserAndGetToken();
            // Busca o usuário criado pelo helper para vincular o produto
            const user = await User.findOne({ where: { email: "owner@test.com" } });

            const product = await Product.create({
                name: "Produto para Deletar",
                price: 10,
                description: "Desc",
                stock: 5,
                userId: user!.id
            });

            const res = await request(app)
                .delete(`/products/${product.id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).to.equal(200);
            
            // Verifica se realmente sumiu do banco
            const deletedProduct = await Product.findByPk(product.id);
            expect(deletedProduct).to.be.null;
        });

        it("deve retornar 404 ao tentar deletar produto inexistente", async () => {
            const token = await createUserAndGetToken();

            const res = await request(app)
                .delete("/products/99999")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).to.equal(404);
        });
    });
});