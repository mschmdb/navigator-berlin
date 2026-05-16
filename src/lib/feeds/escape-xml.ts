/**
 * Story 2.13 AC-5 + AC-6: XML-Entity-Escape für RSS/Atom-Text-Felder.
 * Reihenfolge wichtig: `&` ZUERST, sonst Doppel-Escape von späteren `&lt;`-Entitäten.
 */
export function escapeXml(input: string): string {
	return input
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}
