const fs = require('fs')
const readline = require('readline')

const { Account, Updates } = require('../db.js')

module.exports = async function(ctx) {
  try {
    const batchId = ctx.request.body.batchId

    const pendingCount = await Updates.count({
      where: {
        batchId,
        status: 'PENDING',
      },
    })

    const doneCount = await Updates.count({
      where: {
        batchId,
        status: 'DONE',
      },
    })

    ctx.state = 200
    ctx.body = {
      success: true,
      pending: pendingCount,
      done: doneCount,
    }

    const someUpdates = await Updates.findAll({
      where: {
        batchId,
        status: 'PENDING',
      },
      limit: 2,
    })

    const ids = someUpdates.map(item => item.id)

    await Updates.update({ status: 'INFLIGHT' }, { where: { id: ids } })

    if (ids.length) updateShopify(someUpdates)
  } catch (err) {
    console.log(err)
    denyRequest(ctx)
  }
}

const updateShopify = async updates => {
  const update = updates.pop()
  let url = `https://${update.shopifyShop}/admin/api/2020-04/inventory_levels/`
  const body = {
    location_id: update.locationId,
    inventory_item_id: update.inventoryItemId,
  }
  if (update.updateType === 'OVERWRITE') {
    url += `set.json`
    body.available = update.quantity
  }
  if (update.updateType === 'DELTA') {
    url += `adjust.json`
    body.available_adjustment = update.quantity
  }
  const stringifiedBody = JSON.stringify(body)
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': update.shopifyToken,
    },
    body: stringifiedBody,
  })
    .then(response => response.json())
    .then(async response => {
      if (response.inventory_level) {
        console.log('UPDATED', update.id)
        Updates.update({ status: 'DONE' }, { where: { id: update.id } })
        if (updates.length) await updateShopify(updates)
      }
    })
}
