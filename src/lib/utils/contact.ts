export const FEEDBACK_EMAIL = 'hey@navigator.berlin';

export interface ErrorReportContext {
	layerSlug: string;
	layerName: string;
	displayName?: string;
	lat?: number;
	lng?: number;
	sourceUrl?: string;
	fetchedAt?: string;
}

export function buildErrorReportMailto(ctx: ErrorReportContext): string {
	const subject = `Fehler im Eintrag: ${ctx.layerName}`;
	const lines = [
		`Layer: ${ctx.layerSlug}`,
		ctx.displayName ? `Adresse: ${ctx.displayName}` : null,
		ctx.lat !== undefined && ctx.lng !== undefined ? `Lat,Lng: ${ctx.lat},${ctx.lng}` : null,
		ctx.fetchedAt ? `Datenstand: ${ctx.fetchedAt}` : null,
		ctx.sourceUrl ? `Quelle: ${ctx.sourceUrl}` : null,
		'',
		'Beschreibung:',
		''
	].filter((l): l is string => l !== null);
	const body = lines.join('\n');
	return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export interface OptOutContext {
	/** Name der Einrichtung, optional vorbelegt. */
	name?: string;
	/** Adresse der Einrichtung, optional vorbelegt. */
	address?: string;
}

// Story 16.4: Institutionen tragen sich per vorbereitetem Mail-Entwurf aus. Eigener Betreff/Body
// (institutions-, nicht ortsbezogen), gemeinsam mit buildErrorReportMailto bleiben Recipient + Encoding.
export function buildOptOutMailto(ctx: OptOutContext = {}): string {
	const subject = 'Austragung kühler Ort';
	const lines = [
		'Ich möchte einen Ort aus der Kühle-Orte-Karte austragen lassen.',
		'',
		`Name der Einrichtung: ${ctx.name ?? ''}`,
		`Adresse: ${ctx.address ?? ''}`,
		'',
		'Begründung:',
		''
	];
	const body = lines.join('\n');
	return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
