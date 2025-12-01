import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'

export default function Navigation() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-3d-lg cube-3d group-hover:shadow-3d-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight">Inventory</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {user && (
              <>
                <Link 
                  to="/products" 
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive('/products') 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Products
                </Link>
                {profile?.role === 'admin' ? (
                  <>
                    <Link 
                      to="/admin" 
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isActive('/admin') 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Admin
                    </Link>
                    <Link 
                      to="/admin/orders" 
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isActive('/admin/orders') 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      All Orders
                    </Link>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/profile" 
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isActive('/profile') 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Profile
                    </Link>
                    <Link 
                      to="/orders" 
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isActive('/orders') 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Orders
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="hidden md:flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{profile?.full_name || 'User'}</p>
                    <p className="text-xs text-gray-500 font-medium">{profile?.role === 'admin' ? 'Admin' : 'Customer'}</p>
                  </div>
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-3d cube-3d">
                    {(profile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                >
                  Sign Up
                </Link>
              </>
            )}
            
            {/* Mobile Menu Button */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && user && (
          <div className="md:hidden py-4 border-t border-gray-200 animate-slide-up">
            <div className="flex flex-col space-y-2">
              <Link 
                to="/products" 
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/products') ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Products
              </Link>
              {profile?.role === 'admin' ? (
                <>
                  <Link 
                    to="/admin" 
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive('/admin') ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Admin Dashboard
                  </Link>
                  <Link 
                    to="/admin/orders" 
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive('/admin/orders') ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    All Orders
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/profile" 
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive('/profile') ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Profile
                  </Link>
                  <Link 
                    to="/orders" 
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive('/orders') ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Orders
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
