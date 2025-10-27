import axios from 'axios'

const tonApiKey = process.env.TON_API_KEY || ''
const tokenAddress = process.env.XAUH_TOKEN_ADDRESS || ''

async function checkToken() {
  console.log('🔍 Checking XAUH token on TON blockchain...')
  console.log(`Token address: ${tokenAddress}`)
  console.log(`API Key: ${tonApiKey.substring(0, 10)}...`)

  try {
    // Try to get basic account info
    console.log('\n📱 Attempting: Get account info...')
    const accountResponse = await axios.get(
      `https://tonapi.io/v2/accounts/${tokenAddress}`,
      {
        headers: {
          Authorization: `Bearer ${tonApiKey}`,
        },
      }
    )
    console.log('✅ Account found!')
    console.log(JSON.stringify(accountResponse.data, null, 2))

  } catch (error: any) {
    if (error.response) {
      console.error(`❌ Error ${error.response.status}:`, error.response.data)
    } else {
      console.error('❌ Request failed:', error.message)
    }
  }

  try {
    // Try to get jetton info
    console.log('\n📱 Attempting: Get jetton (token) info...')
    const jettonResponse = await axios.get(
      `https://tonapi.io/v2/jettons/${tokenAddress}`,
      {
        headers: {
          Authorization: `Bearer ${tonApiKey}`,
        },
      }
    )
    console.log('✅ Jetton found!')
    console.log(JSON.stringify(jettonResponse.data, null, 2))

  } catch (error: any) {
    if (error.response) {
      console.error(`❌ Error ${error.response.status}:`, error.response.data)
    } else {
      console.error('❌ Request failed:', error.message)
    }
  }

  try {
    // Try to get transactions
    console.log('\n📱 Attempting: Get transactions...')
    const txResponse = await axios.get(
      `https://tonapi.io/v2/blockchain/accounts/${tokenAddress}/transactions`,
      {
        headers: {
          Authorization: `Bearer ${tonApiKey}`,
        },
        params: {
          limit: 10,
        },
      }
    )
    console.log('✅ Transactions found!')
    console.log(`Found ${txResponse.data.transactions?.length || 0} transactions`)
    console.log(JSON.stringify(txResponse.data, null, 2))

  } catch (error: any) {
    if (error.response) {
      console.error(`❌ Error ${error.response.status}:`, error.response.data)
    } else {
      console.error('❌ Request failed:', error.message)
    }
  }
}

checkToken()
