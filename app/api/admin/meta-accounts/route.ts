/**
 * GET /api/admin/meta-accounts
 *
 * Returns all ad accounts accessible to the Meta System User Token,
 * filtered to exclude accounts already in the database.
 */

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const BASE = "https://graph.facebook.com/v21.0";

export async function GET() {
  const token = process.env.META_SYSTEM_USER_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "META_SYSTEM_USER_TOKEN ikke satt" }, { status: 500 });
  }

  // Fetch all ad accounts the system user has access to
  const url = `${BASE}/me/adaccounts?fields=name,account_id,account_status&limit=200&access_token=${token}`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();

  if (json.error) {
    return NextResponse.json({ error: json.error.message }, { status: 500 });
  }

  // Get existing client account IDs so we can mark them
  const { data: existingClients } = await supabase
    .from("clients")
    .select("meta_account_id, name");

  const existingAccountIds = new Set(
    (existingClients ?? []).map((c) => c.meta_account_id).filter(Boolean)
  );

  const accounts = (json.data ?? []).map((a: any) => ({
    accountId: `act_${a.account_id}`,
    name: a.name,
    status: a.account_status, // 1 = ACTIVE, 2 = DISABLED, etc.
    alreadyAdded: existingAccountIds.has(`act_${a.account_id}`),
  }));

  // Sort: active first, then alphabetically
  accounts.sort((a: any, b: any) => {
    if (a.alreadyAdded !== b.alreadyAdded) return a.alreadyAdded ? 1 : -1;
    if (a.status !== b.status) return a.status === 1 ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json({ accounts });
}
