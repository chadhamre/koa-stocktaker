const { Account } = require('../db.js')

const query = `{
  shop {
    locations(first: 100) {
      edges {
        node {
          name
          id
        }
      }
    }
  }
}`

module.exports = async function(ctx) {
  try {
    const account = await Account.findOne({
      where: { shopifyShop: ctx.state.user.shop },
      attributes: ['shopifyShop', 'shopifyToken'],
    })
    await fetch(
      `https://${account.shopifyShop}/admin/api/2020-04/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': account.shopifyToken,
        },
        body: JSON.stringify({ query }),
      }
    )
      .then(response => response.json())
      .then(response => {
        if (
          response.errors ===
          '[API] Invalid API key or access token (unrecognized login or wrong password)'
        ) {
          denyRequest(ctx)
        } else if (
          response &&
          response.data &&
          response.data.shop &&
          response.data.shop.locations &&
          response.data.shop.locations.edges
        ) {
          ctx.status = 200
          ctx.body = response.data.shop.locations.edges.map(item => item.node)
        } else {
          console.log(response)
          denyRequest(ctx)
        }
      })
  } catch (err) {
    console.log(err)
    denyRequest(ctx)
  }
}

const denyRequest = ctx => {
  ctx.status = ctx.status = 401
  ctx.body = {
    error: {
      type: 'BAD_TOKEN',
      message: 'Shopify token was rejected.',
    },
  }
}
