import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

export interface PurchaseItemAttributes {
  id: number;
  purchaseId: number;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}

export interface PurchaseItemCreationAttributes
  extends Optional<PurchaseItemAttributes, "id" | "subtotal"> { }

export class PurchaseItem
  extends Model<PurchaseItemAttributes, PurchaseItemCreationAttributes>
  implements PurchaseItemAttributes {
  public id!: number;
  public purchaseId!: number;
  public productName!: string;
  public productPrice!: number;
  public quantity!: number;
  public subtotal!: number;
}

PurchaseItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    purchaseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'purchases',
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
    tableName: "purchase_items",
    timestamps: false,
  }
);

export default PurchaseItem;