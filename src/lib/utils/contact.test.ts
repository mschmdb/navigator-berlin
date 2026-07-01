import { describe, expect, it } from 'vitest';
import { FEEDBACK_EMAIL, buildErrorReportMailto, buildOptOutMailto } from './contact.js';

describe('FEEDBACK_EMAIL', () => {
	it('ist hey@navigator.berlin', () => {
		expect(FEEDBACK_EMAIL).toBe('hey@navigator.berlin');
	});
});

describe('buildErrorReportMailto', () => {
	it('startet mit mailto: + Recipient', () => {
		const url = buildErrorReportMailto({ layerSlug: 'x', layerName: 'X' });
		expect(url.startsWith(`mailto:${FEEDBACK_EMAIL}?`)).toBe(true);
	});

	it('Subject enthält layerName URL-encoded', () => {
		const url = buildErrorReportMailto({
			layerSlug: 'mietspiegel-wohnlage',
			layerName: 'Mietspiegel Wohnlage'
		});
		expect(url).toContain('subject=Fehler%20im%20Eintrag%3A%20Mietspiegel%20Wohnlage');
	});

	it('Body enthält Layer-Slug, Adresse, Lat,Lng, Datenstand, Quelle', () => {
		const url = buildErrorReportMailto({
			layerSlug: 'mietspiegel-wohnlage',
			layerName: 'Mietspiegel',
			displayName: 'Boxhagener Straße 12',
			lat: 52.5119,
			lng: 13.4612,
			fetchedAt: '2024-09-15',
			sourceUrl: 'https://example.org/source'
		});
		const decoded = decodeURIComponent(url.split('&body=')[1] ?? '');
		expect(decoded).toContain('Layer: mietspiegel-wohnlage');
		expect(decoded).toContain('Adresse: Boxhagener Straße 12');
		expect(decoded).toContain('Lat,Lng: 52.5119,13.4612');
		expect(decoded).toContain('Datenstand: 2024-09-15');
		expect(decoded).toContain('Quelle: https://example.org/source');
		expect(decoded).toContain('Beschreibung:');
	});

	it('Newlines via %0A im Body', () => {
		const url = buildErrorReportMailto({
			layerSlug: 'x',
			layerName: 'X',
			displayName: 'Strasse 1'
		});
		const body = url.split('&body=')[1] ?? '';
		expect(body).toMatch(/%0A/);
	});

	it('lässt fehlende optionale Felder weg', () => {
		const url = buildErrorReportMailto({ layerSlug: 'x', layerName: 'X' });
		const decoded = decodeURIComponent(url.split('&body=')[1] ?? '');
		expect(decoded).not.toContain('Adresse:');
		expect(decoded).not.toContain('Lat,Lng:');
		expect(decoded).not.toContain('Datenstand:');
		expect(decoded).not.toContain('Quelle:');
		expect(decoded).toContain('Layer: x');
	});

	it('Sonderzeichen in displayName URL-encoded', () => {
		const url = buildErrorReportMailto({
			layerSlug: 'x',
			layerName: 'X',
			displayName: 'Straße & Co.'
		});
		expect(url).toMatch(/Stra%C3%9Fe/);
		expect(url).toContain('%26');
	});
});

describe('buildOptOutMailto (Story 16.4)', () => {
	it('startet mit mailto: + Feedback-Recipient', () => {
		const url = buildOptOutMailto();
		expect(url.startsWith(`mailto:${FEEDBACK_EMAIL}?`)).toBe(true);
	});

	it('Betreff „Austragung kühler Ort" URL-encoded', () => {
		const url = buildOptOutMailto();
		expect(url).toContain(`subject=${encodeURIComponent('Austragung kühler Ort')}`);
	});

	it('Body enthält Struktur für Name, Adresse, Begründung', () => {
		const decoded = decodeURIComponent(buildOptOutMailto().split('&body=')[1] ?? '');
		expect(decoded).toContain('Name der Einrichtung:');
		expect(decoded).toContain('Adresse:');
		expect(decoded).toContain('Begründung:');
	});

	it('übernimmt optionalen Name/Adresse-Kontext', () => {
		const decoded = decodeURIComponent(
			buildOptOutMailto({ name: 'Kino Central', address: 'Rosenthaler Str. 39' }).split(
				'&body='
			)[1] ?? ''
		);
		expect(decoded).toContain('Name der Einrichtung: Kino Central');
		expect(decoded).toContain('Adresse: Rosenthaler Str. 39');
	});

	it('Newlines via %0A im Body', () => {
		expect((buildOptOutMailto().split('&body=')[1] ?? '').match(/%0A/)).not.toBeNull();
	});

	it('kein em-dash, kein Absolutismus in Betreff/Body', () => {
		const url = buildOptOutMailto({ name: 'X', address: 'Y' });
		const decoded = decodeURIComponent(url);
		expect(decoded).not.toContain('—');
		for (const token of ['einzige', 'vollständig', 'garantiert', 'beste']) {
			expect(decoded.toLowerCase()).not.toContain(token);
		}
	});
});
