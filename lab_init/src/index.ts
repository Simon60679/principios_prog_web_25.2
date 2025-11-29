import express, { Request, Response } from "express";
import dotenv from "dotenv";
import sequelize from "./config/database";
import userRepository from "./repositories/UserRepository";
import productRepository from "./repositories/ProductRepository";
import './models/associations';

dotenv.config();

const app = express();
app.use(express.json());

// Rota para criar usuário
app.post("/users", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Validação básica de entrada
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Nome, email e senha são obrigatórios." });
    }

    const user = await userRepository.createUser({ name, email, password });
    return res.status(201).json(user);
  } catch (error: any) {
    console.error("Erro ao criar usuário:", error);
    return res
      .status(500)
      .json({ message: "Erro ao criar o usuário", error: error.message });
  }
});

// Rota para listar usuários
app.get("/users", async (req: Request, res: Response) => {
  try {
    const users = await userRepository.getAllUsers();
    return res.json(users);
  } catch (error: any) {
    console.error("Erro ao obter usuários:", error);
    return res
      .status(500)
      .json({ message: "Erro ao obter os usuários", error: error.message });
  }
});

// Rota para deletar um usuário por ID
app.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    const user = await userRepository.findUserById(id);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    await userRepository.deleteUser(id);
    return res.status(204).send(); // 204 No Content -> sucesso, sem corpo de resposta
  } catch (error: any) {
    console.error("Erro ao deletar usuário:", error);
    return res
      .status(500)
      .json({ message: "Erro ao deletar o usuário", error: error.message });
  }
});

// Rota para criar um produto
app.post("/products", async (req: Request, res: Response) => {
    try {
        const { name, price, description, userId } = req.body;
        
        if (!name || !price || !description || !userId) {
            return res.status(400).json({ message: "Nome, preço, descrição e userId são obrigatórios." });
        }

        const product = await productRepository.createProduct({ name, price, description, userId });
        return res.status(201).json(product);
    } catch (error: any) {
        console.error("Erro ao criar produto:", error);
        return res.status(500).json({ message: "Erro ao criar o produto", error: error.message });
    }
});

// Rota para listar produtos
app.get("/products", async (req: Request, res: Response) => {
  try {
    const products = await productRepository.getAllProducts();
    return res.json(products);
  } catch (error: any) {
    console.error("Erro ao obter produtos:", error);
    return res
      .status(500)
      .json({ message: "Erro ao obter os produtos", error: error.message });
  }
});

// Rota para deletar um produto por ID
app.delete("/products/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    const product = await productRepository.findProductById(id);
    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado." });
    }

    await productRepository.deleteProduct(id);
    return res.status(204).send(); // 204 No Content -> sucesso, sem corpo de resposta
  } catch (error: any) {
    console.error("Erro ao deletar produto:", error);
    return res
      .status(500)
      .json({ message: "Erro ao deletar o produto", error: error.message });
  }
});

// Sincronizar banco e subir servidor
const PORT = process.env.PORT || 3000;

sequelize
  .sync({ force: true }) // CUIDADO: apaga e recria as tabelas a cada reinicialização!
  .then(() => {
    console.log("Banco de dados conectado e sincronizado!");
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch((error) => {
    console.error("Erro ao conectar ao banco de dados:", error);
  });
