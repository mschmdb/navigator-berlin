import type { WithContext } from 'schema-dts';

/**
 * Story 2.9b T4: ItemList-JSON-LD für Ranking-Pages.
 *
 * Konsument: Ranking-Page „Wo lebt es sich gut?" listet Top-N-Kieze als
 * ItemList damit Suchmaschinen/LLMs die Reihenfolge + Items strukturell
 * verstehen. Items sind Place-Refs (Name + URL); kein eigener Place-Block
 * pro Item nötig weil jede Kiez-Page bereits eigene Place-JSON-LD trägt
 * (Story 2.4).
 */
export interface ItemListItem {
	readonly name: string;
	readonly path: string;
}

export interface ItemListInput {
	readonly origin: string;
	readonly items: readonly ItemListItem[];
}

export interface ListItemJsonLd {
	'@type': 'ListItem';
	position: number;
	item: {
		'@type': 'Place';
		name: string;
		url: string;
	};
}

export interface ItemListLeafJsonLd {
	'@type': 'ItemList';
	itemListElement: ListItemJsonLd[];
	numberOfItems: number;
}

export type ItemListJsonLd = WithContext<ItemListLeafJsonLd>;

export function buildItemList(input: ItemListInput): ItemListJsonLd {
	const origin = input.origin.replace(/\/+$/, '');
	const itemListElement: ListItemJsonLd[] = input.items.map((item, idx) => {
		const path = item.path.startsWith('/') ? item.path : `/${item.path}`;
		return {
			'@type': 'ListItem',
			position: idx + 1,
			item: {
				'@type': 'Place',
				name: item.name,
				url: `${origin}${path}`
			}
		};
	});
	return {
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		itemListElement,
		numberOfItems: itemListElement.length
	};
}
