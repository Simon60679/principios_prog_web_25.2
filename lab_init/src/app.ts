import dotenv from "dotenv";
dotenv.config();

import { authenticate } from './middlewares/authMiddleware';
import authRoutes from './routes/authRoutes';
import express from "express";
import './models/associations';
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";

import userController from "./controllers/UserController";
import productController from "./controllers/ProductController";
import cartController from "./controllers/CartController";
import transactionController from "./controllers/TransactionController";

const app = express();
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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

app.post("/users", userController.createUser);
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

app.post("/checkout/:userId", authenticate, transactionController.checkout);
app.get("/users/:userId/purchases", authenticate, transactionController.getPurchasesHistory);
app.get("/users/:userId/sales", authenticate, transactionController.getSalesHistory);

export default app;