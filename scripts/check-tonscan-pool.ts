import axios from 'axios'

async function checkTonscanPool() {
  const tonApiKey = 'AFWP7JK6CTXRXLAAAAABSW6XJUMW7CTPRN354GDZ64W5AU5ATU4DCMMVQJABRUB2YVWBC7I'
  const poolAddress = 'EQDtPY-Z6XAn1oCw-tBENhY2yChZEJWx9gJ4mpcN8LzXShlR'

  console.log('🔍 Checking pool transactions from TON API...\n')
  console.log(`Pool: ${poolAddress}\n`)

  try {
    const response = await axios.get(
      `https://tonapi.io/v2/blockchain/accounts/${poolAddress}/transactions`,
      {
        headers: { Authorization: `Bearer ${tonApiKey}` },
        params: { limit: 20 },
      }
    )

    const transactions = response.data.transactions || []
    console.log(`📊 Recent transactions: ${transactions.length}\n`)

    console.log('Last 10 transactions:')
    console.log('Date\t\t\tTON In\tTON Out\tDescription')
    console.log('─'.repeat(80))

    transactions.slice(0, 10).forEach((tx: any) => {
      const date = new Date(tx.utime * 1000).toISOString().split('T')[0]
      const time = new Date(tx.utime * 1000).toTimeString().split(' ')[0]

      const inMsg = tx.in_msg
      const outMsgs = tx.out_msgs || []

      const tonIn = inMsg ? (parseFloat(inMsg.value || '0') / 1e9).toFixed(2) : '0.00'

      let tonOut = 0
      outMsgs.forEach((msg: any) => {
        tonOut += parseFloat(msg.value || '0') / 1e9
      })

      const description = tx.description || 'swap'

      console.log(`${date} ${time}\t${tonIn}\t${tonOut.toFixed(2)}\t${description}`)
    })

    console.log('\n📋 Transaction details for first transaction:')
    if (transactions.length > 0) {
      const first = transactions[0]
      console.log(JSON.stringify(first, null, 2))
    }

  } catch (error: any) {
    console.error('Error:', error.message)
    if (error.response) {
      console.error('Response:', error.response.data)
    }
  }
}

checkTonscanPool()
