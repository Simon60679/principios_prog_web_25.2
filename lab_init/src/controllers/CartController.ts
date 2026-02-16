import { Request, Response } from "express";
import cartService from "../services/CartService";

class CartController {
    /**
     * @swagger
     * /users/{userId}/cart:
     *   get:
     *     summary: Recupera o carrinho de compras de um usuário
     *     tags: [Carrinho]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: userId
     *         schema:
     *           type: integer
     *         required: true
     *         description: ID do usuário
     *     responses:
     *       200:
     *         description: Detalhes do carrinho retornados com sucesso
     *       404:
     *         description: Carrinho não encontrado
     */
    async findCart(req: Request, res: Response) {
        try {
            const userId = parseInt(req.params.userId, 10);
            if (isNaN(userId)) {
                return res.status(400).json({ message: "ID de usuário inválido." });
            }

            if (userId !== (req as any).user.id) {
                return res.status(403).json({ message: "Acesso negado. Você não pode acessar o carrinho de outro usuário." });
            }

            const cartDetails = await cartService.findCartDetails(userId);
            if (!cartDetails) {
                return res.status(404).json({ message: "Carrinho não encontrado para este usuário." });
            }

            return res.json(cartDetails);
        } catch (error: any) {
            console.error("Erro ao obter carrinho:", error);
            return res.status(500).json({ message: "Erro ao obter o carrinho", error: error.message });
        }
    }

    /**
     * @swagger
     * /cart/add:
     *   post:
     *     summary: Adiciona um item ao carrinho
     *     tags: [Carrinho]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - userId
     *               - productId
     *               - quantity
     *             properties:
     *               userId:
     *                 type: integer
     *               productId:
     *                 type: integer
     *               quantity:
     *                 type: integer
     *     responses:
     *       201:
     *         description: Item adicionado ao carrinho
     *       400:
     *         description: Dados inválidos
     */
    async addItem(req: Request, res: Response) {
        try {
            const { userId, productId, quantity } = req.body;
            if (!userId || !productId || !quantity || typeof quantity !== 'number' || quantity <= 0) {
                return res.status(400).json({ message: "userId, productId e uma quantity positiva são obrigatórios." });
            }

            if (userId !== (req as any).user.id) {
                return res.status(403).json({ message: "Acesso negado. Você não pode adicionar itens ao carrinho de outro usuário." });
            }

            const cartItem = await cartService.addItemToCart({ userId, productId, quantity });
            return res.status(201).json(cartItem);

        } catch (error: any) {
            if (error.message.includes("não encontrado")) {
                return res.status(404).json({ message: error.message });
            }
            if (error.message.includes("Estoque máximo disponível")) {
                return res.status(400).json({ message: error.message });
            }
            console.error("Erro ao adicionar item ao carrinho:", error);
            return res.status(500).json({ message: "Erro ao processar item do carrinho", error: error.message });
        }
    }

    /**
     * @swagger
     * /cart/{userId}/item/{productId}:
     *   delete:
     *     summary: Remove um item do carrinho completamente
     *     tags: [Carrinho]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: userId
     *         schema:
     *           type: integer
     *         required: true
     *       - in: path
     *         name: productId
     *         schema:
     *           type: integer
     *         required: true
     *     responses:
     *       200:
     *         description: Item removido com sucesso
     *       404:
     *         description: Item não encontrado no carrinho
     */
    async removeItem(req: Request, res: Response) {
        try {
            const userId = parseInt(req.params.userId, 10);
            const productId = parseInt(req.params.productId, 10);
            if (isNaN(userId) || isNaN(productId)) {
                return res.status(400).json({ message: "IDs de usuário ou produto inválidos." });
            }

            if (userId !== (req as any).user.id) {
                return res.status(403).json({ message: "Acesso negado. Você não pode remover itens do carrinho de outro usuário." });
            }

            const deleted = await cartService.removeItemFromCart(userId, productId);
            if (!deleted) {
                return res.status(404).json({ message: "Item não encontrado no carrinho." });
            }

            return res.status(200).json({ message: `Produto ${productId} removido completamente.` });

        } catch (error: any) {
            console.error("Erro ao remover item do carrinho:", error);
            return res.status(500).json({ message: "Erro interno ao remover item do carrinho", error: error.message });
        }
    }

    /**
     * @swagger
     * /cart/{userId}/item/{productId}/decrease:
     *   patch:
     *     summary: Diminui a quantidade de um item no carrinho
     *     tags: [Carrinho]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: userId
     *         schema:
     *           type: integer
     *         required: true
     *       - in: path
     *         name: productId
     *         schema:
     *           type: integer
     *         required: true
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               quantity:
     *                 type: integer
     *                 description: Quantidade a ser decrementada
     *     responses:
     *       200:
     *         description: Quantidade atualizada ou item removido se chegar a zero
     *       404:
     *         description: Item não encontrado
     */
    async decreaseItem(req: Request, res: Response) {
        try {
            const userId = parseInt(req.params.userId, 10);
            const productId = parseInt(req.params.productId, 10);
            const { quantity: quantityToDecrease } = req.body;

            if (isNaN(userId) || isNaN(productId) || typeof quantityToDecrease !== 'number' || quantityToDecrease <= 0) {
                return res.status(400).json({ message: "Dados inválidos." });
            }

            if (userId !== (req as any).user.id) {
                return res.status(403).json({ message: "Acesso negado. Você não pode alterar o carrinho de outro usuário." });
            }

            const result = await cartService.decreaseItemQuantity(userId, productId, quantityToDecrease);

            if (result === null) {
                return res.status(404).json({ message: "Item não encontrado no carrinho." });
            }

            if ('deleted' in result && result.deleted) {
                return res.status(200).json({ message: `Produto ${productId} removido do carrinho.`, deleted: true });
            }

            return res.status(200).json({ message: `Quantidade de produto ${productId} atualizada.`, item: result });

        } catch (error: any) {
            console.error("Erro ao diminuir quantidade:", error);
            return res.status(500).json({ message: "Erro interno ao diminuir a quantidade do item", error: error.message });
        }
    }
}

export default new CartController();