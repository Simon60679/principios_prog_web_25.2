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
        
        // O ID do carrinho é o próprio userId (One-to-One)
        const cartId = userId; 

        // Busca o item de carrinho existente
        let cartItem = await CartItem.findOne({
            where: {
                cartId: cartId,
                productId: productId,
            },
            // Garante que a operação use a transação se fornecida
            ...options
        });

        if (cartItem) {
            cartItem.quantity += quantity;
            await cartItem.save(options);
        } else {
            cartItem = await CartItem.create({
                cartId: cartId,
                productId: productId,
                quantity: quantity,
            }, options);
        }

        // Retorna o item de carrinho atualizado ou adicionado
        return await CartItem.findOne({
            where: { // Usamos 'where' para chaves primárias compostas
                cartId: cartId,
                productId: productId,
            },
            include: [{ model: Product, as: 'product', attributes: ['name', 'price'] }],
            ...options
        });
    }
}

export default new CartRepository();