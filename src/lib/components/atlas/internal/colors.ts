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
	chartCat6: '#366AA0'
} as const;

export type ColorToken = keyof typeof COLORS;
