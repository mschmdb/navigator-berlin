/** Layer im Card-Muster (Wert-Chip + Umfeld-Kontext). PET hat eigene Karte (Range-Bar). */
export const CARD_SLUGS: ReadonlySet<string> = new Set([
	'laerm-2023',
	'luft-2023',
	'bioklima-2023',
	'gruenversorgung-2023',
	'umweltgerechtigkeit-2023',
	'wohnlagen-2024',
	'mss-gesamtindex-2025',
	'bodenrichtwerte',
	'zensus-bestandsmiete-2022',
	'milieuschutz-erhaltungsmiete',
	'milieuschutz-staedtebau',
	// Lage & Verwaltung + Einschulbereiche: nur kompakter Name/Code, kein Umfeld-Kontext.
	'bezirke',
	'ortsteile',
	'plz',
	'einschulbereiche-2024',
	// Einrichtungs-POIs: Name + Adresse als kompakte Card statt alter Hit-Row.
	'kitas-2024',
	'schulen-2024',
	'krankenhaeuser-plan',
	'krankenhaeuser-weitere',
	'sportanlagen-2024',
	'schwimmbaeder',
	'spielplaetze',
	'gruenanlagen',
	'fahrradstrassen-2024'
]);
