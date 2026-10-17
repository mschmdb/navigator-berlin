import type { WaermeOrt } from '$lib/data/get-waerme-orte-index.js';
import type { WaermeOrtStatus } from '$lib/kaelte/nearest-waerme-orte.js';
import { categoryLabel } from '$lib/components/kuehle-orte/category-label.js';
import { buildErrorReportMailto } from '$lib/utils/contact.js';
import { m } from '$lib/paraglide/messages.js';
import { getLocale, type Locale } from '$lib/paraglide/runtime';

/** Gemeinsame Textbausteine der Warme-Orte-Liste (/kaelte und Inspector-Karte). */

export type StatusSource = 'recherche' | 'osm';

export function statusSourceOf(ort: Pick<WaermeOrt, 'hoursSource'>): StatusSource {
	return ort.hoursSource === 'recherche' ? 'recherche' : 'osm';
}

export function statusText(
	status: WaermeOrtStatus,
	source: StatusSource,
	locale: Locale = getLocale()
): string {
	const opts = { locale };
	if (source === 'recherche') {
		if (status === 'open') return m.kaelte_orte_status_open_recherche(undefined, opts);
		if (status === 'closing-soon')
			return m.kaelte_orte_status_closing_soon_recherche(undefined, opts);
		return m.kaelte_orte_status_closed_recherche(undefined, opts);
	}
	if (status === 'open') return m.kaelte_orte_status_open(undefined, opts);
	if (status === 'closing-soon') return m.kaelte_orte_status_closing_soon(undefined, opts);
	return m.kaelte_orte_status_closed(undefined, opts);
}

export function statusClass(status: WaermeOrtStatus): string {
	if (status === 'open') return 'text-state-success';
	if (status === 'closing-soon') return 'text-state-warning';
	return 'text-ink-muted';
}

export function winterText(value: WaermeOrt['winterOpen'], locale: Locale = getLocale()): string {
	const opts = { locale };
	if (value === 'yes') return m.kaelte_orte_winter_yes(undefined, opts);
	if (value === 'limited') return m.kaelte_orte_winter_limited(undefined, opts);
	if (value === 'no') return m.kaelte_orte_winter_no(undefined, opts);
	return m.kaelte_orte_winter_unknown(undefined, opts);
}

export function stayText(
	value: WaermeOrt['stayWithoutPurchase'],
	locale: Locale = getLocale()
): string {
	const opts = { locale };
	if (value === 'yes') return m.kaelte_orte_stay_yes(undefined, opts);
	if (value === 'no') return m.kaelte_orte_stay_no(undefined, opts);
	return m.kaelte_orte_stay_unknown(undefined, opts);
}

export function feeText(value: WaermeOrt['isFree'], locale: Locale = getLocale()): string {
	const opts = { locale };
	if (value === 'free') return m.kaelte_orte_fee_free(undefined, opts);
	if (value === 'ticket') return m.kaelte_orte_fee_ticket(undefined, opts);
	return m.kaelte_orte_fee_unknown(undefined, opts);
}

export function checkedText(iso: string, locale: Locale = getLocale()): string {
	const date = new Date(`${iso}T00:00:00Z`);
	const formatted = Number.isNaN(date.getTime())
		? iso
		: new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(date);
	return m.kaelte_orte_geprueft({ datum: formatted }, { locale });
}

export function counterText(shown: number, total: number, locale: Locale = getLocale()): string {
	return m.kaelte_orte_zaehler({ shown, total }, { locale });
}

export function reportHref(ort: WaermeOrt, locale: Locale = getLocale()): string {
	return buildErrorReportMailto({
		layerSlug: 'waerme-orte',
		layerName: `${ort.name} (${ort.id})`,
		displayName: ort.address ? `${ort.address}, ${ort.plz}`.replace(/, $/, '') : undefined,
		lat: ort.lat,
		lng: ort.lng,
		sourceUrl: ort.sourceUrl || undefined,
		category: categoryLabel(ort.cat, locale).text,
		checkedAt: ort.checkedAt || undefined
	});
}
