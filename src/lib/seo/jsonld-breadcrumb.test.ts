import { describe, expect, it } from 'vitest';
import { buildBreadcrumbList } from './jsonld-breadcrumb.js';

describe('buildBreadcrumbList', () => {
	it('hat @type BreadcrumbList mit itemListElement', () => {
		const out = buildBreadcrumbList({
			origin: 'https://navigator.berlin',
			items: [
				{ name: 'Berlin', path: '/' },
				{ name: 'Methodik', path: '/methodik' }
			]
		});
		expect(out['@context']).toBe('https://schema.org');
		expect(out['@type']).toBe('BreadcrumbList');
		expect(Array.isArray(out.itemListElement)).toBe(true);
	});

	it('weist 1-based position pro Step zu', () => {
		const out = buildBreadcrumbList({
			origin: 'https://navigator.berlin',
			items: [
				{ name: 'Berlin', path: '/' },
				{ name: 'Bezirk', path: '/bezirk/mitte' },
				{ name: 'Kiez', path: '/kiez/spandauer-vorstadt' }
			]
		});
		expect(out.itemListElement).toHaveLength(3);
		expect(out.itemListElement[0].position).toBe(1);
		expect(out.itemListElement[1].position).toBe(2);
		expect(out.itemListElement[2].position).toBe(3);
	});

	it('item ist absolute URL aus origin + path', () => {
		const out = buildBreadcrumbList({
			origin: 'https://navigator.berlin/',
			items: [{ name: 'Methodik', path: '/methodik' }]
		});
		expect(out.itemListElement[0].item).toBe('https://navigator.berlin/methodik');
	});
});
