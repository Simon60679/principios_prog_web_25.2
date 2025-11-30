import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

// 1. Atributos que existem na tabela
export interface PurchaseAttributes {
  id: number;
  userId: number; // Chave estrangeira para User
  totalAmount: number; // Valor total da compra
  purchaseDate: Date; // Data da compra
}

// 2. Atributos necessários para criar
// O ID e a data podem ser opcionais/gerados automaticamente
export interface PurchaseCreationAttributes
  extends Optional<PurchaseAttributes, "id" | "purchaseDate" | "totalAmount"> {}

// 3. Classe do modelo
export class Purchase
  extends Model<PurchaseAttributes, PurchaseCreationAttributes>
  implements PurchaseAttributes
{
  public id!: number;
  public userId!: number;
  public totalAmount!: number;
  public purchaseDate!: Date;

  // Propriedades criadas pelo Sequelize
  // public readonly User?: User; 
  // public readonly PurchaseItems?: PurchaseItem[]; 
}

// 4. Inicialização do modelo
Purchase.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      }
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2), // 10 dígitos no total, 2 após o ponto
        allowNull: false,
        defaultValue: 0.00, // Será calculado na lógica de criação
    },
    purchaseDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW, // Valor padrão é a data e hora atual
    }
  },
  {
    sequelize,
    tableName: "purchases",
    timestamps: false,
  }
);

export default Purchase;