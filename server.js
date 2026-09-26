import express from 'express'
import cors from 'cors'
import crypto from 'node:crypto'
import 'dotenv/config'
import { YooCheckout } from '@a2seven/yoo-checkout'

const app = express()

app.use(cors())
app.use(express.json())

const PORT = 3000

console.log('PAYMENT ROUTE LOADED')

const checkout = new YooCheckout({
  shopId: process.env.YOOKASSA_SHOP_ID,
  secretKey: process.env.YOOKASSA_SECRET_KEY,
})

app.get('/test', (req, res) => {
  res.json({ test: 'OK' })
})

app.get('/', (req, res) => {
  res.json({
    message: 'Backend работает',
  })
})

app.post('/api/payment/create', async (req, res) => {
  console.log('PAYMENT CREATE REQUEST', req.body)

  try {
    const { amount, orderNumber } = req.body

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        error: 'Некорректная сумма',
      })
    }

    const payment = await checkout.createPayment(
      {
        amount: {
          value: Number(amount).toFixed(2),
          currency: 'RUB',
        },
        confirmation: {
          type: 'redirect',
          return_url: 'http://localhost:5177',
        },
        description: `Заказ YouTubeOS Shop ${orderNumber || ''}`.trim(),
      },
      crypto.randomUUID(),
    )

    console.log('PAYMENT CREATED:', payment)

    res.json({
      paymentId: payment.id,
      confirmationUrl:
        payment.confirmation?.confirmation_url,
    })
  } catch (error) {
    console.error('=== YOOKASSA ERROR ===')
    console.dir(error, { depth: null })

    if (error?.response) {
      console.error('=== RESPONSE ===')
      console.dir(error.response, { depth: null })
    }

    console.error('message:', error?.message)
    console.error('code:', error?.code)
    console.error('errno:', error?.errno)
    console.error('syscall:', error?.syscall)
    console.error('stack:', error?.stack)

    res.status(500).json({
      error: error?.message || 'Ошибка ЮKassa',
    })
  }
})

app.listen(PORT, () => {
  console.log(`Backend запущен: http://localhost:${PORT}`)
})

setInterval(() => {}, 1000)