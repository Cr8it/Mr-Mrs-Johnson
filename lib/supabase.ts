import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
)

export const getPublicUrl = (path: string) => {
  try {
    const { data } = supabase.storage.from('gallery').getPublicUrl(path)
    if (!data?.publicUrl) {
      throw new Error('Failed to get public URL')
    }
    return data.publicUrl
  } catch (error) {
    console.error('Error getting public URL:', error)
    throw error
  }
} 