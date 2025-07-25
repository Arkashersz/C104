import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useGroups() {
  const supabase = createClient()

  const fetchGroups = useCallback(async () => {
    const { data, error } = await supabase.from('groups').select('*').order('name', { ascending: true })
    if (error) throw error
    return data || []
  }, [supabase])

  return { fetchGroups }
} 