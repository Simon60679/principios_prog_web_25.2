import { expect } from "chai";
import sinon from "sinon";
import purchaseService from "../../../src/services/PurchaseService";
import purchaseRepository from "../../../src/repository/PurchaseRepository";

describe("PurchaseService", () => {
    afterEach(() => {
        sinon.restore();
    });

    describe("finalizePurchase", () => {
        it("deve finalizar a compra com sucesso delegando para o repositório", async () => {
            const mockPurchase = { id: 1, totalAmount: 100, userId: 1, items: [] };
            const finalizeStub = sinon.stub(purchaseRepository, "finalizePurchase").resolves(mockPurchase as any);

            const result = await purchaseService.finalizePurchase(1);

            expect(finalizeStub.calledWith(1)).to.be.true;
            expect(result).to.deep.equal(mockPurchase);
        });

        it("deve propagar erro se o repositório falhar (ex: carrinho vazio ou estoque insuficiente)", async () => {
            const error = new Error("Carrinho vazio ou não encontrado.");
            sinon.stub(purchaseRepository, "finalizePurchase").rejects(error);

            try {
                await purchaseService.finalizePurchase(1);
                expect.fail("Deveria ter lançado erro");
            } catch (err: any) {
                expect(err.message).to.equal("Carrinho vazio ou não encontrado.");
            }
        });
    });

    describe("getPurchasesByUserId", () => {
        it("deve retornar o histórico de compras do usuário", async () => {
            const mockPurchases = [
                { id: 1, totalAmount: 50, items: [] },
                { id: 2, totalAmount: 150, items: [] }
            ];
            const getPurchasesStub = sinon.stub(purchaseRepository, "getPurchasesByUserId").resolves(mockPurchases as any);

            const result = await purchaseService.getPurchasesByUserId(1);

            expect(getPurchasesStub.calledWith(1)).to.be.true;
            expect(result).to.deep.equal(mockPurchases);
        });

        it("deve retornar lista vazia se não houver compras", async () => {
            sinon.stub(purchaseRepository, "getPurchasesByUserId").resolves([]);
            const result = await purchaseService.getPurchasesByUserId(1);
            expect(result).to.deep.equal([]);
        });

        it("deve propagar erro se o repositório falhar", async () => {
            const error = new Error("Erro de conexão");
            sinon.stub(purchaseRepository, "getPurchasesByUserId").rejects(error);

            try {
                await purchaseService.getPurchasesByUserId(1);
                expect.fail("Deveria ter lançado erro");
            } catch (err: any) {
                expect(err.message).to.equal("Erro de conexão");
            }
        });
    });
});