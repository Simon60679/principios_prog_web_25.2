import userController from "../../../src/controllers/UserController";
import userService from "../../../src/services/UserService";
import { Request, Response } from "express";

// Mock do Service
jest.mock("../../../src/services/UserService");
const userServiceMock = jest.mocked(userService);

describe("UserController", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {},
            params: {}
        } as any;

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        } as unknown as Response;
    });

    describe("createUser", () => {
        it("deve retornar 201 e o usuário criado em caso de sucesso", async () => {
            req.body = { name: "Teste", email: "teste@teste.com", password: "123" };
            const mockUser = { id: 1, ...req.body };

            userServiceMock.createUser.mockResolvedValue(mockUser as any);

            await userController.createUser(req as Request, res as Response);

            expect(userServiceMock.createUser).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockUser);
        });

        it("deve retornar 400 se campos obrigatórios estiverem faltando", async () => {
            req.body = { name: "Teste" }; // Faltando email e senha

            await userController.createUser(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: "Nome, email e senha são obrigatórios."
            }));
        });

        it("deve retornar 409 se o email já estiver cadastrado", async () => {
            req.body = { name: "Teste", email: "duplicado@teste.com", password: "123" };
            const error = new Error("Unique constraint");
            error.name = "SequelizeUniqueConstraintError";

            userServiceMock.createUser.mockRejectedValue(error);

            await userController.createUser(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Este email já está cadastrado." }));
        });

        it("deve retornar 500 em caso de erro genérico", async () => {
            req.body = { name: "Teste", email: "teste@teste.com", password: "123" };
            userServiceMock.createUser.mockRejectedValue(new Error("Erro DB"));

            await userController.createUser(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe("getAllUsers", () => {
        it("deve retornar 200 e a lista de usuários", async () => {
            const mockUsers = [{ id: 1, name: "User 1" }];
            userServiceMock.getAllUsers.mockResolvedValue(mockUsers as any);

            await userController.getAllUsers(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith(mockUsers);
        });

        it("deve retornar 500 em caso de erro", async () => {
            userServiceMock.getAllUsers.mockRejectedValue(new Error("Erro"));

            await userController.getAllUsers(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe("updateUser", () => {
        it("deve retornar 200 quando o usuário é atualizado", async () => {
            req.params = { id: "1" };
            req.body = { name: "Novo Nome" };
            const mockUser = { id: 1, name: "Novo Nome" };

            userServiceMock.updateUser.mockResolvedValue(mockUser as any);

            await userController.updateUser(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ user: mockUser }));
        });

        it("deve retornar 400 se o corpo da requisição estiver vazio", async () => {
            req.params = { id: "1" };
            req.body = {}; // Vazio

            await userController.updateUser(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("vazio") }));
        });

        it("deve retornar 404 se o usuário não for encontrado", async () => {
            req.params = { id: "1" };
            req.body = { name: "Novo" };
            userServiceMock.updateUser.mockResolvedValue(null);

            await userController.updateUser(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe("deleteUser", () => {
        it("deve retornar 204 (No Content) se deletado com sucesso", async () => {
            req.params = { id: "1" };
            userServiceMock.deleteUser.mockResolvedValue(true);

            await userController.deleteUser(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });

        it("deve retornar 404 se não encontrado", async () => {
            req.params = { id: "1" };
            userServiceMock.deleteUser.mockResolvedValue(false);

            await userController.deleteUser(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
});