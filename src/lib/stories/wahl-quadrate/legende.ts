/**
 * Legende für Plakat und Bilder: Parteinamen aus `quadrate/namen.ts`, Grau mit der Schwelle
 * aus dem Handbuch. Die Farben kommen aus `farben.ts`.
 */
import { partyName } from '$lib/components/stories/quadrate/namen';
import type { Lang } from './grau';
import { ORDER } from './parteien';

const GREY_LEGEND: Record<Lang, { below: (pct: number) => string; others: string }> = {
	de: { below: (p) => `Grau: alle Parteien unter ${p} %`, others: 'Grau: Sonstige' },
	en: { below: (p) => `Grey: all parties below ${p}%`, others: 'Grey: other parties' }
};

/** Legendentext je Block in `ORDER`. */
export function legendNames(lang: Lang, thr: number): string[] {
	const grey = GREY_LEGEND[lang];
	const pct = Math.round(thr * 100);
	return ORDER.map((k) =>
		k === 'rest' ? (pct > 0 ? grey.below(pct) : grey.others) : partyName(k, lang)
	);
}
