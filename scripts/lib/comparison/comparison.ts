/**
 * scripts/lib/comparison/comparison.ts (Story 11.4).
 *
 * Reine Statistik-Helfer für den Kiez↔Bezirk↔Berlin-Vergleich. `null`-Werte
 * werden ignoriert (fehlende Dimensionen kippen den Schnitt nicht). Rückgabe
 * `null`, wenn keine Werte übrig bleiben. Es wird bewusst NICHT gerundet; das
 * Render entscheidet über Nachkommastellen.
 */

function nonNull(values: ReadonlyArray<number | null>): number[] {
	return values.filter((v): v is number => v !== null && Number.isFinite(v));
}

/** Arithmetisches Mittel der nicht-null Werte; `null` wenn keine übrig. */
export function mean(values: ReadonlyArray<number | null>): number | null {
	const xs = nonNull(values);
	if (xs.length === 0) return null;
	return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Median der nicht-null Werte; `null` wenn keine übrig. */
export function median(values: ReadonlyArray<number | null>): number | null {
	const xs = nonNull(values).sort((a, b) => a - b);
	if (xs.length === 0) return null;
	const mid = Math.floor(xs.length / 2);
	return xs.length % 2 === 0 ? (xs[mid - 1] + xs[mid]) / 2 : xs[mid];
}
