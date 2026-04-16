const path = require('path');

const storagePath =
  process.env.DB_PATH ||
  path.resolve(__dirname, '..', '..', '..', '..', 'database', 'database.sqlite');

module.exports = {
  development: {
    dialect: 'sqlite',
    storage: storagePath,
  },
  production: {
    dialect: 'sqlite',
    storage: storagePath,
  },
};
