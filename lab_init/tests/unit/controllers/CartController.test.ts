import cartController from "../../../src/controllers/CartController";
import cartService from "../../../src/services/CartService";
import { Request, Response } from "express";

// Mock do Service
jest.mock("../../../src/services/CartService");
const cartServiceMock = jest.mocked(cartService);

describe("CartController", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {},
            params: {},
            user: { id: 1 } // Simula usuário autenticado
        } as any;

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        } as unknown as Response;
    });

    describe("findCart", () => {
        it("deve retornar 200 e os detalhes do carrinho", async () => {
            req.params = { userId: "1" };
            const mockCart = { userId: 1, items: [] };
            cartServiceMock.findCartDetails.mockResolvedValue(mockCart as any);

            await cartController.findCart(req as Request, res as Response);

            expect(cartServiceMock.findCartDetails).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(mockCart);
        });

        it("deve retornar 404 se o carrinho não for encontrado", async () => {
            req.params = { userId: "1" };
            cartServiceMock.findCartDetails.mockResolvedValue(null);

            await cartController.findCart(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Carrinho não encontrado para este usuário." }));
        });

        it("deve retornar 500 em caso de erro no serviço", async () => {
            req.params = { userId: "1" };
            cartServiceMock.findCartDetails.mockRejectedValue(new Error("Erro interno"));

            await cartController.findCart(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe("addItem", () => {
        it("deve retornar 201 e o item adicionado", async () => {
            req.body = { userId: 1, productId: 10, quantity: 2 };
            const mockItem = { ...req.body, id: 1 };

            cartServiceMock.addItemToCart.mockResolvedValue(mockItem);

            await cartController.addItem(req as Request, res as Response);

            expect(cartServiceMock.addItemToCart).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockItem);
        });

        it("deve retornar 400 se faltarem dados obrigatórios", async () => {
            req.body = { userId: 1 }; // Faltando productId e quantity

            await cartController.addItem(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("obrigatórios") }));
            expect(cartServiceMock.addItemToCart).not.toHaveBeenCalled();
        });

        it("deve retornar 500 se o serviço falhar", async () => {
            req.body = { userId: 1, productId: 10, quantity: 2 };
            cartServiceMock.addItemToCart.mockRejectedValue(new Error("Erro"));

            await cartController.addItem(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe("removeItem", () => {
        it("deve retornar 200 se o item for removido com sucesso", async () => {
            req.params = { userId: "1", productId: "10" };
            cartServiceMock.removeItemFromCart.mockResolvedValue(true);

            await cartController.removeItem(req as Request, res as Response);

            expect(cartServiceMock.removeItemFromCart).toHaveBeenCalledWith(1, 10);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it("deve retornar 404 se o item não for encontrado no carrinho", async () => {
            req.params = { userId: "1", productId: "10" };
            cartServiceMock.removeItemFromCart.mockResolvedValue(false);

            await cartController.removeItem(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe("decreaseItem", () => {
        it("deve retornar 200 e o item atualizado", async () => {
            req.params = { userId: "1", productId: "10" };
            req.body = { quantity: 1 };
            const mockUpdatedItem = { productId: 10, quantity: 1 };

            cartServiceMock.decreaseItemQuantity.mockResolvedValue(mockUpdatedItem as any);

            await cartController.decreaseItem(req as Request, res as Response);

            expect(cartServiceMock.decreaseItemQuantity).toHaveBeenCalledWith(1, 10, 1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining("atualizada"),
                item: mockUpdatedItem
            }));
        });

        it("deve retornar 400 se a quantidade não for informada", async () => {
            req.params = { userId: "1", productId: "10" };
            req.body = {}; // Sem quantity

            await cartController.decreaseItem(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});