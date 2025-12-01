import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navigation from './components/Navigation'
import ChatbotWidget from './components/ChatbotWidget'
import PrivateRoute from './components/PrivateRoute'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Products from './pages/Products'
import ProductDetails from './pages/ProductDetails'
import AdminDashboard from './pages/AdminDashboard'
import AdminOrders from './pages/AdminOrders'
import Checkout from './pages/Checkout'
import PurchaseHistory from './pages/PurchaseHistory'
import Profile from './pages/Profile'

function RoleRoute({ role, children }) {
  const { profile, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!profile) return <Navigate to="/login" replace />
  if (role && profile.role !== role) {
    // If admin tries to access customer routes, redirect to admin
    if (profile.role === 'admin' && role === 'customer') {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/" replace />
  }
  return children
}

function AppContent() {
  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        
        {/* Protected Routes */}
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <RoleRoute role="admin">
                <AdminDashboard />
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <PrivateRoute>
              <RoleRoute role="admin">
                <AdminOrders />
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <PrivateRoute>
              <Checkout />
            </PrivateRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <PrivateRoute>
              <RoleRoute role="customer">
                <PurchaseHistory />
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        
        {/* Redirect old dashboard route to profile for customers */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Navigate to="/profile" replace />
            </PrivateRoute>
          }
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ChatbotWidget />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
