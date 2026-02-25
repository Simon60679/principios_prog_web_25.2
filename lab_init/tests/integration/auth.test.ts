import request from "supertest";
import { expect } from "chai";
import jwt from "jsonwebtoken";
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

    describe("POST /auth/register", () => {
        it("deve registrar um novo usuário com sucesso", async () => {
            const res = await request(app)
                .post("/auth/register")
                .send({
                    name: "Novo Usuario",
                    email: "register_test@test.com",
                    password: "password123"
                });

            expect(res.status).to.equal(201);
            expect(res.body).to.have.property("id");
            expect(res.body.email).to.equal("register_test@test.com");
            expect(res.body).to.not.have.property("password");

            const savedUser = await User.findOne({ where: { email: "register_test@test.com" } });
            expect(savedUser).to.not.be.null;
            expect(savedUser!.password).to.not.equal("password123");
            expect(savedUser!.password).to.have.length.greaterThan(20);
        });

        it("deve impedir cadastro com email duplicado", async () => {
            await createUser("duplicate@test.com");

            const res = await request(app)
                .post("/auth/register")
                .send({ name: "User", email: "duplicate@test.com", password: "123" });

            expect(res.status).to.equal(409);
        });

        it("deve retornar 400 se faltarem campos obrigatórios", async () => {
            const res = await request(app)
                .post("/auth/register")
                .send({
                    name: "Incompleto",
                    email: "incomplete@test.com"
                    // Senha faltando
                });

            expect(res.status).to.equal(400);
        });

        it("deve retornar 400 para um email inválido", async () => {
            const res = await request(app)
                .post("/auth/register")
                .send({
                    name: "Email Invalido",
                    email: "email-invalido",
                    password: "password123"
                });

            expect(res.status).to.equal(400);
        });
    });

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

        it("deve retornar 400 se a senha estiver ausente no corpo da requisição", async () => {
            const res = await request(app)
                .post("/auth/login")
                .send({
                    email: "integration@test.com"
                    // Senha faltando
                });

            expect(res.status).to.equal(400);
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

        it("deve impedir acesso a rota protegida após o logout (Token Blacklist)", async () => {
            await createUser("logout_check@test.com", "password123");

            const loginRes = await request(app)
                .post("/auth/login")
                .send({ email: "logout_check@test.com", password: "password123" });
            const token = loginRes.body.token;

            await request(app)
                .post("/auth/logout")
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            const protectedRes = await request(app)
                .get("/users")
                .set("Authorization", `Bearer ${token}`);

            expect(protectedRes.status).to.equal(401);
        });

        it("deve retornar 401 ao tentar fazer logout sem um token", async () => {
            const res = await request(app).post("/auth/logout");
            expect(res.status).to.equal(401);
        });
    });

    describe("Controle de Acesso (Middleware)", () => {
        it("deve negar acesso a rota protegida sem token", async () => {
            const res = await request(app).get("/users");
            expect(res.status).to.equal(401);
        });

        it("deve negar acesso a rota protegida com token inválido/malformado", async () => {
            const res = await request(app)
                .get("/users")
                .set("Authorization", "Bearer token_invalido_aleatorio_123");
            expect(res.status).to.equal(401);
        });

        it("deve negar acesso se o cabeçalho Authorization não tiver o prefixo 'Bearer'", async () => {
            const res = await request(app)
                .get("/users")
                .set("Authorization", "TokenSemBearer123");
            expect(res.status).to.equal(401);
        });

        it("deve negar acesso com token expirado", async () => {
            const secret = process.env.JWT_SECRET || "secret";
            const expiredToken = jwt.sign({ id: 1 }, secret, { expiresIn: '-1h' });

            const res = await request(app)
                .get("/users")
                .set("Authorization", `Bearer ${expiredToken}`);
            expect(res.status).to.equal(401);
        });
    });
});
