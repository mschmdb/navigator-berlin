import { describe, expect, it } from 'vitest';
import { buildItemList } from './jsonld-itemlist.js';

describe('buildItemList', () => {
	it('rendert ItemList mit Position 1-N + Place-Refs', () => {
		const list = buildItemList({
			origin: 'https://navigator.berlin',
			items: [
				{ name: 'Alpha', path: '/kiez/alpha' },
				{ name: 'Bravo', path: '/kiez/bravo' }
			]
		});
		expect(list['@type']).toBe('ItemList');
		expect(list.numberOfItems).toBe(2);
		expect(list.itemListElement).toHaveLength(2);
		expect(list.itemListElement[0]).toEqual({
			'@type': 'ListItem',
			position: 1,
			item: { '@type': 'Place', name: 'Alpha', url: 'https://navigator.berlin/kiez/alpha' }
		});
	});

	it('strippt trailing slash vom origin und ergänzt leading slash am path', () => {
		const list = buildItemList({
			origin: 'https://navigator.berlin/',
			items: [{ name: 'X', path: 'kiez/x' }]
		});
		expect(list.itemListElement[0].item.url).toBe('https://navigator.berlin/kiez/x');
	});

	it('liefert leere ItemList wenn keine Items', () => {
		const list = buildItemList({ origin: 'https://navigator.berlin', items: [] });
		expect(list.numberOfItems).toBe(0);
		expect(list.itemListElement).toEqual([]);
	});
});
