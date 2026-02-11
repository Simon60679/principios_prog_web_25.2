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

    async finalizePurchase(userId: number) {
        const t = await sequelize.transaction();
        let totalAmount = 0;

        const salesBySeller: {
            [sellerId: number]: {
                totalAmount: number,
                items: any[]
            }
        } = {};

        try {
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

            if (!cart || !cart.items || cart.items.length === 0) {
                throw new Error("Carrinho vazio ou não encontrado.");
            }

            const purchaseRecord = await Purchase.create({
                userId: userId,
                totalAmount: 0,
                purchaseDate: new Date(),
            }, { transaction: t });

            const itemsToCreate: any[] = [];

            for (const item of cart.items) {
                const product = item.product;
                if (!product || !product.seller) continue;

                const sellerId = product.userId;
                const price = Number(product.price);
                const quantity = item.quantity;
                const subtotal = price * quantity;

                totalAmount += subtotal;

                const currentStock = product.stock;

                if (quantity > currentStock) {
                    throw new Error(`Estoque insuficiente para o produto: ${product.name}. Disponível: ${currentStock}, Solicitado: ${quantity}.`);
                }

                const newStock = currentStock - quantity;
                await product.update({ stock: newStock }, { transaction: t });
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

                itemsToCreate.push({
                    purchaseId: purchaseRecord.id,
                    productName: product.name,
                    productPrice: price,
                    quantity: quantity,
                    subtotal: subtotal,
                });
            }

            for (const sellerId in salesBySeller) {
                const saleData = salesBySeller[sellerId];

                const sale = await Sale.create({
                    sellerId: Number(sellerId),
                    totalAmount: saleData.totalAmount,
                    saleDate: new Date(),
                }, { transaction: t });

                const saleItemsToCreate = saleData.items.map(item => ({
                    ...item,
                    saleId: sale.id,
                }));

                await SaleItem.bulkCreate(saleItemsToCreate, { transaction: t });
            }


            await PurchaseItem.bulkCreate(itemsToCreate, { transaction: t });

            await purchaseRecord.update({ totalAmount: totalAmount }, { transaction: t });

            await CartItem.destroy({ where: { cartId: userId }, transaction: t });

            await t.commit();

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