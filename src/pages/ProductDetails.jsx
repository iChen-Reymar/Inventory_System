import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { getProductImageUrl, handleImageError } from '../utils/imageUtils'

export default function ProductDetails() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true)
      const { data } = await supabase.from('inventory').select('*').eq('id', id).single()
      setItem(data)
      setLoading(false)
    }
    fetchProduct()
  }, [id])

  function addToCart() {
    if (!user) {
      nav('/login')
      return
    }
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existing = cart.find(c => c.id === item.id)
    if (existing) {
      existing.qty = (existing.qty || 1) + qty
    } else {
      cart.push({ id: item.id, name: item.name, price: Number(item.price), qty })
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    nav('/checkout')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
          <Link to="/products" className="text-blue-600 hover:text-blue-700 font-medium">
            Back to Products
          </Link>
        </div>
      </div>
    )
  }

  const isInStock = item.quantity > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/products" className="text-blue-600 hover:text-blue-700 mb-6 inline-flex items-center text-sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Products
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            <div>
              <img
                src={getProductImageUrl(item.image_path)}
                alt={item.name}
                className="w-full h-96 object-cover rounded-lg"
                onError={handleImageError}
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.name}</h1>
              {item.brand && (
                <p className="text-lg text-gray-600 mb-4">{item.brand}</p>
              )}
              
              {item.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700">{item.description}</p>
                </div>
              )}

              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Price</span>
                  <span className="text-2xl font-bold text-gray-900">₱{item.price}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Stock</span>
                  <span className={`text-lg font-semibold ${isInStock ? 'text-green-600' : 'text-red-600'}`}>
                    {isInStock ? `${item.quantity} available` : 'Out of Stock'}
                  </span>
                </div>
              </div>

              {isInStock ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="text-gray-700 font-medium">Quantity:</label>
                    <input
                      type="number"
                      min="1"
                      max={item.quantity}
                      value={qty}
                      onChange={(e) => setQty(Math.max(1, Math.min(item.quantity, Number(e.target.value))))}
                      className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={addToCart}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-300 text-gray-500 py-3 rounded-lg font-semibold cursor-not-allowed"
                >
                  Out of Stock
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
