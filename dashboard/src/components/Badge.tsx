import type { Lang } from "../types";
import { t } from "../i18n";

/** Marks a number that depends on assumptions (project rule: label as estimate). */
export function EstimateBadge({ lang }: { lang: Lang }) {
  return (
    <span className="badge" title={t(lang, "estimateHint")}>
      {t(lang, "estimate")}
    </span>
  );
}
