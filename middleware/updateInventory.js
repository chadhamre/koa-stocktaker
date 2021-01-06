const hash = require('object-hash')
const { Account, Updates } = require('../db.js')

module.exports = async function (ctx) {
  try {
    // fetch account from database
    const account = await Account.findOne({
      where: { shopifyShop: ctx.state.user.shop },
      attributes: ['shopifyShop', 'shopifyToken'],
    })
    const shop = account.shopifyShop
    const token = account.shopifyToken

    const location = ctx.request.body.location

    if (!ctx.request.body.hash) {
      const batchId = hash(ctx.request.body)
      const existing = await Updates.count({
        where: {
          batchId,
          status: 'PENDING',
        },
      })
      if (existing > 0) {
        console.log('EXISTING PENDING', shop, batchId)
        ctx.state = 200
        ctx.body = {
          success: true,
          batch: batchId,
        }
      } else {
        if (ctx.request.body.deltas) {
          const deltaInserts = ctx.request.body.deltas.map((item) => {
            return {
              batchId,
              shopifyShop: shop,
              shopifyToken: token,
              locationId: location,
              barcode: item.barcode,
              inventoryItemId: item.id,
              updateType: 'DELTA',
              quantity: item.delta,
              status: 'PENDING',
            }
          })
          await Updates.bulkCreate(deltaInserts)
        }
        if (ctx.request.body.overwrites) {
          const overwriteInserts = ctx.request.body.overwrites.map((item) => {
            return {
              batchId,
              shopifyShop: shop,
              shopifyToken: token,
              locationId: location,
              barcode: item.barcode,
              inventoryItemId: item.id,
              updateType: 'OVERWRITE',
              quantity: item.overwrite,
              status: 'PENDING',
            }
          })
          await Updates.bulkCreate(overwriteInserts)
        }

        const pending = await Updates.count({
          where: {
            batchId,
          },
        })

        ctx.state = 200
        ctx.body = {
          success: true,
          batch: batchId,
          pending,
        }
      }
    }
  } catch (err) {
    console.log(err)
    denyRequest(ctx)
  }
}

const denyRequest = (ctx) => {
  ctx.status = ctx.status = 401
  ctx.body = {
    error: {
      type: 'AUTH_ERROR',
      message: 'Denied',
    },
  }
}
