import cartService from "../../../src/services/CartService";
import cartRepository from "../../../src/repository/CartRepository";

// Mock do CartRepository
jest.mock("../../../src/repository/CartRepository");

// Cria versão tipada do mock
const cartRepositoryMock = jest.mocked(cartRepository);

describe("CartService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("findCartDetails", () => {
        it("deve retornar os detalhes do carrinho quando encontrado", async () => {
            const mockCart = { userId: 1, items: [] };
            cartRepositoryMock.findCartById.mockResolvedValue(mockCart as any);

            const result = await cartService.findCartDetails(1);

            expect(cartRepositoryMock.findCartById).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockCart);
        });

        it("deve retornar null se o carrinho não for encontrado", async () => {
            cartRepositoryMock.findCartById.mockResolvedValue(null);

            const result = await cartService.findCartDetails(999);

            expect(result).toBeNull();
        });

        it("deve propagar erro se o repositório falhar", async () => {
            const error = new Error("Erro ao buscar carrinho");
            cartRepositoryMock.findCartById.mockRejectedValue(error);

            await expect(cartService.findCartDetails(1)).rejects.toThrow("Erro ao buscar carrinho");
        });
    });

    describe("addItemToCart", () => {
        it("deve adicionar um item ao carrinho com sucesso", async () => {
            const itemData = { userId: 1, productId: 10, quantity: 2 };
            const mockAddedItem = { ...itemData, id: 1 };

            cartRepositoryMock.addItemToCart.mockResolvedValue(mockAddedItem as any);

            const result = await cartService.addItemToCart(itemData);

            expect(cartRepositoryMock.addItemToCart).toHaveBeenCalledWith(itemData);
            expect(result).toEqual(mockAddedItem);
        });

        it("deve propagar erro se o repositório falhar (ex: estoque insuficiente)", async () => {
            const error = new Error("Estoque insuficiente");
            cartRepositoryMock.addItemToCart.mockRejectedValue(error);

            await expect(cartService.addItemToCart({ userId: 1, productId: 1, quantity: 100 }))
                .rejects.toThrow("Estoque insuficiente");
        });
    });

    describe("removeItemFromCart", () => {
        it("deve retornar true se o item for removido com sucesso", async () => {
            cartRepositoryMock.removeItemFromCart.mockResolvedValue(1); // 1 linha afetada

            const result = await cartService.removeItemFromCart(1, 10);

            expect(cartRepositoryMock.removeItemFromCart).toHaveBeenCalledWith(1, 10);
            expect(result).toBe(true);
        });

        it("deve retornar false se o item não for encontrado para remoção", async () => {
            cartRepositoryMock.removeItemFromCart.mockResolvedValue(0); // 0 linhas afetadas

            const result = await cartService.removeItemFromCart(1, 999);

            expect(result).toBe(false);
        });

        it("deve propagar erro se houver falha no banco", async () => {
            const error = new Error("Erro ao remover");
            cartRepositoryMock.removeItemFromCart.mockRejectedValue(error);

            await expect(cartService.removeItemFromCart(1, 10)).rejects.toThrow("Erro ao remover");
        });
    });

    describe("decreaseItemQuantity", () => {
        it("deve retornar o item atualizado quando a quantidade é decrementada", async () => {
            const mockUpdatedItem = { productId: 10, quantity: 1 };
            cartRepositoryMock.decreaseItemQuantity.mockResolvedValue(mockUpdatedItem as any);

            const result = await cartService.decreaseItemQuantity(1, 10, 1);

            expect(cartRepositoryMock.decreaseItemQuantity).toHaveBeenCalledWith(1, 10, 1);
            expect(result).toEqual(mockUpdatedItem);
        });

        it("deve retornar objeto de deleção se a quantidade chegar a zero", async () => {
            const mockDeletedResponse = { deleted: true, productId: 10 };
            cartRepositoryMock.decreaseItemQuantity.mockResolvedValue(mockDeletedResponse as any);

            const result = await cartService.decreaseItemQuantity(1, 10, 5);

            expect(result).toEqual(mockDeletedResponse);
        });

        it("deve propagar erro se o repositório falhar", async () => {
            cartRepositoryMock.decreaseItemQuantity.mockRejectedValue(new Error("Erro interno"));
            await expect(cartService.decreaseItemQuantity(1, 1, 1)).rejects.toThrow("Erro interno");
        });
    });
});