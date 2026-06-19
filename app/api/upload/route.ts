import { getSupabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'assets'

    if (!file) {
      return NextResponse.json({ error: 'لم يتم إرسال ملف' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const ext = file.name.split('.').pop()
    const fileName = `${folder}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('assets').getPublicUrl(fileName)

    return NextResponse.json({
      storage_path: fileName,
      public_url: urlData.publicUrl,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'فشل رفع الملف' }, { status: 500 })
  }
}
