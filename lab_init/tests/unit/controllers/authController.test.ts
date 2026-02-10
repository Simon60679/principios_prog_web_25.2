import { login, logout } from "../../../src/controllers/authController";
import User from "../../../src/models/User";
import { comparePassword, generateToken } from "../../../src/utils/auth";
import { tokenBlacklist } from "../../../src/utils/tokenBlacklist";
import { Request, Response } from "express";

// Mock das dependências
jest.mock("../../../src/models/User");
jest.mock("../../../src/utils/auth");
jest.mock("../../../src/utils/tokenBlacklist", () => ({
    tokenBlacklist: {
        add: jest.fn(),
    }
}));

const UserMock = jest.mocked(User);
const comparePasswordMock = jest.mocked(comparePassword);
const generateTokenMock = jest.mocked(generateToken);
const tokenBlacklistMock = jest.mocked(tokenBlacklist);

describe("authController", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {},
            header: jest.fn()
        } as any;

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;
    });

    describe("login", () => {
        it("deve retornar 200 e o token se as credenciais forem válidas", async () => {
            req.body = { email: "test@test.com", password: "123" };
            const mockUser = { id: 1, name: "Test", password: "hashedPassword" };

            UserMock.findOne.mockResolvedValue(mockUser as any);
            comparePasswordMock.mockResolvedValue(true);
            generateTokenMock.mockReturnValue("valid_token");

            await login(req as Request, res as Response);

            expect(UserMock.findOne).toHaveBeenCalledWith({ where: { email: "test@test.com" } });
            expect(comparePasswordMock).toHaveBeenCalledWith("123", "hashedPassword");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Login realizado com sucesso", token: "valid_token" });
        });

        it("deve retornar 400 se o usuário não for encontrado", async () => {
            req.body = { email: "wrong@test.com", password: "123" };
            UserMock.findOne.mockResolvedValue(null);

            await login(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Email ou senha inválidos" });
        });

        it("deve retornar 400 se a senha estiver incorreta", async () => {
            req.body = { email: "test@test.com", password: "wrong" };
            const mockUser = { id: 1, name: "Test", password: "hashedPassword" };

            UserMock.findOne.mockResolvedValue(mockUser as any);
            comparePasswordMock.mockResolvedValue(false);

            await login(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Email ou senha inválidos" });
        });

        it("deve retornar 500 em caso de erro interno", async () => {
            req.body = { email: "test@test.com", password: "123" };
            UserMock.findOne.mockRejectedValue(new Error("DB Error"));

            await login(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Erro ao realizar login" }));
        });
    });

    describe("logout", () => {
        it("deve adicionar o token à blacklist e retornar 200", () => {
            // Simula o header Authorization
            (req.header as jest.Mock).mockReturnValue("Bearer valid_token");

            logout(req as Request, res as Response);

            expect(tokenBlacklistMock.add).toHaveBeenCalledWith("valid_token");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Logout realizado com sucesso" });
        });
    });
});