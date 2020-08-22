const dotenv = require('dotenv')
const AccountModel = require('./models/account')
const UpdatesModel = require('./models/updates')

const { Sequelize } = require('sequelize')

dotenv.config()

const sequelize = new Sequelize(process.env.JAWSDB_COPPER_URL, {
  logging: false,
})

const Account = AccountModel(sequelize, Sequelize)
const Updates = UpdatesModel(sequelize, Sequelize)

sequelize.sync().then(() => {
  console.log(`Database & tables created!`)
})

module.exports = {
  Account,
  Updates,
}
