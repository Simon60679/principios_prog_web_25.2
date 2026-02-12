import productRepository from "../repository/ProductRepository";

class ProductService {
    /**
     * Cria um novo produto no banco de dados.
     * @param data - Objeto contendo os dados do produto (nome, preço, etc).
     * @returns O produto criado.
     */
    async createProduct(data: any) {
        return await productRepository.createProduct(data);
    }

    /**
     * Recupera todos os produtos cadastrados.
     * @returns Uma lista de produtos.
     */
    async getAllProducts() {
        return await productRepository.getAllProducts();
    }

    /**
     * Atualiza o estoque de um produto específico.
     * @param productId - O ID do produto a ser atualizado.
     * @param newStock - A nova quantidade de estoque (não pode ser negativa).
     * @returns O produto atualizado com os novos dados ou null se não encontrado.
     */
    async updateStock(productId: number, newStock: number) {
        const affectedRows = await productRepository.updateStock(productId, newStock);
        if (affectedRows === 0) {
            return null;
        }
        return await productRepository.findProductById(productId);
    }

    /**
     * Remove um produto do sistema.
     * @param productId - O ID do produto a ser removido.
     * @returns True se o produto foi deletado com sucesso, False caso contrário.
     */
    async deleteProduct(productId: number) {
        const deletedRows = await productRepository.deleteProduct(productId);
        return deletedRows > 0;
    }

    /**
     * Busca os detalhes de um produto pelo ID.
     * @param productId - O ID do produto.
     * @returns O produto encontrado ou null.
     */
    async findProductById(productId: number) {
        return await productRepository.findProductById(productId);
    }
}

export default new ProductService();