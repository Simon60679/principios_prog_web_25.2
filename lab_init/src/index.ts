import express, { Request, Response } from "express";
import dotenv from "dotenv";
import sequelize from "./config/database";
import userRepository from "./repositories/UserRepository";
import cartRepository from "./repositories/CartRepository";
import productRepository from "./repositories/ProductRepository";
import purchaseRepository from "./repositories/PurchaseRepository";
import saleRepository from "./repositories/SaleRepository";
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

// Atualizar Estoque de Produto
// Rota: PATCH /products/:id/stock
app.patch("/products/:id/stock", async (req: Request, res: Response) => {
    try {
        const productId = parseInt(req.params.id, 10);
        const { stock: newStock } = req.body; // Pega o novo valor do corpo da requisição

        if (isNaN(productId) || typeof newStock !== 'number' || newStock === null) {
            return res.status(400).json({ 
                message: "Dados inválidos. O ID do produto e o novo valor de 'stock' devem ser números." 
            });
        }
        
        // Chama o método do repositório
        const affectedRows = await productRepository.updateStock(productId, newStock);
        
        if (affectedRows === 0) {
            return res.status(404).json({ message: "Produto não encontrado." });
        }

        // Se a atualização for bem-sucedida, você pode retornar o produto atualizado
        const updatedProduct = await productRepository.findProductById(productId);

        return res.status(200).json({ 
            message: `Estoque do produto ${productId} atualizado para ${newStock}.`,
            product: updatedProduct
        });

    } catch (error: any) {
        console.error("Erro ao atualizar estoque:", error);
        
        // Retorna 400 se a validação básica do repositório falhar (estoque negativo)
        if (error.message.includes("O estoque não pode ser negativo")) {
            return res.status(400).json({ message: error.message });
        }

        return res
            .status(500)
            .json({ message: "Erro interno ao atualizar estoque", error: error.message });
    }
});

// Deletar um Produto por ID
app.delete("/products/:id", async (req: Request, res: Response) => {
    try {
        const productId = parseInt(req.params.id, 10);

        if (isNaN(productId)) {
            return res.status(400).json({ message: "ID de produto inválido." });
        }
        
        // Chama o método do repositório
        const deletedRows = await productRepository.deleteProduct(productId);
        
        if (deletedRows === 0) {
            return res.status(404).json({ message: "Produto não encontrado ou já deletado." });
        }

        return res.status(200).json({ 
            message: `Produto com ID ${productId} deletado com sucesso.`,
            deletedCount: deletedRows
        });

    } catch (error: any) {
        console.error("Erro ao deletar produto:", error);
        
        if (error.name === 'SequelizeForeignKeyConstraintError') {
             return res.status(409).json({
                message: "Não é possível deletar este produto, pois ele está ligado a um ou mais carrinhos de clientes ativos. Limpe as dependências primeiro ou configure CASCADE.",
                error: error.message
            });
        }
        
        return res
            .status(500)
            .json({ message: "Erro interno ao deletar produto", error: error.message });
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

// Rota para visualizar carrinho do usuário
app.get("/users/:userId/cart", async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.userId, 10);

        if (isNaN(userId)) {
            return res.status(400).json({ message: "ID de usuário inválido." });
        }
        
        const cartDetails = await cartRepository.findCartById(userId);
        
        if (!cartDetails) {
            // Este caso só deve ocorrer se o CartRepository.createCart tiver falhado durante o createUser,
            // mas é bom verificar.
            return res.status(404).json({ message: "Carrinho não encontrado para este usuário." });
        }

        return res.json(cartDetails);
    } catch (error: any) {
        console.error("Erro ao obter carrinho:", error);
        return res
            .status(500)
            .json({ message: "Erro ao obter o carrinho", error: error.message });
    }
});

// Adicionar ou Atualizar Produto no Carrinho
app.post("/cart/add", async (req: Request, res: Response) => {
    try {
        const { userId, productId, quantity } = req.body;

        // Validação básica
        if (!userId || !productId || !quantity || typeof quantity !== 'number' || quantity <= 0) {
            return res.status(400).json({ message: "userId, productId e uma quantity positiva são obrigatórios." });
        }
        
        // Opcional: Você pode querer verificar se o User e o Product realmente existem antes de tentar adicionar.

        const cartItem = await cartRepository.addItemToCart({ userId, productId, quantity });
        
        return res.status(200).json(cartItem); // 200 OK para atualização ou adição bem-sucedida

    } catch (error: any) {
        console.error("Erro ao adicionar item ao carrinho:", error);
        // Este erro geralmente será um 500 (falha de banco de dados ou FK violation)
        return res
            .status(500)
            .json({ message: "Erro ao processar item do carrinho", error: error.message });
    }
});

// Rota de checkout da compra
app.post("/checkout/:userId", async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.userId, 10);

        if (isNaN(userId)) {
            return res.status(400).json({ message: "ID de usuário inválido." });
        }
        
        const purchase = await purchaseRepository.finalizePurchase(userId);
        
        return res.status(201).json({ 
            message: "Compra finalizada com sucesso!", 
            purchase: purchase 
        });

    } catch (error: any) {
        console.error("Erro ao finalizar compra:", error);
        
        // Retorna 400 se for um erro de validação (como "Carrinho vazio")
        if (error.message.includes("Carrinho vazio")) {
            return res.status(400).json({ message: error.message });
        }
        
        return res
            .status(500)
            .json({ message: "Erro interno ao processar a compra", error: error.message });
    }
});

// Obter Histórico de Compras de um Usuário
app.get("/users/:userId/purchases", async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.userId, 10);

        if (isNaN(userId)) {
            return res.status(400).json({ message: "ID de usuário inválido." });
        }
        
        // Chama o método do repositório
        const purchases = await purchaseRepository.getPurchasesByUserId(userId);
        
        if (!purchases || purchases.length === 0) {
            return res.status(404).json({ message: "Nenhuma compra encontrada para este usuário." });
        }

        return res.json(purchases);

    } catch (error: any) {
        console.error("Erro ao obter histórico de compras:", error);
        return res
            .status(500)
            .json({ message: "Erro interno ao obter o histórico de compras", error: error.message });
    }
});

// Obter Histórico de Vendas de um Vendedor
// Rota: GET /users/:userId/sales
app.get("/users/:userId/sales", async (req: Request, res: Response) => {
    try {
        const sellerId = parseInt(req.params.userId, 10);

        if (isNaN(sellerId)) {
            return res.status(400).json({ message: "ID de usuário inválido." });
        }
        
        const sales = await saleRepository.getSalesBySellerId(sellerId);
        
        if (!sales || sales.length === 0) {
            return res.status(404).json({ message: "Nenhuma venda encontrada para este usuário." });
        }

        return res.json(sales);

    } catch (error: any) {
        console.error("Erro ao obter histórico de vendas:", error);
        return res
            .status(500)
            .json({ message: "Erro interno ao obter o histórico de vendas", error: error.message });
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
