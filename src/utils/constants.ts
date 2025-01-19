import "dotenv/config";

export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "";
export const DATABASE_DIRECT_URL = process.env.DATABASE_DIRECT_URL || "";
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
