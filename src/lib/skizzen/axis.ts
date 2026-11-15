/** Bei lauter ganzen Ticks „14“ statt „14,0“. */
export function trimZeroDecimals(texts: readonly string[], ticks: readonly number[]): string[] {
	if (!ticks.every((t) => Number.isInteger(t))) return [...texts];
	return texts.map((t) => t.replace(/[.,]0+(?=\D*$)/, ''));
}

export interface AxisLabel {
	readonly text: string;
	readonly x: number;
	readonly anchor: 'start' | 'middle' | 'end';
	readonly visible: boolean;
}

/**
 * Achsenbeschriftung ohne Überlappung: Ränder nach innen ausrichten, dann von rechts nach links
 * jede Beschriftung ausblenden, die eine bereits gesetzte berührt. Die letzte (mit Einheit)
 * bleibt immer stehen. Breite geschätzt mit `charWidth` je Zeichen.
 */
export function layoutAxisLabels(
	texts: readonly string[],
	xs: readonly number[],
	width: number,
	charWidth: number,
	gap = 16
): AxisLabel[] {
	const placed = texts.map((text, i) => {
		const w = text.length * charWidth;
		const x = xs[i];
		const anchor: AxisLabel['anchor'] =
			x - w / 2 < 0 ? 'start' : x + w / 2 > width ? 'end' : 'middle';
		const from = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
		return { text, x, anchor, from, to: from + w };
	});
	const visible = placed.map(() => true);
	let lastFrom = Infinity;
	for (let i = placed.length - 1; i >= 0; i--) {
		const keep = i === placed.length - 1 || placed[i].to + gap <= lastFrom;
		visible[i] = keep;
		if (keep) lastFrom = placed[i].from;
	}
	return placed.map((p, i) => ({ text: p.text, x: p.x, anchor: p.anchor, visible: visible[i] }));
}
