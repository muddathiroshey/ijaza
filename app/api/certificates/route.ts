import { getSupabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('certificates')
      .select('*, submissions:submissions(count)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'فشل تحميل الإجازات' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = getSupabaseAdmin()

    // 1. Fetch master template if one exists
    let template_html = body.template_html || ''
    let form_fields = body.form_fields || []

    const { data: masterCert } = await supabase
      .from('certificates')
      .select('template_html, form_fields')
      .eq('is_master', true)
      .maybeSingle()

    if (masterCert) {
      template_html = masterCert.template_html || ''
      form_fields = masterCert.form_fields || []
    }

    // 2. Calculate auto_close_at based on duration hours/minutes
    let auto_close_at: string | null = null
    if (body.durationHours || body.durationMinutes) {
      const hours = Number(body.durationHours || 0)
      const minutes = Number(body.durationMinutes || 0)
      const totalMinutes = (hours * 60) + minutes
      if (totalMinutes > 0) {
        auto_close_at = new Date(Date.now() + totalMinutes * 60 * 1000).toISOString()
      }
    }

    const { data, error } = await supabase
      .from('certificates')
      .insert({
        title: body.title,
        description: body.description || '',
        template_html,
        form_fields,
        is_open: true,
        auto_close_at,
        is_master: false, // new certificates are not master templates by default
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'فشل إنشاء الإجازة' }, { status: 500 })
  }
}
