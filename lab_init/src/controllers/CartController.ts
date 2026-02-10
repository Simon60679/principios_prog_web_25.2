import { Request, Response } from "express";
import cartService from "../services/CartService";

class CartController {
    async findCart(req: Request, res: Response) {
        try {
            const userId = parseInt(req.params.userId, 10);
            if (isNaN(userId)) {
                return res.status(400).json({ message: "ID de usuário inválido." });
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

    async addItem(req: Request, res: Response) {
        try {
            const { userId, productId, quantity } = req.body;
            if (!userId || !productId || !quantity || typeof quantity !== 'number' || quantity <= 0) {
                return res.status(400).json({ message: "userId, productId e uma quantity positiva são obrigatórios." });
            }

            const cartItem = await cartService.addItemToCart({ userId, productId, quantity });
            return res.status(201).json(cartItem);

        } catch (error: any) {
            console.error("Erro ao adicionar item ao carrinho:", error);
            return res.status(500).json({ message: "Erro ao processar item do carrinho", error: error.message });
        }
    }

    async removeItem(req: Request, res: Response) {
        try {
            const userId = parseInt(req.params.userId, 10);
            const productId = parseInt(req.params.productId, 10);
            if (isNaN(userId) || isNaN(productId)) {
                return res.status(400).json({ message: "IDs de usuário ou produto inválidos." });
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

    async decreaseItem(req: Request, res: Response) {
        try {
            const userId = parseInt(req.params.userId, 10);
            const productId = parseInt(req.params.productId, 10);
            const { quantity: quantityToDecrease } = req.body;

            if (isNaN(userId) || isNaN(productId) || typeof quantityToDecrease !== 'number' || quantityToDecrease <= 0) {
                return res.status(400).json({ message: "Dados inválidos." });
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