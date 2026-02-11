import Product, { ProductCreationAttributes } from "../models/Product";
import { User } from "../models/User";

export class ProductRepository {
  async createProduct(product: ProductCreationAttributes) {
    return await Product.create(product);
  }

  async getAllProducts() {
    return await Product.findAll();
  }

  async findProductById(id: number) {
    return await Product.findByPk(id);
  }

  async getProductsByUserId(userId: number) {
    return await Product.findAll({
      where: {
        userId: userId,
      },
      include: [{ model: User, as: 'seller', attributes: ['name'] }]
    });
  }

  async deleteProduct(id: number) {
    return await Product.destroy({ where: { id } });
  }

  async updateStock(productId: number, newStock: number) {
    if (newStock < 0) {
      throw new Error("O estoque não pode ser negativo.");
    }

    const [affectedCount] = await Product.update(
      { stock: newStock },
      {
        where: { id: productId }
      }
    );

    return affectedCount;
  }
}

export default new ProductRepository();