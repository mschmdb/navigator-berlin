/**
 * Story 2.12 T2: Layer-Teaser-Content für die Home-Landing.
 *
 * Editorial-Auswahl 5 von 38 Daten-Schichten. Pro Eintrag eine knappe
 * Sub-Line die zeigt, worüber die Schicht spricht. Hardcoded weil DE-only
 * Phase 1; Memory `project_i18n_phase_1_de_only`.
 *
 * `slug` MUSS zu einem Eintrag in `static/layers/MANIFEST.json` passen.
 * Test `home-layer-teasers.test.ts` validiert das beim Build.
 *
 * `iconKey` ist eine String-Konvention statt direkter Lucide-Komponenten-
 * Importe, damit das Modul ausserhalb Svelte-Land lesbar bleibt (z.B. in
 * Build-Scripts oder Manifest-Validierung).
 */
export const LAYER_TEASER_ICON_KEYS = [
	'volume-2',
	'tree-pine',
	'thermometer',
	'train',
	'home',
	'landmark',
	'file-text'
] as const;
export type LayerTeaserIconKey = (typeof LAYER_TEASER_ICON_KEYS)[number];

export interface HomeLayerTeaser {
	readonly slug: string;
	readonly label: string;
	readonly summary: string;
	readonly iconKey: LayerTeaserIconKey;
}

export const HOME_LAYER_TEASERS: readonly HomeLayerTeaser[] = [
	{
		slug: 'laerm-2023',
		label: 'Lärm 2023',
		summary:
			'Strategische Lärmkartierung Berlin. Ordinal-Kategorien pro Planungsraum statt dB-Punktwerten.',
		iconKey: 'volume-2'
	},
	{
		slug: 'gruenversorgung-2023',
		label: 'Grünversorgung 2023',
		summary:
			'Wohnungsnahe Grünfläche pro Person, klassifiziert pro Planungsraum. Senatsverwaltung Stadtentwicklung.',
		iconKey: 'tree-pine'
	},
	{
		slug: 'klima-pet-2022',
		label: 'Klima PET 2022',
		summary:
			'Gefühlte Mittagstemperatur an Sommer-Hitzetagen aus dem Berliner Klima-Atlas.',
		iconKey: 'thermometer'
	},
	{
		slug: 'kiez-score-mobilitaet',
		label: 'Mobilität-Score',
		summary:
			'Bus, Tram, U-Bahn, S-Bahn, Rad-Infrastruktur zusammengefasst zur Mobilität-Dimension des Kiez-Scores.',
		iconKey: 'train'
	},
	{
		slug: 'wohnlagen-2024',
		label: 'Wohnlagen 2024',
		summary:
			'Wohnlage-Klasse aus dem Berliner Mietspiegel-Verfahren (einfach / mittel / gut), block-genau.',
		iconKey: 'home'
	},
	{
		slug: 'kiez-score-kultur',
		label: 'Kultur',
		summary:
			'Zugang zu Bibliothek, Theater, Museum, Kino und mehr. Eigenständige Dimension, nicht im Gesamt-Score.',
		iconKey: 'landmark'
	},
	{
		slug: 'kiez-score-kriminalitaet',
		label: 'Erfasste Kriminalität',
		summary:
			'Häufigkeitszahl der Polizei je Bezirksregion. Kontext, kein Sicherheits-Urteil, nicht im Gesamt-Score.',
		iconKey: 'file-text'
	}
];
