import { expect } from "chai";
import sinon from "sinon";
import userController from "../../../src/controllers/UserController";
import userService from "../../../src/services/UserService";
import { Request, Response } from "express";

describe("UserController", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        req = {
            body: {},
            params: {}
        } as any;

        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub(),
            send: sinon.stub()
        } as unknown as Response;
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("createUser", () => {
        it("deve retornar 201 e o usuário criado em caso de sucesso", async () => {
            req.body = { name: "Teste", email: "teste@teste.com", password: "123" };
            const mockUser = { id: 1, ...req.body };

            const createStub = sinon.stub(userService, "createUser").resolves(mockUser as any);

            await userController.createUser(req as Request, res as Response);

            expect(createStub.calledWith(req.body)).to.be.true;
            expect((res.status as sinon.SinonStub).calledWith(201)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith(mockUser)).to.be.true;
        });

        it("deve retornar 400 se campos obrigatórios estiverem faltando", async () => {
            req.body = { name: "Teste" }; // Faltando email e senha

            await userController.createUser(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(400)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith(sinon.match({
                message: "Nome, email e senha são obrigatórios."
            }))).to.be.true;
        });

        it("deve retornar 409 se o email já estiver cadastrado", async () => {
            req.body = { name: "Teste", email: "duplicado@teste.com", password: "123" };
            const error = new Error("Unique constraint");
            error.name = "SequelizeUniqueConstraintError";

            sinon.stub(userService, "createUser").rejects(error);

            await userController.createUser(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(409)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith(sinon.match({ message: "Este email já está cadastrado." }))).to.be.true;
        });

        it("deve retornar 500 em caso de erro genérico", async () => {
            req.body = { name: "Teste", email: "teste@teste.com", password: "123" };
            sinon.stub(userService, "createUser").rejects(new Error("Erro DB"));

            await userController.createUser(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(500)).to.be.true;
        });
    });

    describe("getAllUsers", () => {
        it("deve retornar 200 e a lista de usuários", async () => {
            const mockUsers = [{ id: 1, name: "User 1" }];
            sinon.stub(userService, "getAllUsers").resolves(mockUsers as any);

            await userController.getAllUsers(req as Request, res as Response);

            expect((res.json as sinon.SinonStub).calledWith(mockUsers)).to.be.true;
        });

        it("deve retornar 500 em caso de erro", async () => {
            sinon.stub(userService, "getAllUsers").rejects(new Error("Erro"));

            await userController.getAllUsers(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(500)).to.be.true;
        });
    });

    describe("updateUser", () => {
        it("deve retornar 200 quando o usuário é atualizado", async () => {
            req.params = { id: "1" };
            req.body = { name: "Novo Nome" };
            const mockUser = { id: 1, name: "Novo Nome" };

            sinon.stub(userService, "updateUser").resolves(mockUser as any);

            await userController.updateUser(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(200)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith(sinon.match({ user: mockUser }))).to.be.true;
        });

        it("deve retornar 400 se o corpo da requisição estiver vazio", async () => {
            req.params = { id: "1" };
            req.body = {}; // Vazio

            await userController.updateUser(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(400)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith(sinon.match({ message: sinon.match("vazio") }))).to.be.true;
        });

        it("deve retornar 404 se o usuário não for encontrado", async () => {
            req.params = { id: "1" };
            req.body = { name: "Novo" };
            sinon.stub(userService, "updateUser").resolves(null);

            await userController.updateUser(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(404)).to.be.true;
        });
    });

    describe("deleteUser", () => {
        it("deve retornar 204 (No Content) se deletado com sucesso", async () => {
            req.params = { id: "1" };
            sinon.stub(userService, "deleteUser").resolves(true);

            await userController.deleteUser(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(204)).to.be.true;
            expect((res.send as sinon.SinonStub).called).to.be.true;
        });

        it("deve retornar 404 se não encontrado", async () => {
            req.params = { id: "1" };
            sinon.stub(userService, "deleteUser").resolves(false);

            await userController.deleteUser(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(404)).to.be.true;
        });
    });
});