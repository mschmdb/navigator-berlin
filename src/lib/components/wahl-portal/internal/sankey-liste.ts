/**
 * #127: Übergänge als Liste für schmale Bildschirme. Auf 390 px sind die
 * Bänder nur wenige Pixel hoch; die Liste trägt dort die Details, die Grafik
 * bleibt als Überblick. Reine Datenaufbereitung, voll unit-testbar.
 */
import type { SankeyGraph } from './sankey-graph.js';
import { linkKey } from './sankey-interaction.js';

export interface UebergangsEintrag {
	/** Gleicher Schlüssel wie das Band in der Grafik (`linkKey`). */
	readonly key: string;
	readonly von: string;
	readonly nach: string;
	readonly value: number;
	/** Anteil an allen Gebieten mit Daten im Zieljahr (0..1). */
	readonly anteil: number;
}

export interface UebergangsGruppe {
	readonly vonJahr: number;
	readonly nachJahr: number;
	readonly eintraege: readonly UebergangsEintrag[];
}

export function buildUebergangsGruppen(graph: SankeyGraph): UebergangsGruppe[] {
	const gruppen: UebergangsGruppe[] = [];
	for (let i = 1; i < graph.spalten.length; i++) {
		const vonJahr = graph.spalten[i - 1].jahr;
		const nachJahr = graph.spalten[i].jahr;
		const basis = graph.gebieteMitDatenByJahr.get(nachJahr) ?? graph.totalGebiete;
		const eintraege = graph.links
			.filter((l) => l.jahr === nachJahr)
			.map((l) => ({
				key: linkKey(l),
				von: l.von,
				nach: l.nach,
				value: l.value,
				anteil: basis > 0 ? l.value / basis : 0
			}))
			.sort((a, b) => b.value - a.value || a.nach.localeCompare(b.nach, 'de'));
		if (eintraege.length > 0) gruppen.push({ vonJahr, nachJahr, eintraege });
	}
	return gruppen;
}
