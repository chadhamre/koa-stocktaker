const ObjectsToCsv = require('objects-to-csv')
const sgMail = require('@sendgrid/mail')

const { Account, Updates } = require('../db.js')

module.exports = async function(ctx) {
  try {
    const { batchId, email } = ctx.request.body

    const updates = await Updates.findAll({
      where: { batchId },
      raw: true,
      attributes: [
        'locationId',
        'barcode',
        'inventoryItemId',
        'updateType',
        'quantity',
        'status',
        'updatedAt',
      ],
    })

    const csv = new ObjectsToCsv(updates)

    const result = await sendEmail(email, csv)

    ctx.state = 200
    ctx.body = { success: result }
  } catch (err) {
    console.log(err)
    denyRequest(ctx)
  }
}

const sendEmail = async (email, csv) => {
  const csvAsString = await csv.toString()
  const encodedString = Buffer.from(csvAsString).toString('base64')
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)

  const msg = {
    to: email,
    from: 'hello@saskatoonlabs.com',
    subject: 'Your Inventory CSV',
    text: 'Please find your CSV attached. It includes the updates you made.',
    attachments: [
      {
        content: encodedString,
        filename: 'inventory.csv',
        type: 'application/csv',
        disposition: 'attachment',
      },
    ],
  }

  return sgMail
    .send(msg)
    .then(() => {
      console.log('Email sent', email)
      return true
    })
    .catch(err => {
      console.log(JSON.stringify(err))
      return false
    })
}
