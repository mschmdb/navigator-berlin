// Story 16.4: Quellen-Transparenz + Angebot-Haltung für die Kühle-Orte-Landing (/hitze).
// Content getrennt vom Markup, damit die Strings ohne DOM auf em-dashes und Absolutismen
// prüfbar sind. Naming an home-data-sources.ts und /lizenzen angelehnt.

export interface TransparenzQuelle {
	/** Anzeigename des Quellen-Strangs. */
	readonly name: string;
	/** Erläuterung, was der Strang beiträgt. */
	readonly detail: string;
	/** Lizenz-Kürzel, falls einschlägig. */
	readonly lizenz?: string;
}

export const KUEHLE_ORTE_QUELLEN: readonly TransparenzQuelle[] = [
	{
		name: 'OpenStreetMap',
		detail:
			'Geometrie und Basis-Angaben der Orte, © OpenStreetMap-Contributors. Weitergabe unter denselben Bedingungen (Share-Alike).',
		lizenz: 'ODbL 1.0'
	},
	{
		name: 'Redaktionelle Anreicherung',
		detail:
			'navigator.berlin prüft Eignung, Adresse, Kühle-Score, Klimatisierung und Sommer-Verfügbarkeit. Wo eine Angabe nicht belegbar war, sagen wir das offen.'
	},
	{
		name: 'Deutscher Wetterdienst',
		detail: 'Amtliche Hitzewarnung für Berlin, live abgefragt und ohne Warnung ausgeblendet.'
	}
];

export const KUEHLE_ORTE_HALTUNG =
	'Der Hitze-Navigator sammelt öffentlich zugängliche kühle Orte und prüft sie redaktionell. Er ergänzt die Angebote der Stadt, er ersetzt sie nicht. Die Liste kann Lücken haben und lebt von Korrekturen. Kein Rechtsanspruch auf Zugang: private Orte wie Malls und Kinos üben Hausrecht aus.';
