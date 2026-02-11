import { Request, Response } from "express";
import purchaseService from "../services/PurchaseService";
import saleRepository from "../repository/SaleRepository"; // Usaremos o repositório diretamente aqui

class TransactionController {
    async checkout(req: Request, res: Response) {
        try {
            const userId = parseInt(req.params.userId, 10);
            const userAuthenticated = (req as any).user.id;
            if (isNaN(userId)) {
                return res.status(400).json({ message: "ID de usuário inválido." });
            }

            if (userAuthenticated !== userId) {
                return res.status(403).json({ 
                    message: "Ação não permitida. Você só pode finalizar seu próprio carrinho." 
                });
            }

            const purchase = await purchaseService.finalizePurchase(userId);

            return res.status(201).json({ message: "Compra finalizada com sucesso!", purchase: purchase });

        } catch (error: any) {
            console.error("Erro ao finalizar compra:", error);
            if (error.message.includes("Carrinho vazio")) {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({ message: "Erro interno ao processar a compra", error: error.message });
        }
    }

    async getPurchasesHistory(req: Request, res: Response) {
        try {
            const userId = parseInt(req.params.userId, 10);
            if (isNaN(userId)) {
                return res.status(400).json({ message: "ID de usuário inválido." });
            }

            const purchases = await purchaseService.getPurchasesByUserId(userId);

            if (!purchases || purchases.length === 0) {
                return res.status(404).json({ message: "Nenhuma compra encontrada para este usuário." });
            }

            return res.json(purchases);

        } catch (error: any) {
            console.error("Erro ao obter histórico de compras:", error);
            return res.status(500).json({ message: "Erro interno ao obter o histórico de compras", error: error.message });
        }
    }

    async getSalesHistory(req: Request, res: Response) {
        try {
            const sellerId = parseInt(req.params.userId, 10);
            if (isNaN(sellerId)) {
                return res.status(400).json({ message: "ID de usuário inválido." });
            }

            // A lógica de vendas é simples o suficiente para usar o Repository diretamente se você não precisar de Service.
            const sales = await saleRepository.getSalesBySellerId(sellerId);

            if (!sales || sales.length === 0) {
                return res.status(404).json({ message: "Nenhuma venda encontrada para este usuário." });
            }

            return res.json(sales);

        } catch (error: any) {
            console.error("Erro ao obter histórico de vendas:", error);
            return res.status(500).json({ message: "Erro interno ao obter o histórico de vendas", error: error.message });
        }
    }
}

export default new TransactionController();