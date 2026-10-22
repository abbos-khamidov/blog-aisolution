import { revalidatePath } from "next/cache";

/** After any change, rebuild every cached page (home, article, rating, sitemap…) on the next visit. */
export function refreshSite() {
  revalidatePath("/", "layout");
}
