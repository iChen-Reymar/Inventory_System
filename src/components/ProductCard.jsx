import React from 'react'
import { Link } from 'react-router-dom'
import { getProductImageUrl, handleImageError } from '../utils/imageUtils'

export default function ProductCard({ item }) {
  const isInStock = item.quantity > 0

  return (
    <Link to={`/product/${item.id}`} className="block group">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1">
        <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          <img
            src={getProductImageUrl(item.image_path)}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={handleImageError}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          {!isInStock && (
            <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
              Out of Stock
            </div>
          )}
          {isInStock && item.quantity <= (item.min_quantity || 0) && (
            <div className="absolute top-3 right-3 bg-yellow-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
              Low Stock
            </div>
          )}
          {isInStock && item.quantity > (item.min_quantity || 0) && (
            <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              In Stock
            </div>
          )}
        </div>
        <div className="p-5">
          <h3 className="font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-blue-600 transition-colors">{item.name}</h3>
          {item.brand && (
            <p className="text-sm text-gray-500 mb-2 font-medium">{item.brand}</p>
          )}
          {item.category && (
            <span className="inline-block px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 text-xs font-semibold rounded-full mb-3 border border-blue-100">
              {item.category}
            </span>
          )}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-2xl font-bold text-gray-900">₱{item.price}</p>
              <p className={`text-xs font-medium mt-1 ${isInStock ? 'text-green-600' : 'text-red-600'}`}>
                {isInStock ? `${item.quantity} available` : 'Out of stock'}
              </p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
