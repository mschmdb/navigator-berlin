import { parteiZiel } from './parteien';
import type { ElectionShares, WahlZahlen } from './types';

/** Wandelt die Zahlen einer Wahl aus `stories-wahl.json` in die Eingabe von `derive`. */
export function toElectionShares(z: WahlZahlen): ElectionShares {
	const e: ElectionShares = { raw: {}, sonst: 0, fw: 0 };
	for (const p of z.parteien) {
		const ziel = parteiZiel(p.kurzname);
		if (ziel === 'sonst') e.sonst += p.anteil;
		else if (ziel === 'fw') e.fw += p.anteil;
		else e.raw[ziel] = (e.raw[ziel] ?? 0) + p.anteil;
	}
	return e;
}
