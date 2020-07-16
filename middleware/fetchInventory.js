const fs = require('fs')
const readline = require('readline')

const { Account } = require('../db.js')

const partialMutation = `mutation {
  bulkOperationRunQuery(
    query:"""
    {
      products {
        edges {
          node {
            title
            id
            variants {
              edges {
                node {
                  displayName
                  id
                  title
                  barcode
                  sku
                  inventoryItem {
                    id
                    inventoryLevel(locationId:"gid://shopify/Location/XXX") {
                      id
                      available
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    """
  ) {
    bulkOperation {
      id
      status
    }
    userErrors {
      field
      message
    }
  }
}`

const query = `{
  currentBulkOperation {
    id
    status
    errorCode
    createdAt
    completedAt
    objectCount
    fileSize
    url
    partialDataUrl
  }
}`

const store = {}

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

    // check store for recent query
    const queryId = `${shop}-${location}`
    if (
      !store[queryId] ||
      // inventory must have been requested in the past 5 minutes
      Date.now() - store[queryId].registeredAt > 5 * 60 * 1000
    ) {
      const jobResponse = await requestBulkJob(shop, location, token, queryId)
      ctx.status = 200
      ctx.body = jobResponse
    } else {
      const pollResponse = await pollForPreviousQuery(shop, token)
      console.log('POLL', pollResponse)
      if (pollResponse.status === 'COMPLETED' && pollResponse.url) {
        delete store[queryId]
        ctx.body = await prepareInventory(pollResponse.url, queryId)
      } else {
        ctx.body = pollResponse
        ctx.status = 200
      }
    }
  } catch (err) {
    console.log(err)
    denyRequest(ctx)
  }
}

const requestBulkJob = async (shop, location, token, queryId) => {
  try {
    const mutation = partialMutation.split('XXX').join(`${location}`)

    const response = await fetch(
      `https://${shop}/admin/api/2020-04/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': token,
        },
        body: JSON.stringify({ query: mutation }),
      }
    ).then((response) => response.json())

    // check for errors
    const errorText =
      'A bulk operation for this app and shop is already in progress: gid://shopify/BulkOperation/'
    if (
      response.data.bulkOperationRunQuery.userErrors &&
      response.data.bulkOperationRunQuery.userErrors[0] &&
      response.data.bulkOperationRunQuery.userErrors[0].message &&
      response.data.bulkOperationRunQuery.userErrors[0].message.includes(
        errorText
      )
    ) {
      console.log('ERROR', JSON.stringify(response))
      const processingId = response.data.bulkOperationRunQuery.userErrors[0].message
        .split(errorText)[1]
        .slice(0, -1)

      store[queryId] = {
        operationId: processingId,
        registeredAt: Date.now(),
      }
      return { status: 'RUNNING' }
    } else {
      const bulkOperation = response.data.bulkOperationRunQuery.bulkOperation
      const operationId = bulkOperation.id
      const operationStatus = bulkOperation.status

      // add query to store
      store[queryId] = { operationId, registeredAt: Date.now() }

      return { status: operationStatus }
    }
  } catch (err) {
    console.log(err)
  }
}

const pollForPreviousQuery = async (shop, token) => {
  try {
    return await fetch(`https://${shop}/admin/api/2020-04/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({ query }),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.data.currentBulkOperation.url) {
          return {
            status: response.data.currentBulkOperation.status,
            url: response.data.currentBulkOperation.url,
          }
        } else {
          return { status: response.data.currentBulkOperation.status }
        }
      })
  } catch (err) {
    console.log(err)
  }
}

const prepareInventory = async (url, queryId) => {
  try {
    return await fetch(url).then(
      (res) =>
        new Promise((resolve, reject) => {
          const dest = fs.createWriteStream(`${__dirname}/data/${queryId}.json`)
          res.body.pipe(dest)
          dest.on('error', (err) => console.log(err))
          dest.on('close', async () => {
            const fileStream = fs.createReadStream(
              `${__dirname}/data/${queryId}.json`
            )
            const rl = readline.createInterface({
              input: fileStream,
              crlfDelay: Infinity,
            })
            const inventory = {}
            for await (const line of rl) {
              const parsed = JSON.parse(line)
              if (
                parsed &&
                parsed.barcode &&
                parsed.inventoryItem &&
                parsed.inventoryItem.inventoryLevel
              ) {
                const shaped = {
                  id: parsed.inventoryItem.id,
                  barcode: parsed.barcode,
                  sku: parsed.sku,
                  title: parsed.displayName,
                  available: parsed.inventoryItem.inventoryLevel.available,
                  product: parsed.__parentId,
                }
                inventory[parsed.barcode] = shaped
              }
            }

            fs.unlink(`${__dirname}/data/${queryId}.json`, (err) => {
              if (err) {
                console.error(err)
              }
            })
            return resolve({ inventory })
          })
          dest.on('error', reject)
        })
    )
  } catch (err) {
    console.log(err)
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
