import { supabase } from "@/lib/supabase";

export async function listQuotes() {
  const { data, error } = await supabase
    .from("quotes")
    .select("id, status, notes, created_at, total_ttc_cents, clients(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export type QuoteListItem = Awaited<ReturnType<typeof listQuotes>>[number];