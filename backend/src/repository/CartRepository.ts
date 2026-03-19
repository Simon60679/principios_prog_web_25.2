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
    /**
     * Cria um novo registro de carrinho.
     * @param cart - Dados para criação do carrinho.
     * @param options - Opções adicionais do Sequelize (ex: transação).
     * @returns O carrinho criado.
     */
    async createCart(cart: CartCreationAttributes, options?: { transaction?: Transaction }) {
        return await Cart.create(cart, options);
    }

    /**
     * Busca um carrinho pelo ID (que é o mesmo ID do usuário), incluindo os itens e detalhes dos produtos.
     * @param userId - O ID do usuário/carrinho.
     * @returns O carrinho com seus itens ou null.
     */
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

    /**
     * Adiciona um item ao carrinho ou atualiza a quantidade se já existir.
     * Verifica se há estoque suficiente antes de adicionar.
     * @param data - Objeto contendo userId, productId e quantity.
     * @param options - Opções de transação.
     * @throws Error se a quantidade for inválida, produto não existir ou estoque insuficiente.
     * @returns O item do carrinho atualizado ou criado.
     */
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

    /**
     * Remove um item específico do carrinho completamente.
     * @param userId - O ID do usuário dono do carrinho.
     * @param productId - O ID do produto a ser removido.
     * @returns O número de linhas deletadas.
     */
    async removeItemFromCart(userId: number, productId: number) {
        const deletedRows = await CartItem.destroy({
            where: {
                cartId: userId,
                productId: productId,
            }
        });

        return deletedRows;
    }

    /**
     * Diminui a quantidade de um item no carrinho. Se a quantidade resultante for <= 0, o item é removido.
     * @param userId - O ID do usuário.
     * @param productId - O ID do produto.
     * @param quantityToDecrease - Quantidade a ser subtraída.
     * @throws Error se a quantidade a diminuir for inválida.
     * @returns Um objeto indicando se foi deletado ou o item atualizado, ou null se não encontrado.
     */
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