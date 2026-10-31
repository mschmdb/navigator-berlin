import type { Kennzahlen, Marks } from './types';

const norm = (v: number, a: number, b: number): number =>
	Math.min(1, Math.max(0, (v - a) / (b - a)));

const MAX_CLUBS = 50;
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/**
 * Absolute Skalen: Dieselbe Zahl ergibt überall dieselbe Größe, auch auf Bezirksebene.
 * Ein vorhandener Wert zeichnet immer eine Form. Ein fehlender Wert (`null`) ergibt keine Größe, nie einen Ersatzwert.
 */
export function scaleMarks(k: Kennzahlen): Marks {
	const clubs = Math.min(Math.max(k.clubs ?? 0, 0), MAX_CLUBS);
	return {
		circleR: k.gruen === null ? null : 12 + clamp01(k.gruen) * 32,
		squareSize: k.altbauAnteil === null ? null : 14 + clamp01(k.altbauAnteil) * 80,
		triangleSize: k.laermDb === null ? null : 16 + norm(k.laermDb, 45, 62) * 80,
		barLength:
			k.bewohnerProKm2 === null
				? null
				: 20 +
					norm(Math.log(Math.max(k.bewohnerProKm2, 0) + 1), Math.log(200), Math.log(30000)) * 150,
		// Ein vorhandener Wert zeigt immer mindestens eine Linie, sonst läse er sich wie "keine Daten".
		lineCount:
			k.haltestelle400mAnteil === null
				? 0
				: Math.max(1, Math.round(norm(k.haltestelle400mAnteil, 0.8, 1) * 6)),
		donutR: clubs > 0 ? 9 + Math.sqrt(clubs / MAX_CLUBS) * 30 : 0
	};
}
