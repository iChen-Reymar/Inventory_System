import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { chatWithGemini, getProductContext, isGeminiAvailable } from '../services/geminiService'
import { useAuth } from '../context/AuthContext'

export default function ChatbotWidget() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', text: isGeminiAvailable() 
      ? isAdmin
        ? 'Hey there! 👋 I\'m here to help you check product availability and answer stock-level questions. Ask me about any product by name, or say "Show all products" to see everything we have in stock.'
        : 'Hey there! 👋 I\'m here to help you check product availability. Ask me about any product by name, or say "Show all products" to see everything we have in stock.'
      : 'Hi! Ask me about any product by name, or say "Show all products" to see everything.' }
  ])
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [productsLoaded, setProductsLoaded] = useState(false)
  const messagesEndRef = useRef(null)

  // Load products when chatbot opens
  useEffect(() => {
    if (open && !productsLoaded) {
      loadProducts()
    }
  }, [open, productsLoaded])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadProducts() {
    try {
      const productData = await getProductContext(supabase)
      setProducts(productData)
      setProductsLoaded(true)
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  async function send() {
    if (!input.trim()) return

    const userMessage = input.trim()
    const lowerMessage = userMessage.toLowerCase()
    setMessages(m => [...m, { role: 'user', text: userMessage }])
    setInput('')
    setLoading(true)

    try {
      // Ensure products are loaded
      if (!productsLoaded) {
        await loadProducts()
      }

      // Try Gemini AI first if available (for product availability inquiries)
      if (isGeminiAvailable()) {
        // Build conversation history (last 10 messages for context)
        const recentMessages = messages.slice(-10)
        
        const geminiResponse = await chatWithGemini(
          userMessage, 
          products, 
          recentMessages,
          isAdmin
        )
        
        if (!geminiResponse.error && !geminiResponse.fallback) {
          setMessages(m => [...m, { role: 'assistant', text: geminiResponse.text }])
          setLoading(false)
          return
        }
        // If Gemini fails, fall through to fallback logic
      }

      // Fallback to original logic if Gemini is not available or fails
      
      // Check for "show all products" queries
      if (lowerMessage.includes('show all') || lowerMessage.includes('list all') || 
          lowerMessage.includes('all products') || lowerMessage.includes('all available')) {
        
        const { data, error } = await supabase
          .from('inventory')
          .select('name, quantity, price, brand, category')
          .order('name', { ascending: true })

        if (error) throw error

        if (data && data.length > 0) {
          const availableProducts = data.filter(p => p.quantity > 0)
          const outOfStock = data.filter(p => p.quantity === 0)

          let response = `Sure thing! Here's what we have in stock:\n\n`
          response += `📦 Total Products: ${data.length}\n\n`
          
          if (availableProducts.length > 0) {
            response += `✅ Available Products (${availableProducts.length}):\n`
            availableProducts.forEach(product => {
              response += `• ${product.name}${product.brand ? ` (${product.brand})` : ''} - ₱${product.price} - ${product.quantity} units available`
              if (product.category) response += ` - ${product.category}`
              response += '\n'
            })
          }

          if (outOfStock.length > 0) {
            response += `\n❌ Currently Out of Stock (${outOfStock.length}):\n`
            outOfStock.forEach(product => {
              response += `• ${product.name}${product.brand ? ` (${product.brand})` : ''} - ₱${product.price}\n`
            })
          }

          setMessages(m => [...m, { role: 'assistant', text: response }])
        } else {
          setMessages(m => [...m, { role: 'assistant', text: 'I\'m sorry, but we don\'t have any products in our inventory at the moment. 😔' }])
        }
        setLoading(false)
        return
      }

      // Extract product name from various question formats
      let productName = null
      
      const pattern1 = /is\s+(.+?)\s+available\?/i
      const match1 = lowerMessage.match(pattern1)
      if (match1) productName = match1[1].trim()
      
      const pattern2 = /do\s+you\s+have\s+(.+?)\??/i
      const match2 = lowerMessage.match(pattern2)
      if (match2) productName = match2[1].trim()
      
      const pattern3 = /(.+?)\s+(available|in stock)\??/i
      const match3 = lowerMessage.match(pattern3)
      if (match3) productName = match3[1].trim()
      
      // Try to extract product name from simple queries
      if (!productName && userMessage.length < 50 && 
          !lowerMessage.includes('what') && !lowerMessage.includes('how') && 
          !lowerMessage.includes('when') && !lowerMessage.includes('where') &&
          !lowerMessage.includes('show') && !lowerMessage.includes('list')) {
        const cleaned = userMessage.replace(/\b(is|are|do|does|have|has|the|a|an|available|stock|in|tell|me|about)\b/gi, '').trim()
        if (cleaned.length > 2) {
          productName = cleaned
        }
      }

      if (productName) {
        const { data, error } = await supabase
          .from('inventory')
          .select('name, quantity, price, brand, description, category')
          .ilike('name', `%${productName}%`)
          .limit(5)

        if (error) throw error

        if (data && data.length > 0) {
          if (data.length > 1) {
            let response = `Great! I found ${data.length} products matching "${productName}":\n\n`
            data.forEach(product => {
              if (product.quantity > 0) {
                response += `✅ ${product.name}${product.brand ? ` (${product.brand})` : ''}\n`
                response += `   💰 Price: ₱${product.price} | 📦 We have ${product.quantity} units in stock`
                if (product.category) response += ` | 📂 ${product.category}`
                if (product.description) response += `\n   📝 ${product.description}`
                response += '\n\n'
              } else {
                response += `❌ ${product.name}${product.brand ? ` (${product.brand})` : ''}\n`
                response += `   💰 Price: ₱${product.price} | Unfortunately, this is out of stock right now\n\n`
              }
            })
            setMessages(m => [...m, { role: 'assistant', text: response }])
          } else {
            const product = data[0]
            let response = ''
            if (product.quantity > 0) {
              response = `Yes! We have ${product.name}${product.brand ? ` (${product.brand})` : ''} available! 🎉\n\n`
              response += `💰 Price: ₱${product.price}\n`
              response += `📦 Stock: We have ${product.quantity} units ready to go\n`
              if (product.category) response += `📂 Category: ${product.category}\n`
              if (product.description) response += `\n📝 ${product.description}`
            } else {
              response = `I'm sorry, but ${product.name}${product.brand ? ` (${product.brand})` : ''} is currently out of stock. 😔\n\n`
              response += `💰 Price: ₱${product.price} (when available)`
              if (product.description) response += `\n\n📝 ${product.description}`
              response += `\n\nWould you like me to check if we have similar products available?`
            }
            setMessages(m => [...m, { role: 'assistant', text: response }])
          }
        } else {
          setMessages(m => [...m, {
            role: 'assistant',
            text: `Hmm, I couldn't find "${productName}" in our inventory. 😕\n\nNo worries though! You can:\n• Ask me to "show all products" to see what we have\n• Check the spelling of the product name\n• Or just describe what you're looking for and I'll try to help!`
          }])
        }
      } else {
        setMessages(m => [...m, {
          role: 'assistant',
          text: 'I\'m here to help you check product availability! 😊 Try asking:\n\n• "Is [product name] available?"\n• "Do you have [product name]?"\n• Just type the product name\n• "Show all products" - to see everything we have in stock'
        }])
      }
    } catch (err) {
      console.error('Chatbot error:', err)
      setMessages(m => [...m, {
        role: 'assistant',
        text: 'Oops! I encountered an error. 😅 Please try again or rephrase your question. I\'m here to help!'
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function clearChat() {
    setMessages([
      { role: 'assistant', text: isGeminiAvailable() 
        ? isAdmin
          ? 'Hey there! 👋 I\'m here to help you check product availability and answer stock-level questions. Ask me about any product by name, or say "Show all products" to see everything we have in stock.'
          : 'Hey there! 👋 I\'m here to help you check product availability. Ask me about any product by name, or say "Show all products" to see everything we have in stock.'
        : 'Hi! Ask me about any product by name, or say "Show all products" to see everything.' }
    ])
  }

  return (
    <div className="fixed right-4 bottom-4 z-50">
      {open && (
        <div className="w-96 h-[500px] bg-white border border-gray-200 rounded-xl shadow-xl p-4 flex flex-col mb-3 animate-slide-up">
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
            <div>
              <h3 className="font-semibold text-gray-900">AI Assistant</h3>
              {isGeminiAvailable() && (
                <p className="text-xs text-gray-500 mt-0.5">Powered by Gemini AI</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="text-gray-400 hover:text-gray-600 transition p-1"
                title="Clear chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto mb-3 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-lg text-sm ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                      : 'bg-gray-100 text-gray-800 border border-gray-200'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg border border-gray-200">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Send
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center hover:scale-110"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>
    </div>
  )
}

