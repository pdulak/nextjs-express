import { Sequelize } from "sequelize";
import path from "path";

const storagePath =
  process.env.DB_PATH ||
  path.join(__dirname, "..", "..", "..", "..", "database", "database.sqlite");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: storagePath,
  logging: false,
});

export default sequelize;
