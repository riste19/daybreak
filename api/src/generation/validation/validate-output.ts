import { ModelEmailSchema } from "../domain/types";

/**
 * Output validation — parse and bound whatever the model returned.
 *
 * A failure here counts as a failed generation attempt (the service retries,
 * then falls back). Rules:
 *  - tolerate ```json fences and surrounding prose by extracting the JSON object
 *  - subject 3–80 chars (trimmed)
 *  - body 1–200 words
 *  - body must not contain code fences, HTML tags, or JSON braces
 *    (blank-line paragraph breaks are fine — newlines are not restricted)
 */

export type ValidateOutputResult =
  | { ok: true; subject: string; body: string }
  | { ok: false; reason: string };

const CODE_FENCE_RE = /```/;
const HTML_TAG_RE = /<[^>]+>/;
const JSON_BRACE_RE = /[{}]/;

export function validateOutput(raw: string): ValidateOutputResult {
  const parsed = safeParseJson(raw);
  if (!parsed.ok) return { ok: false, reason: parsed.reason };

  const email = ModelEmailSchema.safeParse(parsed.value);
  if (!email.success) {
    return { ok: false, reason: "json missing string subject/body" };
  }

  const subject = email.data.subject.trim();
  const body = email.data.body.trim();

  if (subject.length < 3 || subject.length > 80) {
    return { ok: false, reason: `subject length ${subject.length} out of 3–80` };
  }

  const words = body.split(/\s+/).filter(Boolean).length;
  if (words < 1 || words > 200) {
    return { ok: false, reason: `body word count ${words} out of 1–200` };
  }

  if (CODE_FENCE_RE.test(body)) return { ok: false, reason: "body contains code fence" };
  if (HTML_TAG_RE.test(body)) return { ok: false, reason: "body contains HTML tag" };
  if (JSON_BRACE_RE.test(body)) return { ok: false, reason: "body contains JSON braces" };

  return { ok: true, subject, body };
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
