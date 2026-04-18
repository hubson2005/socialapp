import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gxguirtpunmiiuxpxlap.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4Z3VpcnRwdW5taWl1eHB4bGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDc1MDUsImV4cCI6MjA5MjAyMzUwNX0.PTMByHRhVtESEl2DdLgrDaBYb7HJjJ7GldolEIx4gLE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)