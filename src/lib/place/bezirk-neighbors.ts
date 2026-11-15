/**
 * Nachbarbezirke aus den Kiez-Nachbarschaften: Zwei Bezirke grenzen aneinander, wenn einer
 * ihrer Kieze an einen Kiez des anderen grenzt. Nutzt den vorhandenen Kiez-Nachbar-Index,
 * keine zweite Geometrie-Rechnung.
 */
export function neighborBezirke(
	ownKiezSlugs: readonly string[],
	ownBezirkName: string,
	neighborsOf: (kiezSlug: string) => readonly { readonly bezirkName: string }[]
): string[] {
	const names = new Set<string>();
	for (const slug of ownKiezSlugs) {
		for (const n of neighborsOf(slug)) {
			if (n.bezirkName && n.bezirkName !== ownBezirkName) names.add(n.bezirkName);
		}
	}
	return [...names].sort((a, b) => a.localeCompare(b, 'de'));
}
