import Cart, { CartCreationAttributes } from "../models/Cart";
import CartItem from "../models/CartItem";
import Product from "../models/Product";
import { Transaction } from "sequelize"; // Importe o tipo Transaction (opcional, mas boa prática)

// Interface para adicionar items
export interface AddItemToCartData {
    userId: number;
    productId: number;
    quantity: number;
}

export class CartRepository {
    // Criar um novo carrinho
    async createCart(cart: CartCreationAttributes, options?: { transaction?: Transaction }) {
        return await Cart.create(cart, options);
    }

    // Buscar um carrinho por ID do usuário
    async findCartById(userId: number) {
        return await Cart.findByPk(userId, {
            // Inclui a tabela intermediária CartItem
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

    // Adiciona ou atualiza um item no carrinho
    async addItemToCart({ userId, productId, quantity }: AddItemToCartData, options?: { transaction?: Transaction }) {

        if (quantity <= 0) {
            throw new Error("A quantidade a adicionar deve ser maior que zero.");
        }

        const cartId = userId;

        // Busca o Produto e seu Estoque
        // Passamos options para garantir que a leitura participe da transação, se houver
        const product = await Product.findByPk(productId, options);

        if (!product) {
            throw new Error(`Produto com ID ${productId} não encontrado.`);
        }

        const currentStock = product.stock;

        // Busca o item de carrinho existente
        let cartItem = await CartItem.findOne({
            where: { cartId: cartId, productId: productId },
            ...options
        });

        // Calcula a quantidade total se o item já estiver no carrinho
        const existingQuantity = cartItem ? cartItem.quantity : 0;
        const totalRequestedQuantity = existingQuantity + quantity;

        // Validação de estoque
        if (totalRequestedQuantity > currentStock) {
            // Se a adição exceder o estoque, lança um erro
            throw new Error(
                `Não foi possível adicionar ${quantity} unidades. ` +
                `Estoque máximo disponível: ${currentStock}. ` +
                `Você já tem ${existingQuantity} no carrinho.`
            );
        }

        if (cartItem) {
            // 4. Se o item existe no carrinho: Atualiza soma a quantidade
            cartItem.quantity = totalRequestedQuantity;
            await cartItem.save(options);
        } else {
            // 5. Se o item não existe no carrinho: Cria um novo CartItem
            cartItem = await CartItem.create({
                cartId: cartId,
                productId: productId,
                quantity: quantity,
            }, options);
        }

        // Retorna o item de carrinho atualizado/criado com o Produto incluído
        return await CartItem.findOne({
            where: { cartId: cartId, productId: productId },
            include: [{ model: Product, as: 'product', attributes: ['name', 'price'] }],
            ...options
        });
    }

    // Remove item do carrinho
    async removeItemFromCart(userId: number, productId: number) {
        // O método destroy remove linhas que correspondem ao critério 'where'.
        const deletedRows = await CartItem.destroy({
            where: {
                cartId: userId, // O carrinho do usuário
                productId: productId, // O item a ser removido
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
            return null; // Item não está no carrinho
        }

        // 1. Calcula a nova quantidade
        const newQuantity = cartItem.quantity - quantityToDecrease;

        if (newQuantity <= 0) {
            // 2. Se a nova quantidade for <= 0, DELETA o item
            await cartItem.destroy();
            return { deleted: true, productId };
        } else {
            // 3. Se a nova quantidade for > 0, ATUALIZA a quantidade
            cartItem.quantity = newQuantity;
            await cartItem.save();

            // Opcional: retorna o item com o Produto incluído (para o cliente ver o estado)
            return await CartItem.findOne({
                where: { cartId: userId, productId: productId },
                include: [{ model: Product, as: 'product' }]
            });
        }
    }
}

export default new CartRepository();