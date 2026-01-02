import purchaseRepository from "../repository/PurchaseRepository";

class PurchaseService {
    async finalizePurchase(userId: number) {
        // Lógica de negócio complexa (checkout) é executada no repositório, que contém a transação.
        return await purchaseRepository.finalizePurchase(userId);
    }

    async getPurchasesByUserId(userId: number) {
        return await purchaseRepository.getPurchasesByUserId(userId);
    }
}

export default new PurchaseService();