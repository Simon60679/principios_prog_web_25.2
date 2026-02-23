import dotenv from "dotenv";
dotenv.config();

import { authenticate } from './middlewares/authMiddleware';
import authRoutes from './routes/authRoutes';
import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";
import sequelize from "./config/database";
import rateLimit from 'express-rate-limit';
import './models/associations';

import userController from "./controllers/UserController";
import productController from "./controllers/ProductController";
import cartController from "./controllers/CartController";
import transactionController from "./controllers/TransactionController";

const app = express();
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Configuração do rate limiter global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Janela de 15 minutos
  max: 100,// Limite de 100 requisições por IP dentro da janela acima
  message: {
    message: "Muitas requisições vindas deste IP, tente novamente após 15 minutos."
  },
  standardHeaders: true, // Retorna informações de limite nos headers `RateLimit-*`
  legacyHeaders: false, // Desabilita os headers `X-RateLimit-*`
});

// Configuração de lmite mais rigoroso para criação de contas
const createUserLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // Apenas 5 contas por hora por IP
  message: { message: "Limite de criação de contas excedido. Tente mais tarde." }
});

// Limite para Checkout
const checkoutLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 3, 
  message: { message: "Muitas tentativas de compra. Aguarde um momento." }
});

// Aplicar rate limiter em todas as rotas
app.use(globalLimiter);

// --- ROTAS DE AUTENTICAÇÃO ---
app.use("/auth", authRoutes);

/**
 * @swagger
 * /protected:
 *   get:
 *     summary: Rota de teste para verificar autenticação
 *     tags: [Geral]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido e acesso autorizado
 */
app.get('/protected', authenticate, (req, res) => {
    res.status(200).json({ message: 'Você tem acesso a esta rota protegida.' });
});

// --- ROTAS DO USUÁRIO ---
app.post("/users", createUserLimiter, userController.createUser);
app.get("/users", authenticate, userController.getAllUsers);
app.patch("/users/:id", authenticate, userController.updateUser);
app.delete("/users/:id", authenticate, userController.deleteUser);

app.post("/products", authenticate, productController.createProduct);
app.get("/products", productController.getAllProducts);
app.patch("/products/:id/stock", authenticate, productController.updateStock);
app.delete("/products/:id", authenticate, productController.deleteProduct);

app.get("/users/:userId/cart", authenticate, cartController.findCart);
app.post("/cart/add", authenticate, cartController.addItem);
app.delete("/cart/:userId/item/:productId", authenticate, cartController.removeItem);
app.patch("/cart/:userId/item/:productId/decrease", authenticate, cartController.decreaseItem);

// --- ROTAS DE TRANSAÇÃO (COMPRA/VENDA) ---
app.post("/checkout/:userId", checkoutLimiter, authenticate, transactionController.checkout);
app.get("/users/:userId/purchases", authenticate, transactionController.getPurchasesHistory);
app.get("/users/:userId/sales", authenticate, transactionController.getSalesHistory);

export default app;