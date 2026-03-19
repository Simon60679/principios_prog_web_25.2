import { expect } from "chai";
import sinon from "sinon";
import { login, logout } from "../../../src/controllers/authController";
import User from "../../../src/models/User";
import * as authUtils from "../../../src/utils/auth";
import { tokenBlacklist } from "../../../src/utils/tokenBlacklist";
import { Request, Response } from "express";

describe("authController", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        req = {
            body: {},
            header: sinon.stub()
        } as any;

        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        } as unknown as Response;
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("login", () => {
        it("deve retornar 200 e o token se as credenciais forem válidas", async () => {
            req.body = { email: "test@test.com", password: "123" };
            const mockUser = { id: 1, name: "Test", password: "hashedPassword" };

            const findOneStub = sinon.stub(User, "findOne").resolves(mockUser as any);
            const compareStub = sinon.stub(authUtils, "comparePassword").resolves(true);
            const tokenStub = sinon.stub(authUtils, "generateToken").returns("valid_token");

            await login(req as Request, res as Response);

            expect(findOneStub.calledWith({ where: { email: "test@test.com" } })).to.be.true;
            expect(compareStub.calledWith("123", "hashedPassword")).to.be.true;
            expect((res.status as sinon.SinonStub).calledWith(200)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith({ message: "Login realizado com sucesso", token: "valid_token" })).to.be.true;
        });

        it("deve retornar 400 se o usuário não for encontrado", async () => {
            req.body = { email: "wrong@test.com", password: "123" };
            sinon.stub(User, "findOne").resolves(null);

            await login(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(400)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith({ message: "Email ou senha inválidos" })).to.be.true;
        });

        it("deve retornar 400 se a senha estiver incorreta", async () => {
            req.body = { email: "test@test.com", password: "wrong" };
            const mockUser = { id: 1, name: "Test", password: "hashedPassword" };

            sinon.stub(User, "findOne").resolves(mockUser as any);
            sinon.stub(authUtils, "comparePassword").resolves(false);

            await login(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(400)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith({ message: "Email ou senha inválidos" })).to.be.true;
        });

        it("deve retornar 500 em caso de erro interno", async () => {
            req.body = { email: "test@test.com", password: "123" };
            sinon.stub(User, "findOne").rejects(new Error("DB Error"));

            await login(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(500)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith(sinon.match({ message: "Erro ao realizar login" }))).to.be.true;
        });
    });

    describe("logout", () => {
        it("deve adicionar o token à blacklist e retornar 200", () => {
            // Simula o header Authorization
            (req.header as sinon.SinonStub).returns("Bearer valid_token");
            const addStub = sinon.stub(tokenBlacklist, "add");

            logout(req as Request, res as Response);

            expect(addStub.calledWith("valid_token")).to.be.true;
            expect((res.status as sinon.SinonStub).calledWith(200)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith({ message: "Logout realizado com sucesso" })).to.be.true;
        });
    });
});