import cartRepository from "../repository/CartRepository";

class CartService {
    /**
     * Busca os detalhes do carrinho de um usuário.
     * @param userId - ID do usuário.
     * @returns O carrinho com itens e produtos.
     */
    async findCartDetails(userId: number) {
        return await cartRepository.findCartById(userId);
    }

    /**
     * Adiciona um item ao carrinho.
     * @param data - Objeto com userId, productId e quantity.
     * @returns O item do carrinho adicionado ou atualizado.
     */
    async addItemToCart(data: { userId: number, productId: number, quantity: number }) {
        return await cartRepository.addItemToCart(data);
    }

    /**
     * Remove um item do carrinho completamente.
     * @param userId - ID do usuário.
     * @param productId - ID do produto.
     * @returns True se removido, False caso contrário.
     */
    async removeItemFromCart(userId: number, productId: number) {
        const deletedRows = await cartRepository.removeItemFromCart(userId, productId);
        return deletedRows > 0;
    }

    /**
     * Diminui a quantidade de um item no carrinho.
     * @param userId - ID do usuário.
     * @param productId - ID do produto.
     * @param quantityToDecrease - Quantidade a diminuir.
     * @returns O item atualizado, objeto de deleção ou null.
     */
    async decreaseItemQuantity(userId: number, productId: number, quantityToDecrease: number) {
        return await cartRepository.decreaseItemQuantity(userId, productId, quantityToDecrease);
    }
}

export default new CartService();