import { Model, DataTypes, Optional } from "sequelize";
import Product from "./Product";
import sequelize from "../config/database";

export interface CartItemAttributes {
  cartId: number;
  productId: number;
  quantity: number;
}

export interface CartItemCreationAttributes
  extends CartItemAttributes { }

/**
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       required:
 *         - cartId
 *         - productId
 *         - quantity
 *       properties:
 *         cartId:
 *           type: integer
 *           description: ID do carrinho (mesmo que userId)
 *         productId:
 *           type: integer
 *           description: ID do produto
 *         quantity:
 *           type: integer
 *           description: Quantidade do produto no carrinho
 *       example:
 *         cartId: 1
 *         productId: 5
 *         quantity: 2
 */
export class CartItem
  extends Model<CartItemAttributes, CartItemCreationAttributes>
  implements CartItemAttributes {
  public cartId!: number;
  public productId!: number;
  public quantity!: number;
  public readonly product?: Product;
}

CartItem.init(
  {
    cartId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'carts',
        key: 'userId',
      }
    },
    productId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    }
  },
  {
    sequelize,
    tableName: "itens_carrinho",
    timestamps: false,
  }
);

export default CartItem;