import {
  Model,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from "sequelize";
import sequelize from "../config/database";

class B2File extends Model<InferAttributes<B2File>, InferCreationAttributes<B2File>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare publicUrl: string;
  declare slug: string;
  declare notes: CreationOptional<string>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

B2File.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    publicUrl: DataTypes.STRING,
    slug: {
      type: DataTypes.STRING,
      unique: true,
    },
    notes: DataTypes.TEXT,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "B2File",
  }
);

export default B2File;
