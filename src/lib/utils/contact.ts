import { m } from '$lib/paraglide/messages.js';

export const FEEDBACK_EMAIL = 'hey@navigator.berlin';

export interface ErrorReportContext {
	layerSlug: string;
	layerName: string;
	displayName?: string;
	lat?: number;
	lng?: number;
	sourceUrl?: string;
	fetchedAt?: string;
	/** Kategorie des Eintrags, optional. */
	category?: string;
	/** Prüfdatum des Eintrags, getrennt vom Datenstand. */
	checkedAt?: string;
}

export function buildErrorReportMailto(ctx: ErrorReportContext): string {
	const subject = `Fehler im Eintrag: ${ctx.layerName}`;
	const lines = [
		`Layer: ${ctx.layerSlug}`,
		ctx.displayName ? `Adresse: ${ctx.displayName}` : null,
		ctx.lat !== undefined && ctx.lng !== undefined ? `Lat,Lng: ${ctx.lat},${ctx.lng}` : null,
		ctx.category ? `Kategorie: ${ctx.category}` : null,
		ctx.fetchedAt ? `Datenstand: ${ctx.fetchedAt}` : null,
		ctx.checkedAt ? `Geprüft am: ${ctx.checkedAt}` : null,
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
	/** Karte, aus der ausgetragen wird. Default: kühle Orte. */
	kind?: 'kuehle-orte' | 'waerme-orte';
}

// Story 16.4: Institutionen tragen sich per vorbereitetem Mail-Entwurf aus. Eigener Betreff/Body
// (institutions-, nicht ortsbezogen), gemeinsam mit buildErrorReportMailto bleiben Recipient + Encoding.
export function buildOptOutMailto(ctx: OptOutContext = {}): string {
	const warm = ctx.kind === 'waerme-orte';
	const subject = warm ? m.contact_optout_subject_waerme() : m.contact_optout_subject();
	const lines = [
		warm ? m.contact_optout_intro_waerme() : m.contact_optout_intro(),
		'',
		`${m.contact_optout_name_label()} ${ctx.name ?? ''}`,
		`${m.contact_optout_address_label()} ${ctx.address ?? ''}`,
		'',
		m.contact_optout_reason_label(),
		''
	];
	const body = lines.join('\n');
	return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
