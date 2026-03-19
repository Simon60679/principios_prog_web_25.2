import { Request, Response } from "express";
import Sale from "../models/Sale";
import Purchase from "../models/Purchase";
import purchaseService from "../services/PurchaseService";
import saleRepository from "../repository/SaleRepository";
import SaleItem from "../models/SaleItem";

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
            if (isNaN(userId)) return res.status(400).json({ message: "ID de usuário inválido." });

            if (userId !== (req as any).user.id) {
                return res.status(403).json({ message: "Acesso negado. Você só pode visualizar seu próprio histórico." });
            }

            const purchases = await purchaseService.getPurchasesByUserId(userId);

            if (!purchases || purchases.length === 0) {
                return res.status(404).json({ message: "Nenhuma compra encontrada para este usuário." });
            }

            // Busca as vendas atreladas a cada compra
            const purchasesWithSubOrders = await Promise.all(purchases.map(async (purchase: any) => {
                // Converte para JSON puro
                const pJson = purchase.toJSON ? purchase.toJSON() : purchase;
                
                // Busca os sub-pedidos (vendas) deste pedido principal
                const sales = await Sale.findAll({ where: { purchaseId: pJson.id } });
                
                // Para cada sub-pedido, busca os itens atrelados a ele
                const salesWithItems = await Promise.all(sales.map(async (sale) => {
                    const sJson = sale.toJSON();
                    // Busca os SaleItem que pertencem a esta venda específica
                    const saleItems = await SaleItem.findAll({ where: { saleId: sJson.id } });
                    return { ...sJson, specificItems: saleItems }; // Anexa os itens específicos do pacote
                }));
                
                return { ...pJson, subOrders: salesWithItems };
            }));

            return res.json(purchasesWithSubOrders);

        } catch (error: any) {
            console.error("Erro ao obter histórico de compras:", error);
            return res.status(500).json({ message: "Erro interno", error: error.message });
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
                    if (purchase) {
                        // Busca todas as vendas que pertencem a este mesmo pedido
                        const allSales = await Sale.findAll({ where: { purchaseId: purchase.id } });

                        // Verifica o progresso geral
                        const isAllDelivered = allSales.every(s => s.status === 'Entregue' || s.status === 'Concluído');
                        const isAllSent = allSales.every(s => s.status === 'Enviado' || s.status === 'Entregue' || s.status === 'Concluído');
                        const isAllProcessing = allSales.every(s => s.status === 'Em processamento' || s.status === 'Enviado' || s.status === 'Entregue' || s.status === 'Concluído');

                        // Define o status da Compra Pai com base no vendedor mais atrasado
                        let finalPurchaseStatus = purchase.status; 
                        
                        if (isAllDelivered) {
                            finalPurchaseStatus = 'Entregue';
                        } else if (isAllSent) {
                            finalPurchaseStatus = 'Enviado';
                        } else if (isAllProcessing) {
                            finalPurchaseStatus = 'Em processamento';
                        }

                        // Só atualiza o banco do cliente se houver uma mudança real no consenso
                        if (purchase.status !== finalPurchaseStatus) {
                            purchase.status = finalPurchaseStatus;
                            await purchase.save();
                        }
                    }
                }
            } catch (syncError) {
                console.error("Erro na sincronização de consenso da compra:", syncError);
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
            const { saleId } = req.body;

            if (!saleId) {
                return res.status(400).json({ message: "É necessário informar o saleId do pacote recebido." });
            }

            const purchase = await Purchase.findByPk(purchaseId);
            if (!purchase || purchase.userId !== buyerId) {
                return res.status(403).json({ message: "Você não tem permissão para alterar esta compra." });
            }

            // Procura a venda que o cliente clicou
            const sale = await Sale.findOne({ where: { id: saleId, purchaseId: purchase.id } });
            if (!sale) {
                return res.status(404).json({ message: "Pacote não encontrado neste pedido." });
            }

            if (sale.status !== 'Entregue') {
                return res.status(400).json({ 
                    message: `Você só pode concluir pacotes que já foram entregues. Status atual: '${sale.status}'.` 
                });
            }

            // O cliente confirma que recebeu o pacote
            sale.status = 'Concluído';
            await sale.save();

            // Se todos os pacotes deste pedido foram concluídos, o pedido principal é concluído!
            const allSales = await Sale.findAll({ where: { purchaseId: purchase.id } });
            const allCompleted = allSales.every(s => s.status === 'Concluído');
            
            if (allCompleted && purchase.status !== 'Concluído') {
                purchase.status = 'Concluído';
                await purchase.save();
            }

            return res.json({ message: "Recebimento do pacote confirmado com sucesso!", purchase, sale });

        } catch (error: any) {
            console.error("Erro ao atualizar status do pacote:", error);
            return res.status(500).json({ message: "Erro interno", error: error.message });
        }
    }
}

export default new TransactionController();