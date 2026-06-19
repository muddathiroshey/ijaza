export interface FormField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'date' | 'select'
  placeholder?: string
  options?: string[]
  required: boolean
  variable: string // the placeholder in template e.g. {{اسم_الطالب}}
}

export interface Certificate {
  id: string
  title: string
  description: string
  template_html: string
  form_fields: FormField[]
  is_open: boolean
  created_at: string
  updated_at: string
  csv_data?: string
  auto_close_at?: string | null
  is_master?: boolean
}

export interface Asset {
  id: string
  name: string
  type: 'signature' | 'stamp'
  storage_path: string
  public_url: string
  created_at: string
}

export interface Submission {
  id: string
  certificate_id: string
  data: Record<string, string>
  created_at: string
}
