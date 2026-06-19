import { getSupabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request, ctx: RouteContext<'/api/certificates/[id]/close'>) {
  try {
    const { id } = await ctx.params
    const supabase = getSupabaseAdmin()

    // Get all submissions for this certificate
    const { data: submissions, error: subError } = await supabase
      .from('submissions')
      .select('*')
      .eq('certificate_id', id)
      .order('created_at', { ascending: true })

    if (subError) throw subError

    // Get certificate details to know form fields
    const { data: cert, error: certError } = await supabase
      .from('certificates')
      .select('form_fields, title')
      .eq('id', id)
      .single()

    if (certError) throw certError

    // Build CSV
    let csvContent = ''
    const fields = cert.form_fields as Array<{ label: string; variable: string }>

    if (submissions && submissions.length > 0) {
      // Header row
      const headers = ['رقم التقديم', 'تاريخ التقديم', ...fields.map((f) => f.label)]
      csvContent = headers.join(',') + '\n'

      // Data rows
      submissions.forEach((sub, idx) => {
        const row = [
          idx + 1,
          new Date(sub.created_at).toLocaleDateString('ar-SA'),
          ...fields.map((f) => {
            const val = sub.data?.[f.variable] || ''
            // Escape commas and quotes
            return `"${String(val).replace(/"/g, '""')}"`
          }),
        ]
        csvContent += row.join(',') + '\n'
      })
    } else {
      csvContent = 'لا توجد تقديمات'
    }

    // Close the certificate and save CSV
    const { error: updateError } = await supabase
      .from('certificates')
      .update({
        is_open: false,
        csv_data: csvContent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      csv: csvContent,
      count: submissions?.length || 0,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'فشل إغلاق التقديم' }, { status: 500 })
  }
}
