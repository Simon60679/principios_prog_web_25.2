import { expect } from "chai";
import sinon from "sinon";
import cartService from "../../../src/services/CartService";
import cartRepository from "../../../src/repository/CartRepository";

describe("CartService", () => {
    afterEach(() => {
        sinon.restore();
    });

    describe("findCartDetails", () => {
        it("deve retornar os detalhes do carrinho quando encontrado", async () => {
            const mockCart = { userId: 1, items: [] };
            const findStub = sinon.stub(cartRepository, "findCartById").resolves(mockCart as any);

            const result = await cartService.findCartDetails(1);

            expect(findStub.calledWith(1)).to.be.true;
            expect(result).to.deep.equal(mockCart);
        });

        it("deve retornar null se o carrinho não for encontrado", async () => {
            sinon.stub(cartRepository, "findCartById").resolves(null);

            const result = await cartService.findCartDetails(999);

            expect(result).to.be.null;
        });

        it("deve propagar erro se o repositório falhar", async () => {
            const error = new Error("Erro ao buscar carrinho");
            sinon.stub(cartRepository, "findCartById").rejects(error);

            try {
                await cartService.findCartDetails(1);
                expect.fail("Deveria ter lançado erro");
            } catch (err: any) {
                expect(err.message).to.equal("Erro ao buscar carrinho");
            }
        });
    });

    describe("addItemToCart", () => {
        it("deve adicionar um item ao carrinho com sucesso", async () => {
            const itemData = { userId: 1, productId: 10, quantity: 2 };
            const mockAddedItem = { ...itemData, id: 1 };
            const addStub = sinon.stub(cartRepository, "addItemToCart").resolves(mockAddedItem as any);

            const result = await cartService.addItemToCart(itemData);

            expect(addStub.calledWith(itemData)).to.be.true;
            expect(result).to.deep.equal(mockAddedItem);
        });

        it("deve propagar erro se o repositório falhar (ex: estoque insuficiente)", async () => {
            const error = new Error("Estoque insuficiente");
            sinon.stub(cartRepository, "addItemToCart").rejects(error);

            try {
                await cartService.addItemToCart({ userId: 1, productId: 1, quantity: 100 });
                expect.fail("Deveria ter lançado erro");
            } catch (err: any) {
                expect(err.message).to.equal("Estoque insuficiente");
            }
        });
    });

    describe("removeItemFromCart", () => {
        it("deve retornar true se o item for removido com sucesso", async () => {
            const removeStub = sinon.stub(cartRepository, "removeItemFromCart").resolves(1); // 1 linha afetada

            const result = await cartService.removeItemFromCart(1, 10);

            expect(removeStub.calledWith(1, 10)).to.be.true;
            expect(result).to.be.true;
        });

        it("deve retornar false se o item não for encontrado para remoção", async () => {
            sinon.stub(cartRepository, "removeItemFromCart").resolves(0); // 0 linhas afetadas

            const result = await cartService.removeItemFromCart(1, 999);

            expect(result).to.be.false;
        });

        it("deve propagar erro se houver falha no banco", async () => {
            const error = new Error("Erro ao remover");
            sinon.stub(cartRepository, "removeItemFromCart").rejects(error);

            try {
                await cartService.removeItemFromCart(1, 10);
                expect.fail("Deveria ter lançado erro");
            } catch (err: any) {
                expect(err.message).to.equal("Erro ao remover");
            }
        });
    });

    describe("decreaseItemQuantity", () => {
        it("deve retornar o item atualizado quando a quantidade é decrementada", async () => {
            const mockUpdatedItem = { productId: 10, quantity: 1 };
            const decreaseStub = sinon.stub(cartRepository, "decreaseItemQuantity").resolves(mockUpdatedItem as any);

            const result = await cartService.decreaseItemQuantity(1, 10, 1);

            expect(decreaseStub.calledWith(1, 10, 1)).to.be.true;
            expect(result).to.deep.equal(mockUpdatedItem);
        });

        it("deve retornar objeto de deleção se a quantidade chegar a zero", async () => {
            const mockDeletedResponse = { deleted: true, productId: 10 };
            sinon.stub(cartRepository, "decreaseItemQuantity").resolves(mockDeletedResponse as any);

            const result = await cartService.decreaseItemQuantity(1, 10, 5);

            expect(result).to.deep.equal(mockDeletedResponse);
        });

        it("deve propagar erro se o repositório falhar", async () => {
            const error = new Error("Erro interno");
            sinon.stub(cartRepository, "decreaseItemQuantity").rejects(error);

            try {
                await cartService.decreaseItemQuantity(1, 1, 1);
                expect.fail("Deveria ter lançado erro");
            } catch (err: any) {
                expect(err.message).to.equal("Erro interno");
            }
        });
    });
});