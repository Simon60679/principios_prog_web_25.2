import purchaseService from "../../../src/services/PurchaseService";
import purchaseRepository from "../../../src/repository/PurchaseRepository";

// Mock do PurchaseRepository
jest.mock("../../../src/repository/PurchaseRepository");

// Cria versão tipada do mock
const purchaseRepositoryMock = jest.mocked(purchaseRepository);

describe("PurchaseService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("finalizePurchase", () => {
        it("deve finalizar a compra com sucesso delegando para o repositório", async () => {
            const mockPurchase = { id: 1, totalAmount: 100, userId: 1, items: [] };
            purchaseRepositoryMock.finalizePurchase.mockResolvedValue(mockPurchase as any);

            const result = await purchaseService.finalizePurchase(1);

            expect(purchaseRepositoryMock.finalizePurchase).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockPurchase);
        });

        it("deve propagar erro se o repositório falhar (ex: carrinho vazio ou estoque insuficiente)", async () => {
            const error = new Error("Carrinho vazio ou não encontrado.");
            purchaseRepositoryMock.finalizePurchase.mockRejectedValue(error);

            await expect(purchaseService.finalizePurchase(1))
                .rejects.toThrow("Carrinho vazio ou não encontrado.");
        });
    });

    describe("getPurchasesByUserId", () => {
        it("deve retornar o histórico de compras do usuário", async () => {
            const mockPurchases = [
                { id: 1, totalAmount: 50, items: [] },
                { id: 2, totalAmount: 150, items: [] }
            ];
            purchaseRepositoryMock.getPurchasesByUserId.mockResolvedValue(mockPurchases as any);

            const result = await purchaseService.getPurchasesByUserId(1);

            expect(purchaseRepositoryMock.getPurchasesByUserId).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockPurchases);
        });

        it("deve retornar lista vazia se não houver compras", async () => {
            purchaseRepositoryMock.getPurchasesByUserId.mockResolvedValue([]);
            const result = await purchaseService.getPurchasesByUserId(1);
            expect(result).toEqual([]);
        });

        it("deve propagar erro se o repositório falhar", async () => {
            purchaseRepositoryMock.getPurchasesByUserId.mockRejectedValue(new Error("Erro de conexão"));
            await expect(purchaseService.getPurchasesByUserId(1)).rejects.toThrow("Erro de conexão");
        });
    });
});