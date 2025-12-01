import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function useInventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchItems() {
    setLoading(true)
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .order('updated_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchItems()
    const channel = supabase.channel('inventory-ch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, payload => {
        // for simplicity, refetch on any change
        fetchItems()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return { items, loading, refresh: fetchItems }
}
