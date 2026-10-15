import { describe, expect, it } from 'vitest';
import { buildOrganization, organizationRef } from './jsonld-organization.js';

describe('buildOrganization', () => {
	it('hat @context, @type, @id, name und url', () => {
		const out = buildOrganization({ origin: 'https://navigator.berlin' });
		expect(out['@context']).toBe('https://schema.org');
		expect(out['@type']).toBe('Organization');
		expect(out['@id']).toBe('https://navigator.berlin/#organization');
		expect(out.name).toBe('navigator.berlin');
		expect(out.url).toBe('https://navigator.berlin');
	});

	it('hat ein PNG-Logo mit Maßen', () => {
		const out = buildOrganization({ origin: 'https://navigator.berlin' });
		expect(out.logo).toEqual({
			'@type': 'ImageObject',
			url: 'https://navigator.berlin/logo-organization.png',
			width: 512,
			height: 512
		});
	});

	it('übernimmt description, wenn gesetzt', () => {
		const out = buildOrganization({ origin: 'https://navigator.berlin', description: 'Atlas' });
		expect(out.description).toBe('Atlas');
		expect(buildOrganization({ origin: 'https://navigator.berlin' }).description).toBeUndefined();
	});

	it('sameAs enthält nur das Projekt-Repository', () => {
		const out = buildOrganization({ origin: 'https://navigator.berlin' });
		expect(out.sameAs).toEqual(['https://github.com/mschmdb/navigator-berlin']);
	});

	it('sameAs enthält keine persönlichen Profile, sie hängen an der Person', () => {
		const out = buildOrganization({ origin: 'https://navigator.berlin' });
		expect(JSON.stringify(out.sameAs)).not.toMatch(/linkedin|bsky/);
	});

	it('verweist per founder auf die Person-@id (volle Person steht auf /ueber)', () => {
		const out = buildOrganization({ origin: 'https://navigator.berlin' });
		expect(out.founder['@id']).toBe('https://schmidbauer.dev/#person');
		expect(out.founder['@type']).toBe('Person');
		expect(out.founder).not.toHaveProperty('sameAs');
	});

	it('strippt trailing-slash aus origin', () => {
		const out = buildOrganization({ origin: 'https://navigator.berlin/' });
		expect(out['@id']).toBe('https://navigator.berlin/#organization');
	});
});

describe('organizationRef', () => {
	it('liefert @type, @id, name und url', () => {
		expect(organizationRef('https://navigator.berlin')).toEqual({
			'@type': 'Organization',
			'@id': 'https://navigator.berlin/#organization',
			name: 'navigator.berlin',
			url: 'https://navigator.berlin'
		});
	});

	it('konsolidiert hitze-Subdomain auf die Hauptdomain', () => {
		expect(organizationRef('https://hitze.navigator.berlin')['@id']).toBe(
			'https://navigator.berlin/#organization'
		);
	});
});
