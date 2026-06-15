/**
 * Story 2.13 T3 + AC-3: Custom Regex-Whitelist-Sanitizer für Markdown-zu-HTML-Output.
 *
 * Strategie: **Option A** aus Story-Dev-Notes (User-Lock 2026-05-16): Custom-Regex-Block-Liste
 * statt DOMPurify-Bundle. Begründung Phase 1:
 *
 * - Content-Quelle = Trusted-Source (Owner-Commit, Git-Review = Sanity-Barriere).
 * - Kein Multi-Author-Flow in Phase 1.
 * - DOMPurify-Bundle (30 KB gzipped + JSDOM-Server-Polyfill) ist Overkill für 1 Defense-in-Depth-Layer.
 *
 * Block-Liste (Hard-Fail):
 *   - `<script>` / `<iframe>` / `<object>` / `<embed>` / `<style>` / `<link>` / `<meta>` Tags.
 *   - Alle `on*=`-Attribute (onclick, onerror, onload, …) case-insensitive.
 *   - `javascript:` und `data:`-URLs in `href`/`src`.
 *
 * Erlaubt: regulärer Markdown-Output (p, h1-h6, a, code, pre, ul, ol, li, em, strong, table, …).
 *
 * **Tests:** alle XSS-Try-Vectors aus Open-Question 1 in `markdown-sanitizer.test.ts` (Script-Tag,
 * `<img onerror>`, `javascript:`-URL, `data:`-URL, iframe).
 *
 * Wenn Multi-Author kommt → Migrate auf `isomorphic-dompurify` (DOMPurify-Author = Cure53 EU-Berlin,
 * keine US-Drittanbieter-Verletzung MUST-Rule #11).
 */

const FORBIDDEN_TAGS = ['script', 'iframe', 'object', 'embed', 'style', 'link', 'meta'];

const FORBIDDEN_URL_SCHEMES = /^(?:javascript|data|vbscript|file):/i;

/**
 * Block-Liste-basierter HTML-Sanitizer. Pure-Function, side-effect-frei.
 */
export function sanitizeHtml(html: string): string {
	let out = html;

	// 1. Strippe verbotene Tags inkl. Inhalt (greedy regex with [\s\S] für Multi-Line).
	for (const tag of FORBIDDEN_TAGS) {
		const blockPattern = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
		out = out.replace(blockPattern, '');
		// Selbst-schließende oder unvollständige Variante
		const voidPattern = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
		out = out.replace(voidPattern, '');
	}

	// 2. Strippe on*=-Attribute (Event-Handler).
	// Match: optionales Whitespace + on[a-z]+ + = + ("..." | '...' | unquoted)
	out = out.replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, '');
	out = out.replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, '');
	out = out.replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, '');

	// 3. Strippe href/src mit gefährlichen Schemes. Komplette Attribut-Wegnahme statt nur Scheme,
	//    weil Browser-Parser ambiguous gegenüber `java\nscript:`.
	out = out.replace(/\s+(href|src)\s*=\s*"([^"]*)"/gi, (match, attr: string, value: string) => {
		if (FORBIDDEN_URL_SCHEMES.test(value.trim())) return '';
		return ` ${attr}="${value}"`;
	});
	out = out.replace(/\s+(href|src)\s*=\s*'([^']*)'/gi, (match, attr: string, value: string) => {
		if (FORBIDDEN_URL_SCHEMES.test(value.trim())) return '';
		return ` ${attr}="${value}"`;
	});
	out = out.replace(/\s+(href|src)\s*=\s*([^\s>]+)/gi, (match, attr: string, value: string) => {
		if (FORBIDDEN_URL_SCHEMES.test(value.trim())) return '';
		return ` ${attr}=${value}`;
	});

	return out;
}
