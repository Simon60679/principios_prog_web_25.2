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