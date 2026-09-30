// Story 16.4: Quellen-Transparenz + Angebot-Haltung für die Kühle-Orte-Landing (/hitze).
// Content getrennt vom Markup, damit die Strings ohne DOM auf em-dashes und Absolutismen
// prüfbar sind. Naming an home-data-sources.ts und /lizenzen angelehnt.
// i18n C4c: Die Texte kommen aus Paraglide-Messages und folgen der Seiten-Locale,
// deshalb Funktionen statt Konstanten.

import { m } from '$lib/paraglide/messages.js';

export interface TransparenzQuelle {
	/** Anzeigename des Quellen-Strangs. */
	readonly name: string;
	/** Erläuterung, was der Strang beiträgt. */
	readonly detail: string;
	/** Lizenz-Kürzel, falls einschlägig. */
	readonly lizenz?: string;
}

export function getKuehleOrteQuellen(): readonly TransparenzQuelle[] {
	return [
		{
			name: 'OpenStreetMap',
			detail: m.transparenz_quelle_osm_detail(),
			lizenz: 'ODbL 1.0'
		},
		{
			name: m.transparenz_quelle_redaktion_name(),
			detail: m.transparenz_quelle_redaktion_detail()
		},
		{
			name: m.transparenz_quelle_dwd_name(),
			detail: m.transparenz_quelle_dwd_detail()
		}
	];
}

export function getKuehleOrteHaltung(): string {
	return m.transparenz_haltung();
}
