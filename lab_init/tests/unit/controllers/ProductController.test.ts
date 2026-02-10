import productController from "../../../src/controllers/ProductController";
import productService from "../../../src/services/ProductService";
import { Request, Response } from "express";

// Mock do Service
jest.mock("../../../src/services/ProductService");
const productServiceMock = jest.mocked(productService);

describe("ProductController", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Resetamos os objetos req e res antes de cada teste
        req = {
            body: {},
            params: {},
            // Simulando o objeto user que viria do middleware de autenticação
            user: { id: 1 } 
        } as any;

        res = {
            status: jest.fn().mockReturnThis(), // Permite encadear .status().json()
            json: jest.fn(),
            send: jest.fn()
        } as unknown as Response;
    });

    describe("createProduct", () => {
        it("deve retornar 201 e o produto criado em caso de sucesso", async () => {
            req.body = { name: "Prod", price: 10, description: "Desc", stock: 5 };
            const mockProduct = { id: 1, ...req.body };
            
            productServiceMock.createProduct.mockResolvedValue(mockProduct);

            await productController.createProduct(req as Request, res as Response);

            expect(productServiceMock.createProduct).toHaveBeenCalledWith({
                ...req.body,
                userId: 1
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockProduct);
        });

        it("deve retornar 400 se campos obrigatórios estiverem faltando", async () => {
            req.body = { name: "Prod" }; // Faltando price e description

            await productController.createProduct(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
                message: "Nome, preço e descrição são obrigatórios." 
            }));
            expect(productServiceMock.createProduct).not.toHaveBeenCalled();
        });

        it("deve retornar 500 se o serviço falhar", async () => {
            req.body = { name: "Prod", price: 10, description: "Desc" };
            productServiceMock.createProduct.mockRejectedValue(new Error("Erro interno"));

            await productController.createProduct(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Erro ao criar o produto" }));
        });
    });

    describe("getAllProducts", () => {
        it("deve retornar 200 e a lista de produtos", async () => {
            const mockProducts = [{ id: 1, name: "P1" }];
            productServiceMock.getAllProducts.mockResolvedValue(mockProducts as any);

            await productController.getAllProducts(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith(mockProducts);
            // Se não chamamos res.status(), o padrão do Express é 200, então ok não verificar explicitamente se o código não faz
        });

        it("deve retornar 500 em caso de erro", async () => {
            productServiceMock.getAllProducts.mockRejectedValue(new Error("Erro"));

            await productController.getAllProducts(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe("updateStock", () => {
        it("deve retornar 200 quando o estoque é atualizado", async () => {
            req.params = { id: "1" };
            req.body = { stock: 50 };
            const mockProduct = { id: 1, stock: 50 };
            
            productServiceMock.updateStock.mockResolvedValue(mockProduct as any);

            await productController.updateStock(req as Request, res as Response);

            expect(productServiceMock.updateStock).toHaveBeenCalledWith(1, 50);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ product: mockProduct }));
        });

        it("deve retornar 400 se o ID ou stock forem inválidos", async () => {
            req.params = { id: "abc" }; // ID inválido
            req.body = { stock: 50 };

            await productController.updateStock(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(productServiceMock.updateStock).not.toHaveBeenCalled();
        });

        it("deve retornar 404 se o produto não for encontrado", async () => {
            req.params = { id: "1" };
            req.body = { stock: 50 };
            productServiceMock.updateStock.mockResolvedValue(null);

            await productController.updateStock(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it("deve retornar 400 se o serviço lançar erro de estoque negativo", async () => {
            req.params = { id: "1" };
            req.body = { stock: -5 };
            productServiceMock.updateStock.mockRejectedValue(new Error("O estoque não pode ser negativo"));

            await productController.updateStock(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("negativo") }));
        });
    });

    describe("deleteProduct", () => {
        it("deve retornar 200 se deletado com sucesso", async () => {
            req.params = { id: "1" };
            productServiceMock.deleteProduct.mockResolvedValue(true);

            await productController.deleteProduct(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it("deve retornar 404 se não encontrado", async () => {
            req.params = { id: "1" };
            productServiceMock.deleteProduct.mockResolvedValue(false);

            await productController.deleteProduct(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it("deve retornar 409 se houver erro de chave estrangeira (FK)", async () => {
            req.params = { id: "1" };
            const error = new Error("FK Error");
            error.name = "SequelizeForeignKeyConstraintError";
            productServiceMock.deleteProduct.mockRejectedValue(error);

            await productController.deleteProduct(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(409);
        });
    });
});
