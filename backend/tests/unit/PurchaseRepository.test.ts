import { expect } from "chai";
import sinon from "sinon";
import { PurchaseRepository } from "../../src/repository/PurchaseRepository";
import sequelize from "../../src/config/database";
import Cart from "../../src/models/Cart";
import Product from "../../src/models/Product";
import Purchase from "../../src/models/Purchase";
import Sale from "../../src/models/Sale";
import CartItem from "../../src/models/CartItem";
import PurchaseItem from "../../src/models/PurchaseItem";
import SaleItem from "../../src/models/SaleItem";

describe("Unit - PurchaseRepository", () => {
    let purchaseRepository: PurchaseRepository;
    let transaction: any;

    beforeEach(() => {
        purchaseRepository = new PurchaseRepository();
        transaction = {
            commit: sinon.stub().resolves(),
            rollback: sinon.stub().resolves(),
        };
        sinon.stub(sequelize, "transaction").resolves(transaction);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("finalizePurchase", () => {
        it("deve processar uma compra, criar vendas e limpar o carrinho com sucesso", async () => {
            const mockCart = {
                items: [
                    {
                        quantity: 2,
                        product: {
                            id: 101,
                            name: "Produto A",
                            price: 50,
                            stock: 10,
                            userId: 1,
                            seller: { id: 1, name: "Vendedor 1" },
                            update: sinon.stub().resolves(),
                        }
                    }
                ]
            };
            const mockPurchaseRecord = { id: 1, update: sinon.stub().resolves() };

            const findCartStub = sinon.stub(Cart, "findByPk").resolves(mockCart as any);
            const findPurchaseStub = sinon.stub(Purchase, "findByPk").resolves(mockPurchaseRecord as any);
            const createPurchaseStub = sinon.stub(Purchase, "create").resolves(mockPurchaseRecord as any);
            const createSaleStub = sinon.stub(Sale, "create").resolves({ id: 1 } as any);
            const bulkCreatePurchaseItemStub = sinon.stub(PurchaseItem, "bulkCreate").resolves();
            const bulkCreateSaleItemStub = sinon.stub(SaleItem, "bulkCreate").resolves();
            const destroyCartItemStub = sinon.stub(CartItem, "destroy").resolves();

            await purchaseRepository.finalizePurchase(1);

            expect(findCartStub.calledOnceWith(1)).to.be.true;
            expect(findPurchaseStub.calledOnce).to.be.true;
            expect(createPurchaseStub.calledOnce).to.be.true;
            expect(mockCart.items[0].product.update.calledWith({ stock: 8 })).to.be.true;
            expect(createSaleStub.calledOnce).to.be.true;
            expect((createSaleStub.firstCall!.args[0] as any).totalAmount).to.equal(100);
            expect(bulkCreateSaleItemStub.calledOnce).to.be.true;
            expect(bulkCreatePurchaseItemStub.calledOnce).to.be.true;
            expect(destroyCartItemStub.calledWith(sinon.match({ where: { cartId: 1 } }))).to.be.true;
            expect(transaction.commit.calledOnce).to.be.true;
            expect(transaction.rollback.called).to.be.false;
        });

        it("deve fazer rollback da transação se o estoque for insuficiente", async () => {
            const mockCart = {
                items: [{
                    quantity: 15,
                    product: { stock: 10, userId: 1, seller: { id: 1 } }
                }]
            };

            sinon.stub(Cart, "findByPk").resolves(mockCart as any);
            sinon.stub(Purchase, "create").resolves({ id: 1 } as any);

            try {
                await purchaseRepository.finalizePurchase(1);
                expect.fail("Deveria ter lançado um erro de estoque insuficiente");
            } catch (error: any) {
                expect(error.message).to.include("Estoque insuficiente");
            }

            expect(transaction.commit.called).to.be.false;
            expect(transaction.rollback.calledOnce).to.be.true;
        });

        it("deve criar vendas separadas para múltiplos vendedores", async () => {
            const mockCart = {
                items: [
                    {
                        quantity: 1,
                        product: {
                            id: 101, name: "Produto A", price: 50, stock: 10, userId: 1,
                            seller: { id: 1 }, update: sinon.stub().resolves(),
                        }
                    },
                    {
                        quantity: 2,
                        product: {
                            id: 102, name: "Produto B", price: 100, stock: 10, userId: 2,
                            seller: { id: 2 }, update: sinon.stub().resolves(),
                        }
                    }
                ]
            };
            const mockPurchaseRecord = { id: 1, update: sinon.stub().resolves() };

            sinon.stub(Cart, "findByPk").resolves(mockCart as any);
            sinon.stub(Purchase, "findByPk").resolves(mockPurchaseRecord as any);
            sinon.stub(Purchase, "create").resolves(mockPurchaseRecord as any);
            const createSaleStub = sinon.stub(Sale, "create").resolves({ id: 1 } as any);
            sinon.stub(PurchaseItem, "bulkCreate").resolves();
            sinon.stub(SaleItem, "bulkCreate").resolves();
            sinon.stub(CartItem, "destroy").resolves();

            await purchaseRepository.finalizePurchase(99);

            expect(createSaleStub.calledTwice).to.be.true;
            expect((createSaleStub.getCall(0).args[0] as any).sellerId).to.equal(1);
            expect((createSaleStub.getCall(0).args[0] as any).totalAmount).to.equal(50);
            expect((createSaleStub.getCall(1).args[0] as any).sellerId).to.equal(2);
            expect((createSaleStub.getCall(1).args[0] as any).totalAmount).to.equal(200);
            expect(transaction.commit.calledOnce).to.be.true;
            expect(transaction.rollback.called).to.be.false;
        });

        it("deve fazer rollback se o carrinho estiver vazio", async () => {
            sinon.stub(Cart, "findByPk").resolves({ items: [] } as any);

            try {
                await purchaseRepository.finalizePurchase(1);
                expect.fail("Deveria ter lançado erro");
            } catch (error: any) {
                expect(error.message).to.include("Carrinho vazio");
            }

            expect(transaction.commit.called).to.be.false;
            expect(transaction.rollback.calledOnce).to.be.true;
        });
    });
});