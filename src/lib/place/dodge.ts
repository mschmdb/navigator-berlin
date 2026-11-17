/**
 * Beeswarm-Ebenen für einen Streifen: Punkte rücken nach oben/unten aus, wenn sie sich
 * waagerecht überlappen. Deterministisch (gleiche Eingabe, gleiches Bild) und mit Deckel:
 * Ein Stapel wächst nie über `maxLevel` hinaus, sonst sprengt etwa Wohnschutz mit 84 Kiezen
 * bei 0 jede Zeilenhöhe. Überzählige Punkte liegen auf der äußersten Ebene übereinander.
 */
export function dodgeLevels(
	xs: readonly (number | null)[],
	r: number,
	maxLevel: number
): (number | null)[] {
	const order = xs
		.map((x, i) => ({ x, i }))
		.filter((p): p is { x: number; i: number } => p.x !== null && Number.isFinite(p.x))
		.sort((a, b) => a.x - b.x || a.i - b.i);
	const fits = (level: number, x: number) =>
		(placed.get(level) ?? []).every((px) => Math.abs(px - x) >= 2 * r);
	const firstFree = (x: number): number | undefined => {
		if (fits(0, x)) return 0;
		for (let l = 1; l <= maxLevel && l <= xs.length; l++) {
			if (fits(l, x)) return l;
			if (fits(-l, x)) return -l;
		}
		return undefined;
	};

	const placed = new Map<number, number[]>();
	const out: (number | null)[] = xs.map(() => null);
	let overflow = 0;
	for (const { x, i } of order) {
		const free = firstFree(x);
		const level = free ?? (overflow++ % 2 === 0 ? maxLevel : -maxLevel);
		placed.set(level, [...(placed.get(level) ?? []), x]);
		out[i] = level;
	}
	return out;
}
