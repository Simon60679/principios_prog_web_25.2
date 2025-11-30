import sequelize from "../config/database";
import Purchase from "../models/Purchase";
import PurchaseItem from "../models/PurchaseItem";
import Cart from "../models/Cart";
import CartItem from "../models/CartItem";
import Product from "../models/Product";
import { User } from "../models/User"; // Necessário para includes e tipagem

export class PurchaseRepository {
    
    // Método principal para processar a compra
    async finalizePurchase(userId: number) {
        const t = await sequelize.transaction();
        let totalAmount = 0;

        try {
            // 1. Obter os itens do carrinho
            const cart = await Cart.findByPk(userId, {
                include: [{ 
                    model: CartItem, 
                    as: 'items', 
                    include: [{ 
                        model: Product, 
                        as: 'product' 
                    }] 
                }],
                transaction: t 
            });

            if (!cart || !cart.items || cart.items.length === 0) {
                await t.rollback();
                throw new Error("Carrinho vazio ou não encontrado.");
            }

            const purchaseRecord = await Purchase.create({ 
                userId: userId, 
                totalAmount: 0, 
                purchaseDate: new Date(),
            }, { transaction: t });

            const itemsToCreate: any[] = []; 

            // 3. Processar cada item do carrinho: Validação e Redução
            for (const item of cart.items) {
                const product = item.product;
                if (!product) continue; 

                const quantity = item.quantity;
                const currentStock = product.stock;

                // Validação de estoque
                if (quantity > currentStock) {
                    await t.rollback();
                    // Lança um erro específico para o cliente
                    throw new Error(`Estoque insuficiente para o produto: ${product.name}. Disponível: ${currentStock}, Solicitado: ${quantity}.`);
                }

                // Redução de estoque
                const newStock = currentStock - quantity;
                await product.update({ stock: newStock }, { transaction: t });

                // Cálculo para adicionar no total
                const price = Number(product.price);
                const subtotal = price * quantity;
                
                totalAmount += subtotal;

                itemsToCreate.push({
                    purchaseId: purchaseRecord.id,
                    productName: product.name,
                    productPrice: price,
                    quantity: quantity,
                    subtotal: subtotal,
                });
            }

            // 4. Criar todos os itens da compra
            await PurchaseItem.bulkCreate(itemsToCreate, { transaction: t });

            // 5. Atualizar o valor total na Purchase
            await purchaseRecord.update({ totalAmount: totalAmount }, { transaction: t });

            // 6. Deletar todos os itens do carrinho
            await CartItem.destroy({ where: { cartId: userId }, transaction: t });

            // 7. Confirma a transação
            await t.commit();
            
            // Retorna o registro de compra completo
            return await Purchase.findByPk(purchaseRecord.id, {
                include: [{ model: PurchaseItem, as: 'items' }],
            });

        } catch (error) {
            // Se algo falhar (validação ou banco de dados), reverte tudo.
            await t.rollback();
            throw error;
        }
    }
    
    // ... (restante dos métodos)
}

export default new PurchaseRepository();