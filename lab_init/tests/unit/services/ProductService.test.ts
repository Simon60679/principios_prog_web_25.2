import productService from "../../../src/services/ProductService";
import productRepository from "../../../src/repository/ProductRepository";

// Mock do ProductRepository
jest.mock("../../../src/repository/ProductRepository");

// Cria versão tipada do mock
const productRepositoryMock = jest.mocked(productRepository);

describe("ProductService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createProduct", () => {
        it("deve criar um produto com sucesso", async () => {
            const productData = {
                name: "Lâmpada LED",
                price: 29.90,
                description: "Econômica",
                stock: 100,
                userId: 1
            };

            const mockCreatedProduct = { id: 1, ...productData };
            productRepositoryMock.createProduct.mockResolvedValue(mockCreatedProduct as any);

            const result = await productService.createProduct(productData);

            expect(productRepositoryMock.createProduct).toHaveBeenCalledWith(productData);
            expect(result).toEqual(mockCreatedProduct);
        });

        it("deve propagar erro se o repositório falhar", async () => {
            const error = new Error("Erro ao criar produto");
            productRepositoryMock.createProduct.mockRejectedValue(error);

            await expect(productService.createProduct({})).rejects.toThrow("Erro ao criar produto");
        });
    });

    describe("getAllProducts", () => {
        it("deve retornar uma lista de produtos", async () => {
            const mockProducts = [{ id: 1, name: "Prod 1" }, { id: 2, name: "Prod 2" }];
            productRepositoryMock.getAllProducts.mockResolvedValue(mockProducts as any);

            const result = await productService.getAllProducts();

            expect(result).toEqual(mockProducts);
        });
    });

    describe("updateStock", () => {
        it("deve retornar null se o produto não for encontrado (0 linhas afetadas)", async () => {
            productRepositoryMock.updateStock.mockResolvedValue(0);

            const result = await productService.updateStock(999, 50);

            expect(productRepositoryMock.updateStock).toHaveBeenCalledWith(999, 50);
            expect(productRepositoryMock.findProductById).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });

        it("deve retornar o produto atualizado se o update for bem sucedido", async () => {
            const mockProduct = { id: 1, stock: 50 };

            // 1. Simula que o update afetou 1 linha
            productRepositoryMock.updateStock.mockResolvedValue(1);
            // 2. Simula o retorno do produto atualizado
            productRepositoryMock.findProductById.mockResolvedValue(mockProduct as any);

            const result = await productService.updateStock(1, 50);

            expect(productRepositoryMock.updateStock).toHaveBeenCalledWith(1, 50);
            expect(productRepositoryMock.findProductById).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockProduct);
        });

        it("deve propagar erro se o repositório lançar exceção (ex: estoque negativo)", async () => {
            const error = new Error("O estoque não pode ser negativo.");
            productRepositoryMock.updateStock.mockRejectedValue(error);

            await expect(productService.updateStock(1, -5)).rejects.toThrow("O estoque não pode ser negativo.");
        });
    });

    describe("deleteProduct", () => {
        it("deve retornar true se o produto for deletado com sucesso", async () => {
            productRepositoryMock.deleteProduct.mockResolvedValue(1); // 1 linha deletada

            const result = await productService.deleteProduct(1);

            expect(productRepositoryMock.deleteProduct).toHaveBeenCalledWith(1);
            expect(result).toBe(true);
        });

        it("deve retornar false se o produto não for encontrado para deleção", async () => {
            productRepositoryMock.deleteProduct.mockResolvedValue(0); // 0 linhas deletadas

            const result = await productService.deleteProduct(999);

            expect(result).toBe(false);
        });

        it("deve propagar erro se houver falha no banco", async () => {
            const error = new Error("Erro de FK");
            productRepositoryMock.deleteProduct.mockRejectedValue(error);

            await expect(productService.deleteProduct(1)).rejects.toThrow("Erro de FK");
        });
    });
});