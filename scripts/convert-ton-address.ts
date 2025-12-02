import { Address } from '@ton/core'

// Your pool address in raw format
const rawAddress = '0:4fae7cb51396bd5606c65c5268fff8827560ea404d6ceea50738d20db5fdf3fb'

try {
  const address = Address.parse(rawAddress)
  const friendlyAddress = address.toString()

  console.log('Raw address:', rawAddress)
  console.log('Friendly (EQ) address:', friendlyAddress)
  console.log('\nUpdate your .env with:')
  console.log(`CAPITALDEX_POOL_ADDRESS=${friendlyAddress}`)
} catch (error) {
  console.error('Error converting address:', error)
}
