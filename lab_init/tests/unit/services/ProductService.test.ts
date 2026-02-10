import { expect } from "chai";
import sinon from "sinon";
import productService from "../../../src/services/ProductService";
import productRepository from "../../../src/repository/ProductRepository";

describe("ProductService", () => {
    afterEach(() => {
        sinon.restore();
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
            const createStub = sinon.stub(productRepository, "createProduct").resolves(mockCreatedProduct as any);

            const result = await productService.createProduct(productData);

            expect(createStub.calledWith(productData)).to.be.true;
            expect(result).to.deep.equal(mockCreatedProduct);
        });

        it("deve propagar erro se o repositório falhar", async () => {
            const error = new Error("Erro ao criar produto");
            sinon.stub(productRepository, "createProduct").rejects(error);

            try {
                await productService.createProduct({} as any);
                expect.fail("Deveria ter lançado erro");
            } catch (err: any) {
                expect(err.message).to.equal("Erro ao criar produto");
            }
        });
    });

    describe("getAllProducts", () => {
        it("deve retornar uma lista de produtos", async () => {
            const mockProducts = [{ id: 1, name: "Prod 1" }, { id: 2, name: "Prod 2" }];
            sinon.stub(productRepository, "getAllProducts").resolves(mockProducts as any);

            const result = await productService.getAllProducts();

            expect(result).to.deep.equal(mockProducts);
        });

        it("deve retornar uma lista vazia se não houver produtos cadastrados", async () => {
            sinon.stub(productRepository, "getAllProducts").resolves([]);

            const result = await productService.getAllProducts();

            expect(result).to.deep.equal([]);
        });

        it("deve propagar erro se o repositório falhar", async () => {
            const error = new Error("Erro de conexão");
            sinon.stub(productRepository, "getAllProducts").rejects(error);

            try {
                await productService.getAllProducts();
                expect.fail("Deveria ter lançado erro");
            } catch (err: any) {
                expect(err.message).to.equal("Erro de conexão");
            }
        });
    });

    describe("findProductById", () => {
        it("deve retornar o produto quando encontrado", async () => {
            const mockProduct = { id: 1, name: "Produto Teste" };
            const findStub = sinon.stub(productRepository, "findProductById").resolves(mockProduct as any);

            const result = await productService.findProductById(1);

            expect(findStub.calledWith(1)).to.be.true;
            expect(result).to.deep.equal(mockProduct);
        });

        it("deve retornar null se o produto não for encontrado", async () => {
            sinon.stub(productRepository, "findProductById").resolves(null);

            const result = await productService.findProductById(999);

            expect(result).to.be.null;
        });

        it("deve propagar erro se o repositório falhar", async () => {
            const error = new Error("Erro de conexão");
            sinon.stub(productRepository, "findProductById").rejects(error);

            try {
                await productService.findProductById(1);
                expect.fail("Deveria ter lançado erro");
            } catch (err: any) {
                expect(err.message).to.equal("Erro de conexão");
            }
        });
    });

    describe("updateStock", () => {
        it("deve retornar null se o produto não for encontrado (0 linhas afetadas)", async () => {
            const updateStub = sinon.stub(productRepository, "updateStock").resolves(0);
            const findStub = sinon.stub(productRepository, "findProductById");

            const result = await productService.updateStock(999, 50);

            expect(updateStub.calledWith(999, 50)).to.be.true;
            expect(findStub.called).to.be.false;
            expect(result).to.be.null;
        });

        it("deve retornar o produto atualizado se o update for bem sucedido", async () => {
            const mockProduct = { id: 1, stock: 50 };

            // 1. Simula que o update afetou 1 linha
            const updateStub = sinon.stub(productRepository, "updateStock").resolves(1);
            // 2. Simula o retorno do produto atualizado
            const findStub = sinon.stub(productRepository, "findProductById").resolves(mockProduct as any);

            const result = await productService.updateStock(1, 50);

            expect(updateStub.calledWith(1, 50)).to.be.true;
            expect(findStub.calledWith(1)).to.be.true;
            expect(result).to.deep.equal(mockProduct);
        });

        it("deve propagar erro se o repositório lançar exceção (ex: estoque negativo)", async () => {
            const error = new Error("O estoque não pode ser negativo.");
            sinon.stub(productRepository, "updateStock").rejects(error);

            try {
                await productService.updateStock(1, -5);
                expect.fail("Deveria ter lançado erro");
            } catch (err: any) {
                expect(err.message).to.equal("O estoque não pode ser negativo.");
            }
        });

        it("deve retornar null se o produto for deletado logo após a atualização de estoque (concorrência)", async () => {
            sinon.stub(productRepository, "updateStock").resolves(1); // Update diz que alterou 1 linha
            sinon.stub(productRepository, "findProductById").resolves(null); // Mas o produto sumiu antes do select

            const result = await productService.updateStock(1, 10);

            expect(result).to.be.null;
        });

        it("deve propagar erro se falhar ao buscar o produto atualizado (após o update)", async () => {
            const error = new Error("Erro ao buscar atualizado");

            sinon.stub(productRepository, "updateStock").resolves(1); // Update ok
            sinon.stub(productRepository, "findProductById").rejects(error); // Busca falha

            try {
                await productService.updateStock(1, 10);
                expect.fail("Deveria ter lançado erro");
            } catch (err: any) {
                expect(err.message).to.equal("Erro ao buscar atualizado");
            }
        });

        it("deve garantir que a busca do produto ocorre APÓS a atualização do estoque", async () => {
            const updateStub = sinon.stub(productRepository, "updateStock").resolves(1);
            const findStub = sinon.stub(productRepository, "findProductById").resolves({ id: 1, stock: 10 } as any);

            await productService.updateStock(1, 10);

            expect(findStub.calledAfter(updateStub)).to.be.true;
        });

        it("não deve tentar buscar o produto se a atualização falhar", async () => {
            sinon.stub(productRepository, "updateStock").rejects(new Error("Falha no update"));
            const findStub = sinon.stub(productRepository, "findProductById");

            try {
                await productService.updateStock(1, 10);
                expect.fail("Deveria ter lançado erro");
            } catch (err: any) {
                expect(err.message).to.equal("Falha no update");
            }
            expect(findStub.called).to.be.false;
        });
    });

    describe("deleteProduct", () => {
        it("deve retornar true se o produto for deletado com sucesso", async () => {
            const deleteStub = sinon.stub(productRepository, "deleteProduct").resolves(1); // 1 linha deletada

            const result = await productService.deleteProduct(1);

            expect(deleteStub.calledWith(1)).to.be.true;
            expect(result).to.be.true;
        });

        it("deve retornar false se o produto não for encontrado para deleção", async () => {
            sinon.stub(productRepository, "deleteProduct").resolves(0); // 0 linhas deletadas

            const result = await productService.deleteProduct(999);

            expect(result).to.be.false;
        });

        it("deve propagar erro se houver falha no banco", async () => {
            const error = new Error("Erro de FK");
            sinon.stub(productRepository, "deleteProduct").rejects(error);

            try {
                await productService.deleteProduct(1);
                expect.fail("Deveria ter lançado erro");
            } catch (err: any) {
                expect(err.message).to.equal("Erro de FK");
            }
        });
    });
});