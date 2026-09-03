import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "mbg-photos";

let cachedClient: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi di .env -- lihat README bagian Storage."
    );
  }
  if (!cachedClient) {
    cachedClient = createClient(url, serviceRoleKey);
  }
  return cachedClient;
}

/**
 * Upload satu foto ke Supabase Storage (bucket public) dan balikin public URL-nya.
 * pathPrefix contoh: "menu-harian", "distribusi", "konfirmasi-orangtua".
 */
export async function uploadPhoto(file: File, pathPrefix: string): Promise<string> {
  const supabase = getClient();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });

  if (error) {
    throw new Error(`Upload foto gagal: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
