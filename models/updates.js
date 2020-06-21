const { Sequelize, DataTypes } = require('sequelize')

module.exports = (sequelize, type) => {
  return sequelize.define('updates', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    batchId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shopifyShop: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shopifyToken: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    locationId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    barcode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    inventoryItemId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    updateType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  })
}
