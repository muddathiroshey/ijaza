import { getSupabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    
    // Fetch the 10 most recent submissions and load the related certificate title
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        id,
        created_at,
        data,
        certificate:certificates (
          title
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json({ error: 'فشل تحميل التقديمات الأخيرة' }, { status: 500 })
  }
}
