import purchaseRepository from "../repository/PurchaseRepository";

class PurchaseService {
    /**
     * Finaliza a compra para um usuário (Checkout).
     * @param userId - ID do usuário.
     * @returns A compra realizada.
     */
    async finalizePurchase(userId: number) {
        return await purchaseRepository.finalizePurchase(userId);
    }

    /**
     * Obtém o histórico de compras de um usuário.
     * @param userId - ID do usuário.
     * @returns Lista de compras.
     */
    async getPurchasesByUserId(userId: number) {
        return await purchaseRepository.getPurchasesByUserId(userId);
    }
}

export default new PurchaseService();