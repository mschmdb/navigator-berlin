export interface FormattedValue {
	text: string;
	isNumeric: boolean;
}

const FALLBACK: FormattedValue = { text: 'Daten nicht vorhanden', isNumeric: false };

function safeString(value: unknown): string {
	if (value === null || value === undefined) return '';
	if (typeof value === 'object') {
		try {
			return JSON.stringify(value);
		} catch {
			return '';
		}
	}
	return String(value);
}

export function formatLayerValue(slug: string, value: unknown): FormattedValue {
	if (value === null || value === undefined) return FALLBACK;
	if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) {
		return FALLBACK;
	}

	switch (slug) {
		case 'mietspiegel-wohnlage':
			return { text: safeString(value), isNumeric: false };
		case 'bodenrichtwerte':
			return { text: `${safeString(value)} €/m²`, isNumeric: true };
		case 'laerm-den':
		case 'laerm-night':
			return { text: `${safeString(value)} dB`, isNumeric: true };
		case 'solarpotenzial':
			return { text: `${safeString(value)} kWh/m²`, isNumeric: true };
		case 'gebaeudealter':
			return { text: safeString(value), isNumeric: false };
		case 'klimaanalyse':
			return { text: safeString(value), isNumeric: false };
		case 'stolpersteine': {
			if (typeof value === 'object' && value && 'person' in value) {
				const person = (value as { person?: unknown }).person;
				if (typeof person === 'string' && person.length > 0) {
					return { text: `Für ${person}`, isNumeric: false };
				}
			}
			return { text: 'Gedenkstein in der Nähe', isNumeric: false };
		}
		case 'trinkbrunnen':
			return { text: 'Trinkbrunnen vor Ort', isNumeric: false };
		case 'bezirke':
		case 'ortsteile':
		case 'lor-prognoseraum':
		case 'lor-bezirksregion':
		case 'lor-planungsraum':
		case 'plz':
			return { text: safeString(value), isNumeric: false };
		default:
			return { text: safeString(value), isNumeric: typeof value === 'number' };
	}
}
