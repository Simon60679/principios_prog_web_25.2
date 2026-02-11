import { Request, Response } from "express";
import productService from "../services/ProductService";

class ProductController {
    async createProduct(req: Request, res: Response) {
        try {
            const { name, price, description, stock } = req.body;
            const userId = (req as any).user?.id;

            if (!name || !price || !description) {
                return res.status(400).json({ message: "Nome, preço e descrição são obrigatórios." });
            }

            const product = await productService.createProduct({ name, price, description, stock, userId });
            return res.status(201).json(product);
        } catch (error: any) {
            console.error("Erro ao criar produto:", error);
            return res.status(500).json({ message: "Erro ao criar o produto", error: error.message });
        }
    }

    async getAllProducts(req: Request, res: Response) {
        try {
            const products = await productService.getAllProducts();
            return res.json(products);
        } catch (error: any) {
            console.error("Erro ao obter produtos:", error);
            return res.status(500).json({ message: "Erro ao obter os produtos", error: error.message });
        }
    }

    async updateStock(req: Request, res: Response) {
        try {
            const productId = parseInt(req.params.id, 10);
            const { stock: newStock } = req.body;

            if (isNaN(productId) || typeof newStock !== 'number' || newStock === null) {
                return res.status(400).json({ message: "Dados inválidos. O ID do produto e o novo valor de 'stock' devem ser números." });
            }

            const updatedProduct = await productService.updateStock(productId, newStock);

            if (!updatedProduct) {
                return res.status(404).json({ message: "Produto não encontrado." });
            }

            return res.status(200).json({
                message: `Estoque do produto ${productId} atualizado para ${newStock}.`,
                product: updatedProduct
            });

        } catch (error: any) {
            console.error("Erro ao atualizar estoque:", error);
            if (error.message.includes("O estoque não pode ser negativo")) {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({ message: "Erro interno ao atualizar estoque", error: error.message });
        }
    }

    async deleteProduct(req: Request, res: Response) {
        try {
            const productId = parseInt(req.params.id, 10);
            if (isNaN(productId)) {
                return res.status(400).json({ message: "ID de produto inválido." });
            }

            const deleted = await productService.deleteProduct(productId);

            if (!deleted) {
                return res.status(404).json({ message: "Produto não encontrado ou já deletado." });
            }

            return res.status(200).json({ message: `Produto com ID ${productId} deletado com sucesso.` });

        } catch (error: any) {
            console.error("Erro ao deletar produto:", error);
            if (error.name === 'SequelizeForeignKeyConstraintError') {
                return res.status(409).json({ message: "Não é possível deletar este produto devido a dependências (carrinhos ativos)." });
            }
            return res.status(500).json({ message: "Erro interno ao deletar produto", error: error.message });
        }
    }
}

export default new ProductController();