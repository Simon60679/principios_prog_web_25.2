import cartRepository from "../repositories/CartRepository";

class CartService {
    async findCartDetails(userId: number) {
        return await cartRepository.findCartById(userId);
    }

    async addItemToCart(data: { userId: number, productId: number, quantity: number }) {
        // Lógica de negócio (ex: verificar se o produto ainda está em estoque, se é do próprio usuário)
        // ...

        return await cartRepository.addItemToCart(data);
    }

    async removeItemFromCart(userId: number, productId: number) {
        const deletedRows = await cartRepository.removeItemFromCart(userId, productId);
        return deletedRows > 0;
    }

    async decreaseItemQuantity(userId: number, productId: number, quantityToDecrease: number) {
        // A lógica de negócio (diminuir e deletar se <= 0) já está no repositório, mas passamos pelo service.
        return await cartRepository.decreaseItemQuantity(userId, productId, quantityToDecrease);
    }
}

export default new CartService();