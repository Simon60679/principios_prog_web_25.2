import { Request, Response } from "express";
import productService from "../services/ProductService";

class ProductController {
    /**
     * @swagger
     * /products:
     *   post:
     *     summary: Cria um novo produto
     *     tags: [Produtos]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *               - price
     *               - description
     *             properties:
     *               name:
     *                 type: string
     *               price:
     *                 type: number
     *               description:
     *                 type: string
     *               stock:
     *                 type: number
     *             $ref: '#/components/schemas/Product'
     *     responses:
     *       201:
     *         description: Produto criado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Product'
     *       400:
     *         description: Dados inválidos
     */
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

    /**
     * @swagger
     * /products:
     *   get:
     *     summary: Retorna a lista de todos os produtos
     *     tags: [Produtos]
     *     responses:
     *       200:
     *         description: Lista de produtos retornada com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Product'
     */
    async getAllProducts(req: Request, res: Response) {
        try {
            const products = await productService.getAllProducts();
            return res.json(products);
        } catch (error: any) {
            console.error("Erro ao obter produtos:", error);
            return res.status(500).json({ message: "Erro ao obter os produtos", error: error.message });
        }
    }

    /**
     * @swagger
     * /products/{id}/stock:
     *   patch:
     *     summary: Atualiza o estoque de um produto
     *     tags: [Produtos]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: ID do produto
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - stock
     *             properties:
     *               stock:
     *                 type: integer
     *                 description: Nova quantidade em estoque
     *     responses:
     *       200:
     *         description: Estoque atualizado com sucesso
     *       400:
     *         description: Dados inválidos
     *       404:
     *         description: Produto não encontrado
     */
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

    /**
     * @swagger
     * /products/{id}:
     *   delete:
     *     summary: Deleta um produto
     *     tags: [Produtos]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: ID do produto
     *     responses:
     *       200:
     *         description: Produto deletado com sucesso
     *       400:
     *         description: ID inválido
     *       404:
     *         description: Produto não encontrado
     *       409:
     *         description: Não é possível deletar produto com dependências
     */
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