import purchaseRepository from "../repository/PurchaseRepository";

class PurchaseService {
    async finalizePurchase(userId: number) {
        return await purchaseRepository.finalizePurchase(userId);
    }

    async getPurchasesByUserId(userId: number) {
        return await purchaseRepository.getPurchasesByUserId(userId);
    }
}

export default new PurchaseService();