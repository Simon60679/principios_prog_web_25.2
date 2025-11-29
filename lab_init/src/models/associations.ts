import { User } from './User';
import { Product } from './Product';

// Definição da Associação One-to-Many

// Um Usuário pode ter muitos Produtos.
User.hasMany(Product, {
    foreignKey: 'userId', // O nome da coluna no modelo Product que referencia User
    as: 'produtos',       // O nome que será usado para acessar os produtos
    onDelete: 'CASCADE'   // Se o Usuário for deletado, todos os seus Produtos também serão.
});

// Um Produto pertence a um Usuário.
Product.belongsTo(User, {
    foreignKey: 'userId', // O nome da chave estrangeira no modelo Product
    as: 'vendedor'        // O nome que será usado para acessar o usuário
});

export { User, Product };