import express from "express";
import dotenv from "dotenv";
import sequelize from "./config/database";
import './models/associations'; // Importa as associações

// Importa os Controllers
import userController from "./controllers/UserController";
import productController from "./controllers/ProductController";
import cartController from "./controllers/CartController";
import transactionController from "./controllers/TransactionController";

dotenv.config();

const app = express();
app.use(express.json());

// --- ROTAS DO USUÁRIO ---
app.post("/users", userController.createUser);
app.get("/users", userController.getAllUsers);
app.patch("/users/:id", userController.updateUser);
app.delete("/users/:id", userController.deleteUser);

// --- ROTAS DE PRODUTO ---
app.post("/products", productController.createProduct);
app.get("/products", productController.getAllProducts);
app.patch("/products/:id/stock", productController.updateStock);
app.delete("/products/:id", productController.deleteProduct);

// --- ROTAS DE CARRINHO ---
app.get("/users/:userId/cart", cartController.findCart);
app.post("/cart/add", cartController.addItem);
app.delete("/cart/:userId/item/:productId", cartController.removeItem);
app.patch("/cart/:userId/item/:productId/decrease", cartController.decreaseItem);

// --- ROTAS DE TRANSAÇÃO (COMPRA/VENDA) ---
app.post("/checkout/:userId", transactionController.checkout);
app.get("/users/:userId/purchases", transactionController.getPurchasesHistory);
app.get("/users/:userId/sales", transactionController.getSalesHistory);

// Sincronizar banco e subir servidor
const PORT = process.env.PORT || 3000;

sequelize
  .sync({ force: true })
  .then(() => {
    console.log("Banco de dados conectado e sincronizado!");
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch((error) => {
    console.error("Erro ao conectar ao banco de dados:", error);
  });