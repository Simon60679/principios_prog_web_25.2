import request from "supertest";
import { expect } from "chai";
import app from "../../src/app";
import User from "../../src/models/User";
import sequelize from "../../src/config/database";

describe("Integração - Autenticação", () => {
    before(async () => {
        await sequelize.sync({ force: true });
    });

    beforeEach(async () => {
        await User.destroy({ where: {} });
    });

    const createUser = async (email: string, password = "password123") => {
        return User.create({
            name: "Integration User",
            email,
            password
        });
    };

    describe("POST /login", () => {
        it("deve realizar login com sucesso e retornar um token", async () => {
            await createUser("integration@test.com", "password123");

            const res = await request(app)
                .post("/auth/login")
                .send({
                    email: "integration@test.com",
                    password: "password123"
                });

            expect(res.status, `Falha no login. Resposta: ${JSON.stringify(res.body)}`).to.equal(200);
            expect(res.body).to.have.property("token");
            expect(res.body.token).to.be.a("string");
            expect(res.body.message).to.equal("Login realizado com sucesso");
        });

        it("deve retornar 400 ao tentar logar com senha incorreta", async () => {
            await createUser("integration@test.com", "password123");

            const res = await request(app)
                .post("/auth/login")
                .send({
                    email: "integration@test.com",
                    password: "senhaerrada"
                });

            expect(res.status).to.equal(400);
            expect(res.body.message).to.equal("Email ou senha inválidos");
        });

        it("deve retornar 400 ao tentar logar com usuário inexistente", async () => {
            const res = await request(app)
                .post("/auth/login")
                .send({
                    email: "naoexiste@test.com",
                    password: "123"
                });

            expect(res.status).to.equal(400);
            expect(res.body.message).to.equal("Email ou senha inválidos");
        });
    });

    describe("POST /logout", () => {
        it("deve realizar logout com sucesso", async () => {
            await createUser("logout@test.com", "password123");

            const loginRes = await request(app)
                .post("/auth/login")
                .send({
                    email: "logout@test.com",
                    password: "password123"
                });

            const token = loginRes.body.token;
            expect(token, `Falha no login pré-logout. Resposta: ${JSON.stringify(loginRes.body)}`).to.be.a("string");

            const res = await request(app)
                .post("/auth/logout")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status, `Falha no logout. Resposta: ${JSON.stringify(res.body)}`).to.equal(200);
            expect(res.body.message).to.equal("Logout realizado com sucesso");
        });
    });
});
