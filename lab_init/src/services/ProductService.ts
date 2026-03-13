import { Op } from "sequelize";
import Product from "../models/Product";
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
     * Atualiza os dados básicos de um produto existente (nome, preço, descrição).
     * Inclui uma regra de segurança para garantir que apenas o dono do produto possa alterá-lo.
     * @param productId - O ID do produto a ser atualizado.
     * @param updateData - Objeto contendo os campos opcionais a serem atualizados.
     * @param userId - O ID do usuário que está solicitando a alteração.
     * @returns O produto atualizado ou null se o produto não for encontrado.
     * @throws {Error} Se o usuário solicitante não for o dono do produto.
     */
    async updateProduct(productId: number, updateData: { name?: string; price?: number; description?: string }, userId: number) {
        // 1. Busca o produto no banco
        const product = await Product.findByPk(productId);
        
        if (!product) {
            return null;
        }

        // 2. REGRA DE SEGURANÇA: Verifica se quem está editando é o dono do produto
        if (product.userId !== userId) {
            throw new Error("Permissão negada. Você só pode editar os seus próprios produtos.");
        }

        // 3. Atualiza apenas os campos que foram enviados
        if (updateData.name !== undefined) product.name = updateData.name;
        if (updateData.price !== undefined) product.price = updateData.price;
        if (updateData.description !== undefined) product.description = updateData.description;

        // 4. Salva no banco de dados
        await product.save();
        
        return product;
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

    /**
     * Busca produtos baseando-se em um termo de pesquisa, aplicando pontuação de relevância.
     * @param searchTerm - O termo a ser pesquisado.
     * @returns Uma lista de produtos ordenados por relevância.
     */
    async searchProducts(searchTerm: string) {
        const term = searchTerm.toLowerCase().trim();
        const words = term.split(/\s+/); // Divide a entrada em palavras

        // 1. Busca no DB por qualquer produto que contenha as palavras (filtro inicial)
        const products = await Product.findAll({
            where: {
                [Op.or]: [
                    { name: { [Op.iLike]: `%${term}%` } },
                    ...words.map(word => ({
                        name: { [Op.iLike]: `%${word}%` }
                    }))
                ]
            }
        });

        // 2. Lógica de Scoring para Prioridade
        return products.map(product => {
            const productName = product.name.toLowerCase();
            let score = 0;

            // Prioridade 1: Igualdade exata
            if (productName === term) {
                score = 100;
            } 
            // Prioridade 2: Se aproxima da entrada completa (começa com...)
            else if (productName.startsWith(term)) {
                score = 80;
            }
            // Prioridade 3: Contém a frase completa
            else if (productName.includes(term)) {
                score = 60;
            }
            // Prioridade 4: Contém palavras da entrada
            else {
                const matchedWords = words.filter(word => productName.includes(word));
                score = matchedWords.length * 10;
            }

            return { product, score };
        })
        .filter(item => item.score > 0) // Remove os que não pontuaram
        .sort((a, b) => b.score - a.score) // Ordena pela maior pontuação
        .map(item => item.product); // Retorna apenas o objeto do produto
    }
}

export default new ProductService();