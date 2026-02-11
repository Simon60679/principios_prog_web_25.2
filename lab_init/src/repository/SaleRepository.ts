import Sale from "../models/Sale";
import SaleItem from "../models/SaleItem";
import { User } from "../models/User";

export class SaleRepository {

    async getSalesBySellerId(sellerId: number) {
        return await Sale.findAll({
            where: { sellerId: sellerId },
            include: [
                {
                    model: SaleItem,
                    as: 'soldItems'
                },
                {
                    model: User,
                    as: 'seller',
                    attributes: ['name', 'email']
                }
            ]
        });
    }

}

export default new SaleRepository();