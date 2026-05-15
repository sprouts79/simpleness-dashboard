"use server";

import { revalidatePath } from "next/cache";
import { setDropStatus } from "@/lib/db-newsjacking";

export async function voteDrop(
  dropId: string,
  kundeSlug: string,
  vote: "opp" | "ned",
) {
  await setDropStatus(dropId, vote === "opp" ? "godkjent" : "avvist");
  revalidatePath(`/kunde/${kundeSlug}/newsjacking`);
}
