import Sale from "../models/Sale";
import SaleItem from "../models/SaleItem";
import { User } from "../models/User";

export class SaleRepository {

    /**
     * Busca o histórico de vendas de um vendedor específico.
     * @param sellerId - O ID do vendedor.
     * @returns Lista de vendas, incluindo os itens vendidos e dados do vendedor.
     */
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