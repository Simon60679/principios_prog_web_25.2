import { expect } from "chai";
import sinon from "sinon";
import productController from "../../../src/controllers/ProductController";
import productService from "../../../src/services/ProductService";
import { Request, Response } from "express";

describe("ProductController", () => {
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

    describe("createProduct", () => {
        it("deve retornar 201 e o produto criado em caso de sucesso", async () => {
            req.body = { name: "Prod", price: 10, description: "Desc", stock: 5 };
            const mockProduct = { id: 1, ...req.body };
            
            const createStub = sinon.stub(productService, "createProduct").resolves(mockProduct as any);

            await productController.createProduct(req as Request, res as Response);

            expect(createStub.calledWith({
                ...req.body,
                userId: 1
            })).to.be.true;
            expect((res.status as sinon.SinonStub).calledWith(201)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith(mockProduct)).to.be.true;
        });

        it("deve retornar 400 se campos obrigatórios estiverem faltando", async () => {
            req.body = { name: "Prod" }; // Faltando price e description
            const createStub = sinon.stub(productService, "createProduct");

            await productController.createProduct(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(400)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith(sinon.match({ 
                message: "Nome, preço e descrição são obrigatórios." 
            }))).to.be.true;
            expect(createStub.called).to.be.false;
        });

        it("deve retornar 500 se o serviço falhar", async () => {
            req.body = { name: "Prod", price: 10, description: "Desc" };
            sinon.stub(productService, "createProduct").rejects(new Error("Erro interno"));

            await productController.createProduct(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(500)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith(sinon.match({ message: "Erro ao criar o produto" }))).to.be.true;
        });
    });

    describe("getAllProducts", () => {
        it("deve retornar 200 e a lista de produtos", async () => {
            const mockProducts = [{ id: 1, name: "P1" }];
            sinon.stub(productService, "getAllProducts").resolves(mockProducts as any);

            await productController.getAllProducts(req as Request, res as Response);

            expect((res.json as sinon.SinonStub).calledWith(mockProducts)).to.be.true;
        });

        it("deve retornar 500 em caso de erro", async () => {
            sinon.stub(productService, "getAllProducts").rejects(new Error("Erro"));

            await productController.getAllProducts(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(500)).to.be.true;
        });
    });

    describe("updateStock", () => {
        it("deve retornar 200 quando o estoque é atualizado", async () => {
            req.params = { id: "1" };
            req.body = { stock: 50 };
            const mockProduct = { id: 1, stock: 50 };
            
            const updateStub = sinon.stub(productService, "updateStock").resolves(mockProduct as any);

            await productController.updateStock(req as Request, res as Response);

            expect(updateStub.calledWith(1, 50)).to.be.true;
            expect((res.status as sinon.SinonStub).calledWith(200)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith(sinon.match({ product: mockProduct }))).to.be.true;
        });

        it("deve retornar 400 se o ID ou stock forem inválidos", async () => {
            req.params = { id: "abc" }; // ID inválido
            req.body = { stock: 50 };
            const updateStub = sinon.stub(productService, "updateStock");

            await productController.updateStock(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(400)).to.be.true;
            expect(updateStub.called).to.be.false;
        });

        it("deve retornar 404 se o produto não for encontrado", async () => {
            req.params = { id: "1" };
            req.body = { stock: 50 };
            sinon.stub(productService, "updateStock").resolves(null);

            await productController.updateStock(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(404)).to.be.true;
        });

        it("deve retornar 400 se o serviço lançar erro de estoque negativo", async () => {
            req.params = { id: "1" };
            req.body = { stock: -5 };
            sinon.stub(productService, "updateStock").rejects(new Error("O estoque não pode ser negativo"));

            await productController.updateStock(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(400)).to.be.true;
            expect((res.json as sinon.SinonStub).calledWith(sinon.match({ message: sinon.match("negativo") }))).to.be.true;
        });
    });

    describe("deleteProduct", () => {
        it("deve retornar 200 se deletado com sucesso", async () => {
            req.params = { id: "1" };
            sinon.stub(productService, "deleteProduct").resolves(true);

            await productController.deleteProduct(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(200)).to.be.true;
        });

        it("deve retornar 404 se não encontrado", async () => {
            req.params = { id: "1" };
            sinon.stub(productService, "deleteProduct").resolves(false);

            await productController.deleteProduct(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(404)).to.be.true;
        });

        it("deve retornar 409 se houver erro de chave estrangeira (FK)", async () => {
            req.params = { id: "1" };
            const error = new Error("FK Error");
            error.name = "SequelizeForeignKeyConstraintError";
            sinon.stub(productService, "deleteProduct").rejects(error);

            await productController.deleteProduct(req as Request, res as Response);

            expect((res.status as sinon.SinonStub).calledWith(409)).to.be.true;
        });
    });
});
