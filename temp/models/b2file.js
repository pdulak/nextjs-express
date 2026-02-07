'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class B2File extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      B2File.hasMany(models.B2FileDownload, {
        foreignKey: 'b2FileId',
        as: 'B2FileDownloads'
      });
    }
  }
  B2File.init({
    name: DataTypes.STRING,
    publicUrl: DataTypes.STRING,
    slug: DataTypes.STRING,
    notes: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'B2File',
  });
  return B2File;
};