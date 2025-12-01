import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Checkout() {
  const { user, profile } = useAuth()
  const [cart, setCart] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  useEffect(() => {
    if (!user) {
      nav('/login')
      return
    }
    setCart(JSON.parse(localStorage.getItem('cart') || '[]'))
  }, [user, nav])

  const total = cart.reduce((s, c) => s + (c.price * (c.qty || 1)), 0)
  const walletBalance = profile?.wallet_balance || 0

  async function handlePay() {
    if (cart.length === 0) {
      setMessage('Your cart is empty')
      return
    }

    if (walletBalance < total) {
      setMessage(`Insufficient wallet balance. You have ₱${walletBalance.toFixed(2)}, but need ₱${total.toFixed(2)}. Please cash-in first.`)
      return
    }

    setLoading(true)
    setMessage('Processing payment...')

    try {
      const itemsJson = cart.map(c => ({ inventory_id: c.id, qty: c.qty, unit_price: c.price }))
      
      let rpcSuccess = false
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('create_sale', {
          p_user_id: user.id,
          p_cash: total, // Total amount to deduct from wallet
          p_items: itemsJson
        })

        if (!rpcError && rpcData) {
          rpcSuccess = true
        } else if (rpcError) {
          throw rpcError
        }
      } catch (rpcErr) {
        console.error('RPC error:', rpcErr)
        throw rpcErr
      }

      if (!rpcSuccess) {
        const { data: saleData, error: saleError } = await supabase
          .from('sales')
          .insert([{
            user_id: user.id,
            total: total,
            cash: cashNum,
            change: cashNum - total
          }])
          .select()
          .single()

        if (saleError) throw saleError

        for (const item of itemsJson) {
          const { error: itemError } = await supabase.from('sale_items').insert([{
            sale_id: saleData.id,
            inventory_id: item.inventory_id,
            quantity: item.qty,
            unit_price: item.unit_price
          }])

          if (itemError) throw itemError

          try {
            const { error: invError } = await supabase.rpc('decrement_inventory', {
              p_id: item.inventory_id,
              p_qty: item.qty
            })
            if (invError) throw invError
          } catch (invErr) {
            const { data: inv, error: invFetchError } = await supabase
              .from('inventory')
              .select('quantity')
              .eq('id', item.inventory_id)
              .single()
            
            if (invFetchError) throw invFetchError

            if (inv) {
              const newQuantity = Math.max(0, inv.quantity - item.qty)
              const { error: updateError } = await supabase
                .from('inventory')
                .update({ quantity: newQuantity })
                .eq('id', item.inventory_id)
              
              if (updateError) throw updateError
            }
          }
        }
      }

      localStorage.removeItem('cart')
      setCart([])
      setMessage(`Payment successful! ₱${total.toFixed(2)} deducted from your wallet.`)
      
      // Refresh profile to update wallet balance
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (updatedProfile) {
        // Update profile in context (if needed, you might need to call fetchProfile)
      }
      
      setTimeout(() => {
        nav('/orders')
      }, 2000)
    } catch (err) {
      setMessage('Error: ' + (err.message || String(err)))
      console.error('Payment error:', err)
    } finally {
      setLoading(false)
    }
  }

  function removeFromCart(id) {
    const newCart = cart.filter(c => c.id !== id)
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
  }

  function updateQuantity(id, newQty) {
    const newCart = cart.map(c => c.id === id ? { ...c, qty: Math.max(1, newQty) } : c)
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-3d-lg cube-3d">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Checkout</h1>
              <p className="text-gray-600 font-medium">Complete your purchase</p>
            </div>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-3d p-12 text-center border border-gray-200 card-3d animate-slide-up">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">Add some products to get started.</p>
            <Link
              to="/products"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-3d border border-gray-200 card-3d animate-slide-up">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Cart Items</h2>
                </div>
                <div className="p-6 space-y-4">
                  {cart.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{c.name}</h3>
                        <p className="text-sm text-gray-500">₱{c.price} each</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(c.id, (c.qty || 1) - 1)}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">{c.qty || 1}</span>
                          <button
                            onClick={() => updateQuantity(c.id, (c.qty || 1) + 1)}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-semibold text-gray-900 w-20 text-right">
                          ₱{((c.price * (c.qty || 1)).toFixed(2))}
                        </span>
                        <button
                          onClick={() => removeFromCart(c.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-3d border border-gray-200 sticky top-8 card-3d animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₱{total.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span>₱{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Wallet Balance</span>
                        <span className="text-lg font-bold text-gray-900">₱{walletBalance.toFixed(2)}</span>
                      </div>
                    </div>

                    {walletBalance < total && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm text-red-700">
                          Insufficient balance. You need ₱{(total - walletBalance).toFixed(2)} more.
                        </p>
                        <Link
                          to="/profile"
                          className="text-sm font-semibold text-red-600 hover:text-red-700 underline mt-1 inline-block"
                        >
                          Cash-in now →
                        </Link>
                      </div>
                    )}

                    {walletBalance >= total && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-gray-700">
                          After payment: <span className="font-semibold text-green-700">₱{(walletBalance - total).toFixed(2)}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handlePay}
                    disabled={loading || walletBalance < total}
                    className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 shadow-3d-lg card-3d disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Complete Payment'}
                  </button>

                  {message && (
                    <div className={`p-3 rounded-lg text-sm ${
                      message.includes('Error') || message.includes('Insufficient')
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      {message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
