import Cart, { CartCreationAttributes } from "../models/Cart";
import CartItem from "../models/CartItem";
import Product from "../models/Product";
import { Transaction } from "sequelize";

export interface AddItemToCartData {
    userId: number;
    productId: number;
    quantity: number;
}

export class CartRepository {
    async createCart(cart: CartCreationAttributes, options?: { transaction?: Transaction }) {
        return await Cart.create(cart, options);
    }

    async findCartById(userId: number) {
        return await Cart.findByPk(userId, {
            include: [{
                model: CartItem,
                as: 'items',
                include: [{
                    model: Product,
                    as: 'product',
                    attributes: ['name', 'price']
                }],
                attributes: ['quantity', 'productId']
            }],
            attributes: ['userId']
        });
    }

    async addItemToCart({ userId, productId, quantity }: AddItemToCartData, options?: { transaction?: Transaction }) {

        if (quantity <= 0) {
            throw new Error("A quantidade a adicionar deve ser maior que zero.");
        }

        const cartId = userId;

        const product = await Product.findByPk(productId, options);

        if (!product) {
            throw new Error(`Produto com ID ${productId} não encontrado.`);
        }

        const currentStock = product.stock;

        let cartItem = await CartItem.findOne({
            where: { cartId: cartId, productId: productId },
            ...options
        });

        const existingQuantity = cartItem ? cartItem.quantity : 0;
        const totalRequestedQuantity = existingQuantity + quantity;

        if (totalRequestedQuantity > currentStock) {
            throw new Error(
                `Não foi possível adicionar ${quantity} unidades. ` +
                `Estoque máximo disponível: ${currentStock}. ` +
                `Você já tem ${existingQuantity} no carrinho.`
            );
        }

        if (cartItem) {
            cartItem.quantity = totalRequestedQuantity;
            await cartItem.save(options);
        } else {
            cartItem = await CartItem.create({
                cartId: cartId,
                productId: productId,
                quantity: quantity,
            }, options);
        }

        return await CartItem.findOne({
            where: { cartId: cartId, productId: productId },
            include: [{ model: Product, as: 'product', attributes: ['name', 'price'] }],
            ...options
        });
    }

    async removeItemFromCart(userId: number, productId: number) {
        const deletedRows = await CartItem.destroy({
            where: {
                cartId: userId,
                productId: productId,
            }
        });

        return deletedRows;
    }

    async decreaseItemQuantity(userId: number, productId: number, quantityToDecrease: number) {

        if (quantityToDecrease <= 0) {
            throw new Error("A quantidade a diminuir deve ser maior que zero.");
        }

        let cartItem = await CartItem.findOne({
            where: { cartId: userId, productId: productId }
        });

        if (!cartItem) {
            return null;
        }

        const newQuantity = cartItem.quantity - quantityToDecrease;

        if (newQuantity <= 0) {
            await cartItem.destroy();
            return { deleted: true, productId };
        } else {
            cartItem.quantity = newQuantity;
            await cartItem.save();

            return await CartItem.findOne({
                where: { cartId: userId, productId: productId },
                include: [{ model: Product, as: 'product' }]
            });
        }
    }
}

export default new CartRepository();