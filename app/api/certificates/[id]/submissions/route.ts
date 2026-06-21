import { getSupabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, ctx: RouteContext<'/api/certificates/[id]/submissions'>) {
  try {
    const { id } = await ctx.params
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('certificate_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'فشل تحميل التقديمات' }, { status: 500 })
  }
}

export async function POST(request: Request, ctx: RouteContext<'/api/certificates/[id]/submissions'>) {
  try {
    const { id } = await ctx.params
    const body = await request.json()
    const supabase = getSupabaseAdmin()

    // Check if certificate is still open
    const { data: cert, error: certError } = await supabase
      .from('certificates')
      .select('is_open, auto_close_at')
      .eq('id', id)
      .single()

    if (certError || !cert) {
      return NextResponse.json({ error: 'الإجازة غير موجودة' }, { status: 404 })
    }

    const isClosed = !cert.is_open || (cert.auto_close_at && new Date() > new Date(cert.auto_close_at))
    if (isClosed) {
      return NextResponse.json({ error: 'التقديم على هذه الإجازة مغلق' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('submissions')
      .insert({
        certificate_id: id,
        data: body.data,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'فشل إرسال التقديم' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { ids } = body
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'معرفات غير صالحة' }, { status: 400 })
    }
    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('submissions')
      .delete()
      .in('id', ids)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'فشل حذف التقديمات' }, { status: 500 })
  }
}
