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
import path from "path";
import upload from './middlewares/uploadMiddleware';

const app = express();
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.patch("/users/sales/:saleId/status", authenticate, transactionController.updateSaleStatus);
app.patch("/users/purchases/:purchaseId/status", authenticate, transactionController.updatePurchaseStatus);


app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: { message: "Muitas requisições vindas deste IP, tente novamente após 15 minutos." },
  standardHeaders: true, 
  legacyHeaders: false, 
});

const createUserLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 5, 
  message: { message: "Limite de criação de contas excedido. Tente mais tarde." }
});

const checkoutLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 3, 
  message: { message: "Muitas tentativas de compra. Aguarde um momento." }
});

app.use(globalLimiter);

app.use("/auth", authRoutes);

app.get('/protected', authenticate, (req, res) => {
    res.status(200).json({ message: 'Você tem acesso a esta rota protegida.' });
});

app.post("/users", createUserLimiter, userController.createUser);
app.get("/users", authenticate, userController.getAllUsers);
app.patch("/users/:id", authenticate, userController.updateUser);
app.delete("/users/:id", authenticate, userController.deleteUser);

app.post("/products", authenticate, upload.array('images', 4), productController.createProduct);
app.get('/products/search', productController.searchProducts);
app.get('/products/:id', productController.getProductById);
app.get("/products", productController.getAllProducts);
app.patch("/products/:id/stock", authenticate, productController.updateStock);
app.delete("/products/:id", authenticate, productController.deleteProduct);
app.put("/products/:id", authenticate, upload.array('images', 4), productController.updateProduct);

app.get("/users/:userId/cart", authenticate, cartController.findCart);
app.post("/cart/add", authenticate, cartController.addItem);
app.delete("/cart/:userId/item/:productId", authenticate, cartController.removeItem);
app.patch("/cart/:userId/item/:productId/decrease", authenticate, cartController.decreaseItem);
app.patch("/cart/:userId/item/:productId/increase", authenticate, cartController.increaseItem);

// --- ROTAS DE TRANSAÇÃO (COMPRA/VENDA) ---
app.post("/checkout/:userId", checkoutLimiter, authenticate, transactionController.checkout);
app.get("/users/:userId/purchases", authenticate, transactionController.getPurchasesHistory);
app.get("/users/:userId/sales", authenticate, transactionController.getSalesHistory);
export default app;