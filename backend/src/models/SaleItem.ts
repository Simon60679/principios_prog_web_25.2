import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

export interface SaleItemAttributes {
  id: number;
  saleId: number;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}

export interface SaleItemCreationAttributes
  extends Optional<SaleItemAttributes, "id" | "subtotal"> { }

/**
 * @swagger
 * components:
 *   schemas:
 *     SaleItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID do item da venda
 *         saleId:
 *           type: integer
 *           description: ID da venda associada
 *         productName:
 *           type: string
 *           description: Nome do produto vendido
 *         productPrice:
 *           type: number
 *           format: float
 *           description: Preço do produto na venda
 *         quantity:
 *           type: integer
 *           description: Quantidade vendida
 *         subtotal:
 *           type: number
 *           format: float
 *           description: Subtotal do item
 *       example:
 *         id: 1
 *         saleId: 5
 *         productName: "Mouse Gamer"
 *         productPrice: 150.00
 *         quantity: 2
 *         subtotal: 300.00
 */
export class SaleItem
  extends Model<SaleItemAttributes, SaleItemCreationAttributes>
  implements SaleItemAttributes {
  public id!: number;
  public saleId!: number;
  public productName!: string;
  public productPrice!: number;
  public quantity!: number;
  public subtotal!: number;
}

SaleItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    saleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sales',
        key: 'id',
      }
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    productPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    }
  },
  {
    sequelize,
    tableName: "sale_items",
    timestamps: false,
  }
);

export default SaleItem;