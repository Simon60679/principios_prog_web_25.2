import { expect } from "chai";
import sinon from "sinon";
import cartController from "../../../src/controllers/CartController";
import cartService from "../../../src/services/CartService";
import { Request, Response } from "express";

describe("CartController", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            user: { id: 1 } // Simula usuário autenticado
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

    describe("findCart", () => {
        it("deve retornar 200 e os detalhes do carrinho", async () => {
            req.params = { userId: "1" };
            const mockCart = { userId: 1, items: [] };
            const findStub = sinon.stub(cartService, "findCartDetails").resolves(mockCart as any);

            await cartController.findCart(req as Request, res as Response);

            expect(findStub.calledWith(1)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith(mockCart)).to.be.true;
        });

        it("deve retornar 404 se o carrinho não for encontrado", async () => {
            req.params = { userId: "1" };
            sinon.stub(cartService, "findCartDetails").resolves(null);

            await cartController.findCart(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(404)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith(sinon.match({ message: "Carrinho não encontrado para este usuário." }))).to.be.true;
        });

        it("deve retornar 500 em caso de erro no serviço", async () => {
            req.params = { userId: "1" };
            sinon.stub(cartService, "findCartDetails").rejects(new Error("Erro interno"));

            await cartController.findCart(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(500)).to.be.true;
        });
    });

    describe("addItem", () => {
        it("deve retornar 201 e o item adicionado", async () => {
            req.body = { userId: 1, productId: 10, quantity: 2 };
            const mockItem = { ...req.body, id: 1 };

            const addStub = sinon.stub(cartService, "addItemToCart").resolves(mockItem);

            await cartController.addItem(req as Request, res as Response);

            expect(addStub.calledWith(req.body)).to.be.true;
            expect((res.status as sinon.SinonStub).calledWith(201)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith(mockItem)).to.be.true;
        });

        it("deve retornar 400 se faltarem dados obrigatórios", async () => {
            req.body = { userId: 1 }; // Faltando productId e quantity
            const addStub = sinon.stub(cartService, "addItemToCart");

            await cartController.addItem(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(400)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith(sinon.match({ message: sinon.match("obrigatórios") }))).to.be.true;
            expect(addStub.called).to.be.false;
        });

        it("deve retornar 500 se o serviço falhar", async () => {
            req.body = { userId: 1, productId: 10, quantity: 2 };
            sinon.stub(cartService, "addItemToCart").rejects(new Error("Erro"));

            await cartController.addItem(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(500)).to.be.true;
        });
    });

    describe("removeItem", () => {
        it("deve retornar 200 se o item for removido com sucesso", async () => {
            req.params = { userId: "1", productId: "10" };
            const removeStub = sinon.stub(cartService, "removeItemFromCart").resolves(true);

            await cartController.removeItem(req as Request, res as Response);

            expect(removeStub.calledWith(1, 10)).to.be.true;
            expect((res.status as sinon.SinonStub).calledWith(200)).to.be.true;
        });

        it("deve retornar 404 se o item não for encontrado no carrinho", async () => {
            req.params = { userId: "1", productId: "10" };
            sinon.stub(cartService, "removeItemFromCart").resolves(false);

            await cartController.removeItem(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(404)).to.be.true;
        });
    });

    describe("decreaseItem", () => {
        it("deve retornar 200 e o item atualizado", async () => {
            req.params = { userId: "1", productId: "10" };
            req.body = { quantity: 1 };
            const mockUpdatedItem = { productId: 10, quantity: 1 };

            const decreaseStub = sinon.stub(cartService, "decreaseItemQuantity").resolves(mockUpdatedItem as any);

            await cartController.decreaseItem(req as Request, res as Response);

            expect(decreaseStub.calledWith(1, 10, 1)).to.be.true;
            expect((res.status as sinon.SinonStub).calledWith(200)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith(sinon.match({
                message: sinon.match("atualizada"),
                item: mockUpdatedItem
            }))).to.be.true;
        });

        it("deve retornar 400 se a quantidade não for informada", async () => {
            req.params = { userId: "1", productId: "10" };
            req.body = {}; // Sem quantity

            await cartController.decreaseItem(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(400)).to.be.true;
        });
    });
});