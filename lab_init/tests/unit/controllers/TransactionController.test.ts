import { expect } from "chai";
import sinon from "sinon";
import transactionController from "../../../src/controllers/TransactionController";
import purchaseService from "../../../src/services/PurchaseService";
import saleRepository from "../../../src/repository/SaleRepository";
import { Request, Response } from "express";

describe("TransactionController", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            user: { id: 1 }
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

    describe("checkout", () => {
        it("deve retornar 201 e a compra finalizada com sucesso", async () => {
            req.params = { userId: "1" };
            const mockPurchase = { id: 1, totalAmount: 100, items: [] };
            const finalizeStub = sinon.stub(purchaseService, "finalizePurchase").resolves(mockPurchase as any);

            await transactionController.checkout(req as Request, res as Response);

            expect(finalizeStub.calledWith(1)).to.be.true;
            expect((res.status as sinon.SinonStub).calledWith(201)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith(sinon.match({
                message: "Compra finalizada com sucesso!",
                purchase: mockPurchase
            }))).to.be.true;
        });

        it("deve retornar 400 se o ID do usuário for inválido", async () => {
            req.params = { userId: "abc" };
            const finalizeStub = sinon.stub(purchaseService, "finalizePurchase");

            await transactionController.checkout(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(400)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith(sinon.match({ message: "ID de usuário inválido." }))).to.be.true;
            expect(finalizeStub.called).to.be.false;
        });

        it("deve retornar 400 se o carrinho estiver vazio (erro de negócio)", async () => {
            req.params = { userId: "1" };
            sinon.stub(purchaseService, "finalizePurchase").rejects(new Error("Carrinho vazio"));

            await transactionController.checkout(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(400)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith(sinon.match({ message: "Carrinho vazio" }))).to.be.true;
        });

        it("deve retornar 500 em caso de erro genérico", async () => {
            req.params = { userId: "1" };
            sinon.stub(purchaseService, "finalizePurchase").rejects(new Error("Erro DB"));

            await transactionController.checkout(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(500)).to.be.true;
        });
    });

    describe("getPurchasesHistory", () => {
        it("deve retornar 200 e o histórico de compras", async () => {
            req.params = { userId: "1" };
            const mockPurchases = [{ id: 1, total: 50 }];
            const getPurchasesStub = sinon.stub(purchaseService, "getPurchasesByUserId").resolves(mockPurchases as any);

            await transactionController.getPurchasesHistory(req as Request, res as Response);

            expect(getPurchasesStub.calledWith(1)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith(mockPurchases)).to.be.true;
        });

        it("deve retornar 404 se não houver compras", async () => {
            req.params = { userId: "1" };
            sinon.stub(purchaseService, "getPurchasesByUserId").resolves([]);

            await transactionController.getPurchasesHistory(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(404)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith(sinon.match({ message: "Nenhuma compra encontrada para este usuário." }))).to.be.true;
        });
    });

    describe("getSalesHistory", () => {
        it("deve retornar 200 e o histórico de vendas", async () => {
            req.params = { userId: "1" };
            const mockSales = [{ id: 1, total: 50 }];
            const getSalesStub = sinon.stub(saleRepository, "getSalesBySellerId").resolves(mockSales as any);

            await transactionController.getSalesHistory(req as Request, res as Response);

            expect(getSalesStub.calledWith(1)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith(mockSales)).to.be.true;
        });

        it("deve retornar 404 se não houver vendas", async () => {
            req.params = { userId: "1" };
            sinon.stub(saleRepository, "getSalesBySellerId").resolves([]);

            await transactionController.getSalesHistory(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(404)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith(sinon.match({ message: "Nenhuma venda encontrada para este usuário." }))).to.be.true;
        });
    });
});