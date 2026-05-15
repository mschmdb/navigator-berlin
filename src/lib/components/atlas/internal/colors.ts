// MapLibre kann CSS-Custom-Properties nicht direkt lesen (JSON-Style-Spec). Daher
// duplizieren wir die Token-Hex-Werte aus src/app.css hier. Phase-2-Refactor: Build-Step
// der die Token aus app.css parst und JSON-Constants schreibt.
// Quelle Tokens: src/app.css (Story 1.2 Design-Token-Foundation).

export const COLORS = {
	bg: '#ECEAE0',
	accent: '#2A3F7C',
	accentSoft: '#E0E4F0',
	vermillion: '#9E5520',
	vermillionSoft: '#C99F7A',
	indigo: '#2A3F7C',
	chartCat1: '#2A3F7C',
	chartCat2: '#9E5520',
	chartCat3: '#0E6549',
	chartCat4: '#74488E',
	chartCat5: '#856310',
	chartCat6: '#366AA0',
	// Story 1.15 POI-Pin-Tokens. Semantische Farbcodes pro Bundle (Memorial, Umwelt, Sozial, Mobility).
	memorialStolperstein: '#B08C57',
	umweltTrinkbrunnen: '#1565C0',
	sozialKita: '#74488E',
	sozialSchule: '#0E6549',
	sozialKrankenhaus: '#B71C1C',
	sozialKrankenhausSecondary: '#E57373',
	sozialSport: '#E65100',
	sozialSchwimmbad: '#00838F',
	mobilityUbahn: '#003365',
	mobilitySbahn: '#006F35',
	mobilityTram: '#DD1F26',
	mobilityBus: '#6A2A82',
	// Story 1.18 Severity-Tokens (Inspector Value-Chips). Hex-Duplikate aus app.css.
	severitySuccess: '#1F5A2E',
	severitySuccessBg: '#E8F2EA',
	severitySuccessSoft: '#2D7A3E',
	severitySuccessSoftBg: '#EFF6F1',
	severityNeutral: '#4A4A46',
	severityNeutralBg: '#F2F0EC',
	severityWarning: '#8C4A0E',
	severityWarningBg: '#FBEEDD',
	severityDanger: '#8C2A14',
	severityDangerBg: '#F8E4DF',
	// Story 1.31 AC-8/10 Choropleth-Scale-Tokens (3 Familien × 5 Stufen).
	// Build-generated via scripts/lib/check-scale-contrast.ts.
	scaleLast1: '#8F7972',
	scaleLast2: '#90675B',
	scaleLast3: '#905545',
	scaleLast4: '#8F412E',
	scaleLast5: '#8C2A14',
	scaleGut1: '#79887A',
	scaleGut2: '#647C66',
	scaleGut3: '#4F7153',
	scaleGut4: '#396641',
	scaleGut5: '#1F5A2E',
	scaleStrukturell1: '#797D88',
	scaleStrukturell2: '#656E86',
	scaleStrukturell3: '#515E83',
	scaleStrukturell4: '#3D4F80',
	scaleStrukturell5: '#2A3F7C'
} as const;

export type ColorToken = keyof typeof COLORS;
