import { Request, Response } from "express";
import Sale from "../models/Sale";
import Purchase from "../models/Purchase";
import purchaseService from "../services/PurchaseService";
import saleRepository from "../repository/SaleRepository";

class TransactionController {
    /**
     * @swagger
     * /checkout/{userId}:
     *   post:
     *     summary: Finaliza a compra dos itens no carrinho do usuário
     *     tags: [Transações]
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
     *       201:
     *         description: Compra finalizada com sucesso
     *       400:
     *         description: Carrinho vazio ou erro de validação
     *       409:
     *         description: Estoque insuficiente
     */
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
            if (process.env.NODE_ENV !== 'test') {
                console.error("Erro ao finalizar compra:", error);
            }

            if (error.message.includes("Carrinho vazio")) {
                return res.status(400).json({ message: error.message });
            }
            if (error.message.includes("Estoque insuficiente")) {
                return res.status(409).json({ message: error.message });
            }
            return res.status(500).json({ message: "Erro interno ao processar a compra", error: error.message });
        }
    }

    /**
     * @swagger
     * /users/{userId}/purchases:
     *   get:
     *     summary: Obtém o histórico de compras de um usuário
     *     tags: [Transações]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: userId
     *         schema:
     *           type: integer
     *         required: true
     *     responses:
     *       200:
     *         description: Histórico de compras retornado com sucesso
     *       404:
     *         description: Nenhuma compra encontrada
     */
    async getPurchasesHistory(req: Request, res: Response) {
        try {
            const userId = parseInt(req.params.userId, 10);
            if (isNaN(userId)) {
                return res.status(400).json({ message: "ID de usuário inválido." });
            }

            if (userId !== (req as any).user.id) {
                return res.status(403).json({ message: "Acesso negado. Você só pode visualizar seu próprio histórico." });
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

    /**
     * @swagger
     * /users/{userId}/sales:
     *   get:
     *     summary: Obtém o histórico de vendas de um usuário (vendedor)
     *     tags: [Transações]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: userId
     *         schema:
     *           type: integer
     *         required: true
     *     responses:
     *       200:
     *         description: Histórico de vendas retornado com sucesso
     *       404:
     *         description: Nenhuma venda encontrada
     */
    async getSalesHistory(req: Request, res: Response) {
        try {
            const sellerId = parseInt(req.params.userId, 10);
            if (isNaN(sellerId)) {
                return res.status(400).json({ message: "ID de usuário inválido." });
            }

            if (sellerId !== (req as any).user.id) {
                return res.status(403).json({ message: "Acesso negado. Você só pode visualizar suas próprias vendas." });
            }

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

    /**
     * @swagger
     * /sales/{saleId}/status:
     *   patch:
     *     summary: Atualiza o status de uma venda (Apenas Vendedor)
     */
    async updateSaleStatus(req: Request, res: Response) {
        try {
            const saleId = parseInt(req.params.saleId, 10);
            const sellerId = (req as any).user.id;
            const { newStatus } = req.body;

            const sale = await Sale.findByPk(saleId);
            if (!sale) return res.status(404).json({ message: "Venda não encontrada." });

            if (sale.sellerId !== sellerId) {
                return res.status(403).json({ message: "Você não tem permissão para alterar esta venda." });
            }

            const currentStatus = sale.status || 'Aguardando pagamento';
            const validTransitions: Record<string, string> = {
                'Aguardando pagamento': 'Em processamento',
                'Em processamento': 'Enviado',
                'Enviado': 'Entregue'
            };

            const expectedNextStatus = validTransitions[currentStatus];

            if (newStatus !== expectedNextStatus) {
                return res.status(400).json({ 
                    message: `Transição inválida. O status atual é '${currentStatus}'. O próximo status deve ser '${expectedNextStatus || 'nenhum'}'.` 
                });
            }

            sale.status = newStatus;
            await sale.save(); // Salva a alteração da Venda primeiro

            // SINCRONIZAÇÃO: Acha a compra pela Chave Estrangeira
            try {
                if (sale.purchaseId) {
                    const purchase = await Purchase.findByPk(sale.purchaseId);
                    if (purchase && (purchase.status === currentStatus || !purchase.status)) {
                        purchase.status = newStatus;
                        await purchase.save();
                    }
                }
            } catch (syncError) {
                console.error("Erro na sincronização da compra:", syncError);
            }

            return res.json({ message: `Status da venda atualizado para ${newStatus}`, sale });

        } catch (error: any) {
            console.error("Erro ao atualizar status da venda:", error);
            return res.status(500).json({ message: "Erro interno", error: error.message });
        }
    }

    /**
     * @swagger
     * /purchases/{purchaseId}/status:
     *   patch:
     *     summary: Atualiza o status de uma compra para Concluído (Apenas Comprador)
     */
    async updatePurchaseStatus(req: Request, res: Response) {
        try {
            const purchaseId = parseInt(req.params.purchaseId, 10);
            const buyerId = (req as any).user.id;
            const { newStatus } = req.body;

            const purchase = await Purchase.findByPk(purchaseId);
            if (!purchase) return res.status(404).json({ message: "Compra não encontrada." });

            if (purchase.userId !== buyerId) {
                return res.status(403).json({ message: "Você não tem permissão para alterar esta compra." });
            }

            const currentStatus = purchase.status || 'Aguardando pagamento';

            if (currentStatus !== 'Entregue' || newStatus !== 'Concluído') {
                return res.status(400).json({ 
                    message: `Você só pode alterar para 'Concluído' quando estiver 'Entregue'. Status atual: '${currentStatus}'.` 
                });
            }

            purchase.status = newStatus;
            await purchase.save(); // Salva a alteração da Compra primeiro

            // SINCRONIZAÇÃO: Atualiza todas as vendas atreladas a esta compra
            try {
                const sales = await Sale.findAll({ where: { purchaseId: purchase.id, status: currentStatus } });
                for (const linkedSale of sales) {
                    linkedSale.status = newStatus;
                    await linkedSale.save();
                }
            } catch (syncError) {
                console.error("Erro na sincronização das vendas:", syncError);
            }

            return res.json({ message: "Compra concluída com sucesso!", purchase });

        } catch (error: any) {
            console.error("Erro ao atualizar status da compra:", error);
            return res.status(500).json({ message: "Erro interno", error: error.message });
        }
    }
}

export default new TransactionController();