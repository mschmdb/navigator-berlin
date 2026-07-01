import type { FaqEntry } from '$lib/data/types.js';

// Story 16 SEO: FAQ für die Hitze-Landing. Fragen an realer Suchintention orientiert
// („kühle Orte Berlin", „klimatisierte Orte", „was hilft bei Hitze"). Sichtbar gerendert
// (FaqSection) und als FAQPage-JSON-LD, damit Google Rich-Results ziehen kann.
export const HITZE_FAQ: readonly FaqEntry[] = [
	{
		question: 'Wo finde ich in Berlin kühle Orte bei Hitze?',
		answer:
			'Der Hitze-Navigator zeigt über 500 kühle Orte in ganz Berlin: Kinos, Bibliotheken, Schwimmhallen, Museen, Malls und Trinkbrunnen. Gib deinen Standort ein, die Karte sortiert die nächsten geöffneten Orte nach Entfernung.'
	},
	{
		question: 'Welche Orte in Berlin sind bei Hitze klimatisiert?',
		answer:
			'Viele Kinos, Museen und Malls sind klimatisiert. Wo die Klimatisierung belegt ist, markiert der Navigator den Ort entsprechend. Ist sie nicht belegbar, sagen wir das offen statt zu raten.'
	},
	{
		question: 'Sind die kühlen Orte kostenlos zugänglich?',
		answer:
			'Bibliotheken, Trinkbrunnen und Malls sind meist frei zugänglich. Schwimmhallen und Museen kosten oft Eintritt. Jeder Ort trägt eine Angabe, ob kostenlos oder mit Ticket.'
	},
	{
		question: 'Was hilft bei Hitze in Berlin?',
		answer:
			'Kühle Innenräume aufsuchen, viel trinken, direkte Sonne meiden. Der Hitze-Navigator zeigt den nächsten kühlen Ort, die Stadt Berlin bündelt Verhaltenstipps im Hitzeschutzportal.'
	},
	{
		question: 'Woher stammen die Daten zu den kühlen Orten?',
		answer:
			'Geometrie und Basis-Angaben kommen aus OpenStreetMap (ODbL), ergänzt um eine redaktionelle Prüfung von navigator.berlin. Die aktuelle Hitzewarnung liefert der Deutsche Wetterdienst.'
	}
];
