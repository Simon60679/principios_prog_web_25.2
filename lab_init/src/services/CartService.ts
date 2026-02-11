import cartRepository from "../repository/CartRepository";

class CartService {
    async findCartDetails(userId: number) {
        return await cartRepository.findCartById(userId);
    }

    async addItemToCart(data: { userId: number, productId: number, quantity: number }) {
        return await cartRepository.addItemToCart(data);
    }

    async removeItemFromCart(userId: number, productId: number) {
        const deletedRows = await cartRepository.removeItemFromCart(userId, productId);
        return deletedRows > 0;
    }

    async decreaseItemQuantity(userId: number, productId: number, quantityToDecrease: number) {
        return await cartRepository.decreaseItemQuantity(userId, productId, quantityToDecrease);
    }
}

export default new CartService();