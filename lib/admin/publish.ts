import { revalidatePath } from "next/cache";
import { clearContentCache } from "../content";

/** After any change, rebuild every cached page (home, article, rating, sitemap…) on the next visit. */
export function refreshSite() {
  clearContentCache();
  revalidatePath("/", "layout");
}
