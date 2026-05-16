import { marked } from 'marked';
import { sanitizeHtml } from '$lib/seo/markdown-sanitizer.js';

/**
 * Story 2.13 T3 + AC-3: Markdown-zu-HTML-Render-Helper mit Sanitizer-Integration.
 *
 * Pipeline:
 *   1. `marked` (GFM-Default, headerIds aktiv, async=false → sync-Render)
 *   2. Custom-Regex-Sanitizer (Option A, siehe `$lib/seo/markdown-sanitizer.ts`)
 *
 * Verwendung in Detail-Page `+page.svelte`:
 * ```ts
 * const html = renderMarkdownBody(entry.body);
 * ```
 * dann `{@html html}` (Sanitizer hat XSS-Vectors gestrippt).
 */
export function renderMarkdownBody(markdown: string): string {
	const html = marked.parse(markdown, { async: false, gfm: true });
	return sanitizeHtml(html);
}
