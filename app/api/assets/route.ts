import { getSupabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// List all assets
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'فشل تحميل الأصول' }, { status: 500 })
  }
}

// Create new asset (save metadata after upload)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('assets')
      .insert({
        name: body.name,
        type: body.type,
        storage_path: body.storage_path,
        public_url: body.public_url,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'فشل حفظ الأصل' }, { status: 500 })
  }
}
