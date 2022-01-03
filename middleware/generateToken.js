var jwt = require('jsonwebtoken')
const { Account } = require('../db.js')

module.exports = async function (ctx) {
  if (ctx.request.body.secret) {
    try {
      const account = await Account.findOne({
        where: { cycleToken: ctx.request.body.secret },
        attributes: ['shopifyShop', 'shopifyToken'],
      })

      if (account && account.shopifyShop) {
        const email = await updateShopInfo(
          account.shopifyShop,
          account.shopifyToken
        )
        const shop = account.shopifyShop
        ctx.status = 200
        ctx.body = {
          shop: { shop, email },
          token: jwt.sign({ shop }, process.env.JWT_SECRET),
          message: 'Success',
        }
      } else {
        denyRequest(ctx)
      }
    } catch (err) {
      denyRequest(ctx)
    }
  } else {
    denyRequest(ctx)
  }
  return ctx
}

const denyRequest = ctx => {
  ctx.status = ctx.status = 401
  ctx.body = {
    message: 'Denied',
  }
}

const updateShopInfo = async (shop, token) => {
  try {
    const url = `https://${shop}/admin/api/2021-10/shop.json`
    return await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
    })
      .then(response => response.json())
      .then(async response => {
        await Account.update(
          { shopifyEmail: response.shop.email },
          { where: { shopifyShop: response.shop.myshopify_domain } }
        )
        return response.shop.email
      })
  } catch (err) {
    console.log(err)
  }
}
