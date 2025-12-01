import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'

export default function AdminOrders() {
  const { profile } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchAllOrders()
    }
  }, [profile])

  async function fetchAllOrders() {
    setLoading(true)
    try {
      // Fetch all sales with sale items
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*, sale_items(*, inventory(*))')
        .order('created_at', { ascending: false })

      if (salesError) {
        console.error('Error fetching sales:', salesError)
        throw salesError
      }

      // Fetch profiles for all unique user IDs
      const userIds = [...new Set((salesData || []).map(sale => sale.user_id).filter(Boolean))]
      
      let profilesMap = new Map()
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds)

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError)
        } else {
          console.log('Fetched profiles:', profilesData)
          profilesMap = new Map((profilesData || []).map(p => [p.id, p]))
        }
      }

      // For users without profiles, try to get email from auth.users
      // and create a temporary profile object
      const missingUserIds = userIds.filter(id => !profilesMap.has(id))
      console.log('Missing profiles for user IDs:', missingUserIds)

      // Map profiles to sales, creating fallback profiles for missing ones
      const ordersWithProfiles = (salesData || []).map(sale => {
        let profile = profilesMap.get(sale.user_id)
        
        // If no profile found, create a fallback
        if (!profile && sale.user_id) {
          profile = {
            id: sale.user_id,
            full_name: null,
            email: null
          }
        }
        
        return {
          ...sale,
          profiles: profile || null
        }
      })

      setOrders(ordersWithProfiles)
      
      // Calculate totals
      const revenue = ordersWithProfiles.reduce((sum, order) => sum + (order.total || 0), 0)
      setTotalRevenue(revenue)
      setTotalOrders(ordersWithProfiles.length)
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const customerName = order.profiles?.full_name || order.profiles?.email || ''
    const orderId = order.id.toLowerCase()
    return customerName.toLowerCase().includes(query) || orderId.includes(query)
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Orders</h1>
          <p className="text-gray-600">View all customer orders and transactions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₱{totalRevenue.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name or order ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading orders...</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">No orders match your search criteria.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash/Change</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">#{order.id.slice(0, 8)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.profiles ? (
                          <>
                            <div className="text-sm font-medium text-gray-900">
                              {order.profiles.full_name || order.profiles.email || 'Customer'}
                            </div>
                            {order.profiles.full_name && order.profiles.email && order.profiles.full_name !== order.profiles.email && (
                              <div className="text-xs text-gray-500">{order.profiles.email}</div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-gray-500">
                            <span className="italic">Customer</span>
                            <span className="text-xs text-gray-400 ml-2">(Profile missing - run SQL fix)</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-gray-500">{new Date(order.created_at).toLocaleTimeString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.sale_items?.length || 0} item(s)
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {order.sale_items?.slice(0, 2).map((item, idx) => (
                            <span key={idx}>
                              {item.inventory?.name || 'Unknown'} × {item.quantity}
                              {idx < Math.min(order.sale_items.length - 1, 1) && ', '}
                            </span>
                          ))}
                          {order.sale_items?.length > 2 && '...'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">₱{order.total?.toFixed(2) || '0.00'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div>Cash: ₱{order.cash?.toFixed(2) || '0.00'}</div>
                        <div className="text-xs">Change: ₱{order.change?.toFixed(2) || '0.00'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

