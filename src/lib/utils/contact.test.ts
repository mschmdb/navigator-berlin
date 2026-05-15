import { describe, expect, it } from 'vitest';
import { FEEDBACK_EMAIL, buildErrorReportMailto } from './contact.js';

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
