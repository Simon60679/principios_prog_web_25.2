import { User } from './User';
import { Product } from './Product';
import { Cart } from './Cart';
import CartItem from './CartItem';
import Purchase from './Purchase';
import PurchaseItem from './PurchaseItem';
import Sale from './Sale';
import SaleItem from './SaleItem';

// Um Usuário pode ter muitos Produtos.
User.hasMany(Product, {
    foreignKey: 'userId', // O nome da coluna no modelo Product que referencia User
    as: 'productsUser',       // O nome que será usado para acessar os produtos
    onDelete: 'CASCADE'   // Se o Usuário for deletado, todos os seus Produtos também serão.
});

// Um Produto pertence a um Usuário.
Product.belongsTo(User, {
    foreignKey: 'userId', // O nome da chave estrangeira no modelo Product
    as: 'seller'        // O nome que será usado para acessar o usuário
});

// Um Usuário tem um Carrinho (hasOne)
User.hasOne(Cart, {
    foreignKey: 'userId', // A chave estrangeira no modelo Cart
    as: 'cart',       // O nome para acessar o carrinho
    onDelete: 'CASCADE'   // Se o usuário for deletado, o carrinho também será.
});

// O Carrinho pertence a um Usuário (belongsTo)
Cart.belongsTo(User, {
    foreignKey: 'userId', 
    as: 'user', // O nome para acessar o usuário
});

// Carrinho e Produtos estão ligados através da tabela CartItem
Cart.belongsToMany(Product, {
    through: CartItem, // A tabela intermediária é CartItem
    foreignKey: 'cartId', // A chave de Cart em CartItem
    otherKey: 'productId', // A chave de Product em CartItem
    as: 'productsInCart', // O nome para buscar os produtos no carrinho
});

// Produtos e Carrrinho estão ligados através da tabela CartItem
Product.belongsToMany(Cart, {
    through: CartItem,
    foreignKey: 'productId', // A chave de Product em CartItem
    otherKey: 'cartId', // A chave de Cart em CartItem
    as: 'cartsWithProduct', // O nome para buscar os carrinhos contendo o produto (não acho que vamos usar muito)
});

// 3. Associações diretas (para inclusão quantidade de itens no carrinho)
// Cart pode incluir CartItem diretamente
Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'items' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId' });

// Product pode incluir CartItem diretamente
Product.hasMany(CartItem, { 
    foreignKey: 'productId', 
    as: 'cartLink',
    onDelete: 'CASCADE'
});

CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Um Usuário tem muitos Registros de Compra
User.hasMany(Purchase, {
    foreignKey: 'userId', 
    as: 'purchases',       
    onDelete: 'CASCADE'   
});

// Um Registro de Compra pertence a um único Usuário
Purchase.belongsTo(User, {
    foreignKey: 'userId', 
    as: 'customer'           
});

// Um Registro de Compra tem muitos Itens de Compra
Purchase.hasMany(PurchaseItem, {
    foreignKey: 'purchaseId',
    as: 'items',
    onDelete: 'CASCADE'
});

// Um Item de Compra pertence a um único Registro de Compra
PurchaseItem.belongsTo(Purchase, {
    foreignKey: 'purchaseId',
    as: 'purchase'
});

// Um Usuário pode ter muitas Vendas
User.hasMany(Sale, {
    foreignKey: 'sellerId', // Usa sellerId na tabela Sale
    as: 'salesHistory',       
    onDelete: 'CASCADE'   
});

// Um Registro de Venda pertence a um único Usuário
Sale.belongsTo(User, {
    foreignKey: 'sellerId', 
    as: 'seller'           
});

// Um Registro de Venda tem muitos Itens de Venda
Sale.hasMany(SaleItem, {
    foreignKey: 'saleId',
    as: 'soldItems',
    onDelete: 'CASCADE'
});

// Um Item de Venda pertence a um único Registro de Venda
SaleItem.belongsTo(Sale, {
    foreignKey: 'saleId',
    as: 'sale'
});

export { User, Product, Cart, CartItem, Purchase, PurchaseItem, Sale, SaleItem };