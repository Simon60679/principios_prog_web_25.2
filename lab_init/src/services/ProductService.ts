import productRepository from "../repositories/ProductRepository";

class ProductService {
    async createProduct(data: any) {
        return await productRepository.createProduct(data);
    }

    async getAllProducts() {
        return await productRepository.getAllProducts();
    }

    async updateStock(productId: number, newStock: number) {
        const affectedRows = await productRepository.updateStock(productId, newStock);
        if (affectedRows === 0) {
            return null; // Não encontrado
        }
        return await productRepository.findProductById(productId); // Retorna o produto atualizado
    }

    async deleteProduct(productId: number) {
        const deletedRows = await productRepository.deleteProduct(productId);
        return deletedRows > 0;
    }

    async findProductById(productId: number) {
        return await productRepository.findProductById(productId);
    }
}

export default new ProductService();