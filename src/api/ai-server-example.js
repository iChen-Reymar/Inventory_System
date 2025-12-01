// ai-server-example.js (Express)
import express from 'express'
import bodyParser from 'body-parser'
import { Configuration, OpenAIApi } from 'openai'
import { createClient } from '@supabase/supabase-js'

const app = express()
app.use(bodyParser.json())

const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }))
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY) // service role key or restricted token

app.post('/api/ai/chat', async (req, res) => {
  const { message } = req.body
  // Basic parser: if message asks about availability, attempt to lookup name
  const lower = message.toLowerCase()
  let productQuery = null
  const availMatch = lower.match(/is (.+?) available|availability of (.+)/)
  if (availMatch) productQuery = (availMatch[1] || availMatch[2] || '').trim()

  if (productQuery) {
    // search inventory
    const { data } = await supabase.from('inventory').select('*').ilike('name', `%${productQuery}%`).limit(5)
    if (data && data.length > 0) {
      const reply = data.map(d => `${d.name} — ₱${d.price} — Qty: ${d.quantity}`).join('\n')
      return res.json({ reply: `I found:\n${reply}` })
    } else {
      return res.json({ reply: `No products found for "${productQuery}". Would you like suggestions?` })
    }
  }

  // Fallback: use OpenAI to generate a helpful reply and optionally ask for clarification
  try {
    const prompt = `You are an assistant that answers customer queries about motor parts inventory. Customer: "${message}"\nUse the following rules: be concise, if product names mentioned, ask to confirm exact name, if user asks availability ask to search using the product name.`
    const response = await openai.createCompletion({ model: 'text-davinci-003', prompt, max_tokens: 200 })
    return res.json({ reply: response.data.choices[0].text.trim() })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ reply: 'AI error' })
  }
})

app.listen(3000, () => console.log('AI server running on :3000'))
