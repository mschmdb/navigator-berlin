/**
 * Zeitleiste für Kapitel 5 „Ein Bezirk über die Zeit“ (#190), nach runde-20-ux/src/handbuch.js:
 * jede Wahl steht `HOLD` Sekunden, dann gleitet das Quadrat in `MORPH` Sekunden zur nächsten.
 * Die gezeigte Wahl (Zahlen, Jahr, Bildunterschrift) wechselt hart zur Mitte des Übergangs.
 */
export const HOLD = 2.2;
export const MORPH = 1;

export interface Zeitpunkt {
	/** Index der Wahl, von der das Quadrat kommt. */
	readonly from: number;
	readonly to: number;
	/** Fortschritt des Übergangs nach `ease`, 0 bis 1. */
	readonly t: number;
	/** Index der Wahl, deren Zahlen gerade stehen. */
	readonly shown: number;
}

export function ease(t: number): number {
	return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function zeitpunkt(time: number, n: number): Zeitpunkt {
	const cycle = HOLD + MORPH;
	const loop = n * cycle;
	const at = ((time % loop) + loop) % loop;
	const from = Math.floor(at / cycle);
	const rest = at - from * cycle;
	const to = (from + 1) % n;
	const t = rest < HOLD ? 0 : ease((rest - HOLD) / MORPH);
	return { from, to, t, shown: t >= 0.5 ? to : from };
}
