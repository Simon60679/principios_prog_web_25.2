import Product, { ProductCreationAttributes } from "../models/Product";
import { User } from "../models/User";

export class ProductRepository {
  /**
   * Cria um novo produto no banco de dados.
   * @param product - Objeto contendo os dados do produto.
   * @returns O produto criado.
   */
  async createProduct(product: ProductCreationAttributes) {
    return await Product.create(product);
  }

  /**
   * Retorna todos os produtos cadastrados.
   * @returns Uma lista de produtos.
   */
  async getAllProducts() {
    return await Product.findAll();
  }

  /**
   * Busca um produto pelo seu ID (Primary Key).
   * @param id - O ID do produto.
   * @returns O produto encontrado ou null.
   */
  async findProductById(id: number) {
    return await Product.findByPk(id);
  }

  /**
   * Busca todos os produtos cadastrados por um vendedor específico.
   * @param userId - O ID do usuário vendedor.
   * @returns Lista de produtos com o nome do vendedor incluído.
   */
  async getProductsByUserId(userId: number) {
    return await Product.findAll({
      where: {
        userId: userId,
      },
      include: [{ model: User, as: 'seller', attributes: ['name'] }]
    });
  }

  /**
   * Remove um produto do banco de dados.
   * @param id - O ID do produto a ser removido.
   * @returns O número de linhas afetadas (1 se deletado, 0 se não).
   */
  async deleteProduct(id: number) {
    return await Product.destroy({ where: { id } });
  }

  /**
   * Atualiza a quantidade de estoque de um produto.
   * @param productId - O ID do produto.
   * @param newStock - A nova quantidade de estoque.
   * @throws Error se o novo estoque for negativo.
   * @returns O número de linhas afetadas.
   */
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