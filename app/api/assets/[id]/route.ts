import { getSupabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function DELETE(_req: Request, ctx: RouteContext<'/api/assets/[id]'>) {
  try {
    const { id } = await ctx.params
    const supabase = getSupabaseAdmin()

    // Get asset first to delete from storage
    const { data: asset, error: fetchError } = await supabase
      .from('assets')
      .select('storage_path')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // Delete from storage
    if (asset?.storage_path) {
      await supabase.storage.from('assets').remove([asset.storage_path])
    }

    // Delete from DB
    const { error } = await supabase.from('assets').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'فشل حذف الأصل' }, { status: 500 })
  }
}
