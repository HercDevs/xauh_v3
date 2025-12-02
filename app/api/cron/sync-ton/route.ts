import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tonApiKey = process.env.TON_API_KEY
    const poolAddress = process.env.CAPITALDEX_POOL_ADDRESS
    const tokenAddress = process.env.XAUH_TOKEN_ADDRESS

    if (!tonApiKey || !poolAddress || !tokenAddress) {
      return NextResponse.json(
        { error: 'Missing TON API credentials' },
        { status: 500 }
      )
    }

    console.log('🔄 Starting TON sync...')

    const response = await axios.get(
      `https://tonapi.io/v2/blockchain/accounts/${poolAddress}/transactions`,
      {
        headers: {
          Authorization: `Bearer ${tonApiKey}`,
        },
        params: {
          limit: 100,
        },
      }
    )

    const transactions = response.data.transactions || []
    let newSwaps = 0
    let skippedSwaps = 0

    for (const tx of transactions) {
      const txHash = tx.hash

      const existing = await prisma.rawSwap.findUnique({
        where: { txHash },
      })

      if (existing) {
        skippedSwaps++
        continue
      }

      const inMsg = tx.in_msg
      const outMsgs = tx.out_msgs || []
      
      if (!inMsg || outMsgs.length === 0) {
        continue
      }

      const wallet = inMsg.source?.address || 'unknown'
      const tonValue = parseFloat(inMsg.value || '0') / 1e9

      if (tonValue < 0.01) {
        continue
      }

      // Extract XAUH token amount from jetton_transfer in outgoing messages
      let amountOut = 0
      for (const outMsg of outMsgs) {
        if (outMsg.decoded_op_name === 'jetton_transfer' && outMsg.decoded_body?.amount) {
          // Jetton amounts use very large integers - divide by 1e18 for proper decimals
          amountOut = parseFloat(outMsg.decoded_body.amount) / 1e18
          break
        }
      }

      const swapData = {
        txHash,
        wallet,
        side: 'buy',
        amountIn: tonValue,
        amountOut,
        tonValueUsd: tonValue * 5,
        swapAt: new Date(tx.utime * 1000),
      }

      await prisma.rawSwap.create({
        data: { ...swapData, fetchedAt: new Date() },
      })

      await prisma.swap.create({
        data: swapData,
      })

      newSwaps++
    }

    console.log(`✅ TON sync complete: ${newSwaps} new, ${skippedSwaps} skipped`)

    return NextResponse.json({
      success: true,
      newSwaps,
      skippedSwaps,
      totalProcessed: transactions.length,
    })
  } catch (error: any) {
    console.error('❌ TON sync failed:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
