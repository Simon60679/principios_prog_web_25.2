import { User } from './User';
import { Product } from './Product';
import { Cart } from './Cart';
import CartItem from './CartItem';
import Purchase from './Purchase';
import PurchaseItem from './PurchaseItem';
import Sale from './Sale';
import SaleItem from './SaleItem';

User.hasMany(Product, {
    foreignKey: 'userId',
    as: 'productsUser',
    onDelete: 'CASCADE'
});

Product.belongsTo(User, {
    foreignKey: 'userId',
    as: 'seller'
});

User.hasOne(Cart, {
    foreignKey: 'userId',
    as: 'cart',
    onDelete: 'CASCADE'
});

Cart.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});

Cart.belongsToMany(Product, {
    through: CartItem,
    foreignKey: 'cartId',
    otherKey: 'productId',
    as: 'productsInCart',
});

Product.belongsToMany(Cart, {
    through: CartItem,
    foreignKey: 'productId',
    otherKey: 'cartId',
    as: 'cartsWithProduct',
});

Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'items' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId' });

Product.hasMany(CartItem, {
    foreignKey: 'productId',
    as: 'cartLink',
    onDelete: 'CASCADE'
});

CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.hasMany(Purchase, {
    foreignKey: 'userId',
    as: 'purchases',
    onDelete: 'CASCADE'
});

Purchase.belongsTo(User, {
    foreignKey: 'userId',
    as: 'customer'
});

Purchase.hasMany(PurchaseItem, {
    foreignKey: 'purchaseId',
    as: 'items',
    onDelete: 'CASCADE'
});

PurchaseItem.belongsTo(Purchase, {
    foreignKey: 'purchaseId',
    as: 'purchase'
});

User.hasMany(Sale, {
    foreignKey: 'sellerId',
    as: 'salesHistory',
    onDelete: 'CASCADE'
});

Sale.belongsTo(User, {
    foreignKey: 'sellerId',
    as: 'seller'
});

Sale.hasMany(SaleItem, {
    foreignKey: 'saleId',
    as: 'soldItems',
    onDelete: 'CASCADE'
});

SaleItem.belongsTo(Sale, {
    foreignKey: 'saleId',
    as: 'sale'
});

export { User, Product, Cart, CartItem, Purchase, PurchaseItem, Sale, SaleItem };