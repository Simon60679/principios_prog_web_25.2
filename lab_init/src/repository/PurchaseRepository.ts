import sequelize from "../config/database";
import Purchase from "../models/Purchase";
import PurchaseItem from "../models/PurchaseItem";
import Cart from "../models/Cart";
import CartItem from "../models/CartItem";
import Product from "../models/Product";
import Sale from "../models/Sale";
import SaleItem from "../models/SaleItem";
import User from "../models/User";

export class PurchaseRepository {

    // Método principal para processar a compra
    async finalizePurchase(userId: number) {
        const t = await sequelize.transaction();
        let totalAmount = 0;

        // Estrutura para agrupar itens vendidos por cada vendedor
        const salesBySeller: {
            [sellerId: number]: {
                totalAmount: number,
                items: any[]
            }
        } = {};

        try {
            // 1. Obter os itens do carrinho (Incluindo o Produto e, através dele, o VENDEDOR)
            const cart = await Cart.findByPk(userId, {
                include: [{
                    model: CartItem,
                    as: 'items',
                    include: [{
                        model: Product,
                        as: 'product',
                        include: [{ model: User, as: 'seller' }]
                    }]
                }],
                transaction: t
            });

            // Validação de Carrinho Vazio
            if (!cart || !cart.items || cart.items.length === 0) {
                throw new Error("Carrinho vazio ou não encontrado.");
            }

            const purchaseRecord = await Purchase.create({
                userId: userId,
                totalAmount: 0,
                purchaseDate: new Date(),
            }, { transaction: t });

            const itemsToCreate: any[] = []; // Para PurchaseItem

            // 3. Processar e Agrupar por Vendedor
            for (const item of cart.items) {
                const product = item.product;
                if (!product || !product.seller) continue;

                const sellerId = product.userId; // O ID do dono do produto
                const price = Number(product.price);
                const quantity = item.quantity;
                const subtotal = price * quantity;

                totalAmount += subtotal; // Soma o total da compra do cliente

                const currentStock = product.stock;

                // Validação de estoque
                if (quantity > currentStock) {
                    throw new Error(`Estoque insuficiente para o produto: ${product.name}. Disponível: ${currentStock}, Solicitado: ${quantity}.`);
                }

                // Redução de estoque
                const newStock = currentStock - quantity;
                await product.update({ stock: newStock }, { transaction: t });
                // Agrupar para registro de venda
                if (!salesBySeller[sellerId]) {
                    salesBySeller[sellerId] = { totalAmount: 0, items: [] };
                }

                salesBySeller[sellerId].totalAmount += subtotal;
                salesBySeller[sellerId].items.push({
                    productName: product.name,
                    productPrice: price,
                    quantity: quantity,
                    subtotal: subtotal,
                });
                // ----------------------------------------------------

                // Prepara o Item para o Histórico de COMPRA do CLIENTE (PurchaseItem)
                itemsToCreate.push({
                    purchaseId: purchaseRecord.id,
                    productName: product.name,
                    productPrice: price,
                    quantity: quantity,
                    subtotal: subtotal,
                });
            }

            // 4. Criar todas as vendas e seus itens
            for (const sellerId in salesBySeller) {
                const saleData = salesBySeller[sellerId];

                // A. Cria o registro Sale (Venda)
                const sale = await Sale.create({
                    sellerId: Number(sellerId),
                    totalAmount: saleData.totalAmount,
                    saleDate: new Date(),
                }, { transaction: t });

                // B. Adiciona o ID da venda aos itens
                const saleItemsToCreate = saleData.items.map(item => ({
                    ...item,
                    saleId: sale.id, // Liga ao registro Sale recém-criado
                }));

                // C. Cria os Itens de Venda (SaleItem)
                await SaleItem.bulkCreate(saleItemsToCreate, { transaction: t });
            }


            // 5. Criar itens de compra para o cliente (PurchaseItem)
            await PurchaseItem.bulkCreate(itemsToCreate, { transaction: t });

            // 6. Atualizar o valor total na Purchase
            await purchaseRecord.update({ totalAmount: totalAmount }, { transaction: t });

            // 7. Deletar todos os itens do carrinho
            await CartItem.destroy({ where: { cartId: userId }, transaction: t });

            // 8. Confirma a transação
            await t.commit();

            // Retorna o registro de compra completo
            return await Purchase.findByPk(purchaseRecord.id, {
                include: [{ model: PurchaseItem, as: 'items' }],
            });

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async getPurchasesByUserId(userId: number) {
        return await Purchase.findAll({
            where: { userId: userId },
            include: [{ model: PurchaseItem, as: 'items' }]
        });
    }
}

export default new PurchaseRepository();