import transactionController from "../../../src/controllers/TransactionController";
import purchaseService from "../../../src/services/PurchaseService";
import saleRepository from "../../../src/repository/SaleRepository";
import { Request, Response } from "express";

// Mock das dependências
jest.mock("../../../src/services/PurchaseService");
jest.mock("../../../src/repository/SaleRepository");

const purchaseServiceMock = jest.mocked(purchaseService);
const saleRepositoryMock = jest.mocked(saleRepository);

describe("TransactionController", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {},
            params: {},
            user: { id: 1 }
        } as any;

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        } as unknown as Response;
    });

    describe("checkout", () => {
        it("deve retornar 201 e a compra finalizada com sucesso", async () => {
            req.params = { userId: "1" };
            const mockPurchase = { id: 1, totalAmount: 100, items: [] };
            purchaseServiceMock.finalizePurchase.mockResolvedValue(mockPurchase as any);

            await transactionController.checkout(req as Request, res as Response);

            expect(purchaseServiceMock.finalizePurchase).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: "Compra finalizada com sucesso!",
                purchase: mockPurchase
            }));
        });

        it("deve retornar 400 se o ID do usuário for inválido", async () => {
            req.params = { userId: "abc" };

            await transactionController.checkout(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "ID de usuário inválido." });
        });

        it("deve retornar 400 se o carrinho estiver vazio (erro de negócio)", async () => {
            req.params = { userId: "1" };
            purchaseServiceMock.finalizePurchase.mockRejectedValue(new Error("Carrinho vazio"));

            await transactionController.checkout(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Carrinho vazio" });
        });

        it("deve retornar 500 em caso de erro genérico", async () => {
            req.params = { userId: "1" };
            purchaseServiceMock.finalizePurchase.mockRejectedValue(new Error("Erro DB"));

            await transactionController.checkout(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe("getPurchasesHistory", () => {
        it("deve retornar 200 e o histórico de compras", async () => {
            req.params = { userId: "1" };
            const mockPurchases = [{ id: 1, total: 50 }];
            purchaseServiceMock.getPurchasesByUserId.mockResolvedValue(mockPurchases as any);

            await transactionController.getPurchasesHistory(req as Request, res as Response);

            expect(purchaseServiceMock.getPurchasesByUserId).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(mockPurchases);
        });

        it("deve retornar 404 se não houver compras", async () => {
            req.params = { userId: "1" };
            purchaseServiceMock.getPurchasesByUserId.mockResolvedValue([]);

            await transactionController.getPurchasesHistory(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Nenhuma compra encontrada para este usuário." });
        });
    });

    describe("getSalesHistory", () => {
        it("deve retornar 200 e o histórico de vendas", async () => {
            req.params = { userId: "1" };
            const mockSales = [{ id: 1, total: 50 }];
            saleRepositoryMock.getSalesBySellerId.mockResolvedValue(mockSales as any);

            await transactionController.getSalesHistory(req as Request, res as Response);

            expect(saleRepositoryMock.getSalesBySellerId).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(mockSales);
        });

        it("deve retornar 404 se não houver vendas", async () => {
            req.params = { userId: "1" };
            saleRepositoryMock.getSalesBySellerId.mockResolvedValue([]);

            await transactionController.getSalesHistory(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Nenhuma venda encontrada para este usuário." });
        });
    });
});