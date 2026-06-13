/**
 * Output validation — parse and bound whatever the model returned, against the
 * requested AI slots.
 *
 * A failure here counts as a failed generation attempt (the service retries,
 * then falls back). Rules:
 *  - tolerate ```json fences and surrounding prose by extracting the JSON object
 *  - accept either the modular shape { subject, sections: { <id>: string } } or
 *    the legacy flat { subject, body } (mapped to the first requested slot)
 *  - subject 3–80 chars (trimmed)
 *  - every requested slot present and non-empty
 *  - COMBINED body 1–200 words across all slots
 *  - no slot may contain code fences, HTML tags, or JSON braces
 *    (blank-line paragraph breaks are fine — newlines are not restricted)
 */

export type ValidateOutputResult =
  | { ok: true; subject: string; sections: Record<string, string> }
  | { ok: false; reason: string };

const CODE_FENCE_RE = /```/;
const HTML_TAG_RE = /<[^>]+>/;
const JSON_BRACE_RE = /[{}]/;

export function validateOutput(raw: string, slots: string[]): ValidateOutputResult {
  const parsed = safeParseJson(raw);
  if (!parsed.ok) return { ok: false, reason: parsed.reason };

  const obj = parsed.value;
  if (typeof obj !== "object" || obj === null) {
    return { ok: false, reason: "json is not an object" };
  }
  const record = obj as Record<string, unknown>;

  if (typeof record.subject !== "string") {
    return { ok: false, reason: "json missing string subject" };
  }
  const subject = record.subject.trim();
  if (subject.length < 3 || subject.length > 80) {
    return { ok: false, reason: `subject length ${subject.length} out of 3–80` };
  }

  // Gather the raw section texts: modular `sections` if present, else legacy
  // `body` mapped onto the first requested slot.
  const rawSections = extractSections(record, slots);
  if (!rawSections.ok) return { ok: false, reason: rawSections.reason };

  const sections: Record<string, string> = {};
  let totalWords = 0;
  for (const slot of slots) {
    const text = rawSections.value[slot]?.trim() ?? "";
    if (text.length === 0) {
      return { ok: false, reason: `slot "${slot}" missing or empty` };
    }
    if (CODE_FENCE_RE.test(text)) return { ok: false, reason: `slot "${slot}" has code fence` };
    if (HTML_TAG_RE.test(text)) return { ok: false, reason: `slot "${slot}" has HTML tag` };
    if (JSON_BRACE_RE.test(text)) return { ok: false, reason: `slot "${slot}" has JSON braces` };
    totalWords += text.split(/\s+/).filter(Boolean).length;
    sections[slot] = text;
  }

  if (totalWords < 1 || totalWords > 200) {
    return { ok: false, reason: `combined word count ${totalWords} out of 1–200` };
  }

  return { ok: true, subject, sections };
}

type SectionsResult =
  | { ok: true; value: Record<string, string> }
  | { ok: false; reason: string };

/** Normalize the model's body to a slot→string map, accepting both shapes. */
function extractSections(
  record: Record<string, unknown>,
  slots: string[],
): SectionsResult {
  const { sections } = record;
  if (sections && typeof sections === "object") {
    const value: Record<string, string> = {};
    for (const [key, v] of Object.entries(sections as Record<string, unknown>)) {
      if (typeof v === "string") value[key] = v;
    }
    return { ok: true, value };
  }
  // Legacy flat body → first requested slot.
  if (typeof record.body === "string") {
    return { ok: true, value: { [slots[0]]: record.body } };
  }
  return { ok: false, reason: "json missing sections object or body string" };
}

type ParseResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: string };

/** Strip ```json fences, then parse — falling back to the outermost {...} slice. */
function safeParseJson(raw: string): ParseResult {
  let text = raw.trim();

  // Remove a leading ```json / ``` fence and its trailing ``` if present.
  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) text = fenced[1].trim();

  const attempt = (candidate: string): ParseResult => {
    try {
      return { ok: true, value: JSON.parse(candidate) };
    } catch {
      return { ok: false, reason: "invalid JSON" };
    }
  };

  const direct = attempt(text);
  if (direct.ok) return direct;

  // Last resort: grab the outermost object and try that.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return attempt(text.slice(start, end + 1));
  }

  return { ok: false, reason: "no JSON object found" };
}
