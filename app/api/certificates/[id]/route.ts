import { getSupabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, ctx: RouteContext<'/api/certificates/[id]'>) {
  try {
    const { id } = await ctx.params
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'الإجازة غير موجودة' }, { status: 404 })
  }
}

export async function PATCH(_req: Request, ctx: RouteContext<'/api/certificates/[id]'>) {
  try {
    const { id } = await ctx.params
    const body = await _req.json()
    const supabase = getSupabaseAdmin()

    // If setting this certificate as master, reset all others first
    if (body.is_master === true) {
      const { error: resetError } = await supabase
        .from('certificates')
        .update({ is_master: false })
        .neq('id', id)
      if (resetError) throw resetError
    }

    const { data, error } = await supabase
      .from('certificates')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'فشل تحديث الإجازة' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/certificates/[id]'>) {
  try {
    const { id } = await ctx.params
    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('certificates')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'فشل حذف الإجازة' }, { status: 500 })
  }
}
