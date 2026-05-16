/**
 * Story 2.2 T2.1: XSS-sicheres JSON-LD-Serialize fuer inline `<script>`-Blocks.
 *
 * Hintergrund: JSON-LD wird per `<script type="application/ld+json">{data}</script>`
 * inline ins HTML eingebaut. Wenn ein dynamischer Wert die Sequenz `</script>` enthaelt,
 * bricht der Parser den Script-Block frueh ab und der Rest wird als HTML interpretiert
 * (Inline-`<script>`-Injection). Standard-Fix: alle `</` durch `<\/` ersetzen,
 * der JSON-Parser akzeptiert beides (`\/` ist nach RFC 8259 ein zulaessiger Escape).
 */
export function serializeJsonLd<T>(data: T): string {
	return JSON.stringify(data).replace(/<\//g, '<\\/');
}
