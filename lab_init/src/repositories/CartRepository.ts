import Cart, {CartCreationAttributes} from "../models/Cart";
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
            attributes: ['quantity']
        }],
            attributes: ['userId']
        });
    }

    // Adiciona ou atualiza um item no carrinho
    async addItemToCart({ userId, productId, quantity }: AddItemToCartData, options?: { transaction?: Transaction }) {
        
        const cartId = userId; 

        // Busca o Produto e seu Estoque
        const product = await Product.findByPk(productId);

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
}

export default new CartRepository();