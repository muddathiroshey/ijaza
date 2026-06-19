import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { password } = await request.json()

  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

  if (password === adminPassword) {
    const response = NextResponse.json({ success: true })
    response.cookies.set('admin_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    return response
  }

  return NextResponse.json({ success: false, error: 'كلمة المرور غير صحيحة' }, { status: 401 })
}
