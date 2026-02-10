import dotenv from "dotenv";
dotenv.config();

import { authenticate } from './middlewares/authMiddleware';
import authRoutes from './routes/authRoutes';
import express from "express";
import './models/associations'; 

import userController from "./controllers/UserController";
import productController from "./controllers/ProductController";
import cartController from "./controllers/CartController";
import transactionController from "./controllers/TransactionController";

const app = express();
app.use(express.json());

// --- ROTAS DE AUTENTICAÇÃO ---
app.use("/auth", authRoutes);

app.get('/protected', authenticate, (req, res) => {
    res.status(200).json({ message: 'Você tem acesso a esta rota protegida.' });
});

// --- ROTAS DO USUÁRIO ---
app.post("/users", userController.createUser);
app.get("/users", authenticate, userController.getAllUsers);
app.patch("/users/:id", authenticate, userController.updateUser);
app.delete("/users/:id", authenticate, userController.deleteUser);

// --- ROTAS DE PRODUTO ---
app.post("/products", authenticate, productController.createProduct);
app.get("/products", productController.getAllProducts);
app.patch("/products/:id/stock", authenticate, productController.updateStock);
app.delete("/products/:id", authenticate, productController.deleteProduct);

// --- ROTAS DE CARRINHO ---
app.get("/users/:userId/cart", authenticate, cartController.findCart);
app.post("/cart/add", authenticate, cartController.addItem);
app.delete("/cart/:userId/item/:productId", authenticate, cartController.removeItem);
app.patch("/cart/:userId/item/:productId/decrease", authenticate, cartController.decreaseItem);

// --- ROTAS DE TRANSAÇÃO (COMPRA/VENDA) ---
app.post("/checkout/:userId", authenticate, transactionController.checkout);
app.get("/users/:userId/purchases", authenticate, transactionController.getPurchasesHistory);
app.get("/users/:userId/sales", authenticate, transactionController.getSalesHistory);

export default app;