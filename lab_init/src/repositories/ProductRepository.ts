import Product, {ProductCreationAttributes} from "../models/Product";
import { User } from "../models/User";

export class ProductRepository {
  // Criar um novo produto
  async createProduct(product: ProductCreationAttributes) {
    return await Product.create(product);
  }

  // Listar todos os produtos
  async getAllProducts() {
    return await Product.findAll();
  }

  // Buscar um produto por ID
  async findProductById(id: number) {
    return await Product.findByPk(id);
  }

  // Listar produtos por ID do usuário
  async getProductsByUserId(userId: number) {
    return await Product.findAll({
      where: {
        userId: userId, // Aplica o filtro na chave estrangeira
      },
      include: [{ model: User, as: 'seller', attributes: ['name'] }]
      });
    }

  // Deletar um produto por ID
  async deleteProduct(id: number) {
    return await Product.destroy({ where: { id } });
  }
}

export default new ProductRepository();