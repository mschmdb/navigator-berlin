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

/**
 * Gruppiert die Übergänge nach echtem Quell- und Zieljahr. Bei Datenlücken
 * überspringt ein Übergang Spalten (z. B. 2011 → 2023); das Quelljahr kommt
 * deshalb vom Quell-Knoten, nicht von der Nachbarspalte. Fehlt der Knoten,
 * gilt die Spalte vor dem Zieljahr.
 */
export function buildUebergangsGruppen(graph: SankeyGraph): UebergangsGruppe[] {
	const jahrByNodeId = new Map(graph.nodes.map((n) => [n.id, n.jahr]));
	const vorjahrBySpalte = new Map(
		graph.spalten.slice(1).map((s, i) => [s.jahr, graph.spalten[i].jahr])
	);
	const gruppen = new Map<
		string,
		{ vonJahr: number; nachJahr: number; eintraege: UebergangsEintrag[] }
	>();
	for (const l of graph.links) {
		const vonJahr = jahrByNodeId.get(l.source) ?? vorjahrBySpalte.get(l.jahr);
		if (vonJahr === undefined) continue;
		const basis = graph.gebieteMitDatenByJahr.get(l.jahr) ?? graph.totalGebiete;
		const gruppenKey = `${vonJahr}->${l.jahr}`;
		const gruppe = gruppen.get(gruppenKey) ?? { vonJahr, nachJahr: l.jahr, eintraege: [] };
		gruppe.eintraege.push({
			key: linkKey(l),
			von: l.von,
			nach: l.nach,
			value: l.value,
			anteil: basis > 0 ? l.value / basis : 0
		});
		gruppen.set(gruppenKey, gruppe);
	}
	return [...gruppen.values()]
		.map((g) => ({
			...g,
			eintraege: g.eintraege.sort((a, b) => b.value - a.value || a.nach.localeCompare(b.nach, 'de'))
		}))
		.sort((a, b) => a.nachJahr - b.nachJahr || a.vonJahr - b.vonJahr);
}
