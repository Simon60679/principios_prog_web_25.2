import request from "supertest";
import { expect } from "chai";
import app from "../../src/app";
import sequelize from "../../src/config/database";

describe("E2E - Jornada Completa do Usuário (Black Box)", () => {
    before(async () => {
        await sequelize.sync({ force: true });
    });

    it("deve permitir que um vendedor anuncie e um cliente compre um produto (Fluxo Feliz)", async () => {
        const sellerRegRes = await request(app).post("/auth/register").send({
            name: "Vendedor E2E",
            email: "seller@e2e.com",
            password: "password123"
        });
        expect(sellerRegRes.status).to.equal(201);

        const sellerLoginRes = await request(app).post("/auth/login").send({
            email: "seller@e2e.com",
            password: "password123"
        });
        expect(sellerLoginRes.status).to.equal(200);
        const sellerToken = sellerLoginRes.body.token;

        const productRes = await request(app)
            .post("/products")
            .set("Authorization", `Bearer ${sellerToken}`)
            .send({
                name: "Notebook Gamer E2E",
                price: 5000.00,
                description: "Teste de fluxo completo",
                stock: 5
            });
        expect(productRes.status).to.equal(201);
        const productId = productRes.body.id;

        const buyerRegRes = await request(app).post("/auth/register").send({
            name: "Comprador E2E",
            email: "buyer@e2e.com",
            password: "password123"
        });
        expect(buyerRegRes.status).to.equal(201);
        const buyerId = buyerRegRes.body.id;

        const buyerLoginRes = await request(app).post("/auth/login").send({
            email: "buyer@e2e.com",
            password: "password123"
        });
        expect(buyerLoginRes.status).to.equal(200);
        const buyerToken = buyerLoginRes.body.token;

        const addCartRes = await request(app)
            .post("/cart/add")
            .set("Authorization", `Bearer ${buyerToken}`)
            .send({
                userId: buyerId,
                productId: productId,
                quantity: 1
            });
        expect(addCartRes.status).to.equal(201);

        const checkoutRes = await request(app)
            .post(`/checkout/${buyerId}`)
            .set("Authorization", `Bearer ${buyerToken}`);

        expect(checkoutRes.status).to.equal(201);
        expect(checkoutRes.body.message).to.include("sucesso");

        const historyRes = await request(app)
            .get(`/users/${buyerId}/purchases`)
            .set("Authorization", `Bearer ${buyerToken}`);

        expect(historyRes.status).to.equal(200);
        expect(historyRes.body).to.have.lengthOf(1);
        expect(Number(historyRes.body[0].totalAmount)).to.equal(5000.00);

        const productsRes = await request(app).get("/products");
        const product = productsRes.body.find((p: any) => p.id === productId);
        expect(product).to.not.be.undefined;
        expect(product.stock).to.equal(4);
    });

    it("deve impedir a adição de itens ao carrinho acima do limite de estoque", async () => {
        const sellerRes = await request(app).post("/auth/register").send({
            name: "Vendedor Estoque",
            email: "seller_stock@e2e.com",
            password: "123"
        });
        const sellerToken = (await request(app).post("/auth/login").send({
            email: "seller_stock@e2e.com",
            password: "123"
        })).body.token;

        const productRes = await request(app)
            .post("/products")
            .set("Authorization", `Bearer ${sellerToken}`)
            .send({
                name: "Produto Limitado",
                price: 100.00,
                description: "Apenas 1 em estoque",
                stock: 1
            });
        const productId = productRes.body.id;

        const buyerRes = await request(app).post("/auth/register").send({
            name: "Comprador Ganancioso",
            email: "buyer_greedy@e2e.com",
            password: "123"
        });
        const buyerId = buyerRes.body.id;
        const buyerToken = (await request(app).post("/auth/login").send({
            email: "buyer_greedy@e2e.com",
            password: "123"
        })).body.token;

        const addCartRes = await request(app)
            .post("/cart/add")
            .set("Authorization", `Bearer ${buyerToken}`)
            .send({
                userId: buyerId,
                productId: productId,
                quantity: 2
            });

        expect(addCartRes.status).to.equal(400);
    });

    it("deve impedir checkout com carrinho vazio", async () => {
        const buyerRes = await request(app).post("/auth/register").send({
            name: "Comprador Vazio",
            email: "buyer_empty@e2e.com",
            password: "123"
        });
        const buyerId = buyerRes.body.id;
        const buyerToken = (await request(app).post("/auth/login").send({
            email: "buyer_empty@e2e.com",
            password: "123"
        })).body.token;

        const checkoutRes = await request(app)
            .post(`/checkout/${buyerId}`)
            .set("Authorization", `Bearer ${buyerToken}`);

        expect(checkoutRes.status).to.equal(400);
    });

    it("deve manter o carrinho salvo após logout e login (Persistência)", async () => {
        const sellerRes = await request(app).post("/auth/register").send({
            name: "Vendedor Persist",
            email: "seller_persist@e2e.com",
            password: "123"
        });
        const sellerToken = (await request(app).post("/auth/login").send({
            email: "seller_persist@e2e.com",
            password: "123"
        })).body.token;

        const productRes = await request(app)
            .post("/products")
            .set("Authorization", `Bearer ${sellerToken}`)
            .send({
                name: "Produto Persistente",
                price: 50.00,
                description: "Teste Persistencia",
                stock: 10
            });
        const productId = productRes.body.id;

        const buyerRes = await request(app).post("/auth/register").send({
            name: "Comprador Persist",
            email: "buyer_persist@e2e.com",
            password: "123"
        });
        const buyerId = buyerRes.body.id;
        let buyerToken = (await request(app).post("/auth/login").send({
            email: "buyer_persist@e2e.com",
            password: "123"
        })).body.token;

        await request(app)
            .post("/cart/add")
            .set("Authorization", `Bearer ${buyerToken}`)
            .send({
                userId: buyerId,
                productId: productId,
                quantity: 2
            })
            .expect(201);

        buyerToken = null;
        const loginRes = await request(app).post("/auth/login").send({
            email: "buyer_persist@e2e.com",
            password: "123"
        });
        const newBuyerToken = loginRes.body.token;

        const cartRes = await request(app)
            .get(`/users/${buyerId}/cart`)
            .set("Authorization", `Bearer ${newBuyerToken}`);

        expect(cartRes.status).to.equal(200);
        expect(JSON.stringify(cartRes.body)).to.include("Produto Persistente");
    });

    it("deve permitir remover um item do carrinho (Fluxo de Desistência)", async () => {
        const sellerToken = (await request(app).post("/auth/login").send({
            email: "seller_persist@e2e.com",
            password: "123"
        })).body.token;

        const productRes = await request(app)
            .post("/products")
            .set("Authorization", `Bearer ${sellerToken}`)
            .send({
                name: "Produto Remover",
                price: 50.00,
                description: "Teste Remover",
                stock: 10
            });
        const productId = productRes.body.id;

        const buyerRes = await request(app).post("/auth/register").send({
            name: "Comprador Remover",
            email: "buyer_remove@e2e.com",
            password: "123"
        });
        const buyerId = buyerRes.body.id;
        const buyerToken = (await request(app).post("/auth/login").send({
            email: "buyer_remove@e2e.com",
            password: "123"
        })).body.token;

        await request(app)
            .post("/cart/add")
            .set("Authorization", `Bearer ${buyerToken}`)
            .send({
                userId: buyerId,
                productId: productId,
                quantity: 1
            })
            .expect(201);

        const deleteRes = await request(app)
            .delete(`/cart/${buyerId}/item/${productId}`)
            .set("Authorization", `Bearer ${buyerToken}`);

        expect(deleteRes.status).to.equal(200);

        const cartRes = await request(app)
            .get(`/users/${buyerId}/cart`)
            .set("Authorization", `Bearer ${buyerToken}`);

        expect(cartRes.status).to.equal(200);
        expect(JSON.stringify(cartRes.body)).to.not.include("Produto Remover");
    });

    it("deve permitir diminuir a quantidade de um item no carrinho (Edição)", async () => {
        const sellerToken = (await request(app).post("/auth/login").send({
            email: "seller_persist@e2e.com",
            password: "123"
        })).body.token;

        const productRes = await request(app).post("/products")
            .set("Authorization", `Bearer ${sellerToken}`)
            .send({ name: "Produto Decrease", price: 50, description: "Desc", stock: 10 });
        const productId = productRes.body.id;

        const buyerRes = await request(app).post("/auth/register").send({
            name: "Comprador Decrease",
            email: "buyer_decrease@e2e.com",
            password: "123"
        });
        const buyerId = buyerRes.body.id;
        const buyerToken = (await request(app).post("/auth/login").send({
            email: "buyer_decrease@e2e.com",
            password: "123"
        })).body.token;

        await request(app).post("/cart/add")
            .set("Authorization", `Bearer ${buyerToken}`)
            .send({ userId: buyerId, productId, quantity: 2 })
            .expect(201);

        const decreaseRes = await request(app)
            .patch(`/cart/${buyerId}/item/${productId}/decrease`)
            .set("Authorization", `Bearer ${buyerToken}`)
            .send({ quantity: 1 });

        expect(decreaseRes.status).to.equal(200);
        expect(decreaseRes.body.message).to.include("atualizada");

        const cartRes = await request(app)
            .get(`/users/${buyerId}/cart`)
            .set("Authorization", `Bearer ${buyerToken}`);

        expect(JSON.stringify(cartRes.body)).to.include('"quantity":1');
    });

    it("deve impedir que um usuário acesse o carrinho de outro (Isolamento de Dados)", async () => {
        const attackerToken = (await request(app).post("/auth/login").send({
            email: "buyer_decrease@e2e.com",
            password: "123"
        })).body.token;

        const victimId = 1;

        const res = await request(app)
            .get(`/users/${victimId}/cart`)
            .set("Authorization", `Bearer ${attackerToken}`);

        expect(res.status).to.equal(403);
    });
});