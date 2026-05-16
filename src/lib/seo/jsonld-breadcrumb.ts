import type { WithContext } from 'schema-dts';

/**
 * Story 2.2 T3.6: BreadcrumbList-JSON-LD.
 *
 * Konsumenten: Bezirk-Pages (Story 2.3), Kiez-Pages (Story 2.4), Layer-Detail-
 * Pages (existiert), Methodik (existiert), Ranking (Story 2.9b).
 *
 * Erfuellt UX-DR40 (Breadcrumb-Hierarchie strukturiert verfuegbar).
 */
export interface BreadcrumbItem {
	readonly name: string;
	/** Relativer Pfad, z. B. `/bezirk/mitte`. */
	readonly path: string;
}

export interface BreadcrumbListInput {
	readonly origin: string;
	readonly items: readonly BreadcrumbItem[];
}

export interface BreadcrumbListItemJsonLd {
	'@type': 'ListItem';
	position: number;
	name: string;
	item: string;
}

export interface BreadcrumbListLeafJsonLd {
	'@type': 'BreadcrumbList';
	itemListElement: BreadcrumbListItemJsonLd[];
}

export type BreadcrumbListJsonLd = WithContext<BreadcrumbListLeafJsonLd>;

export function buildBreadcrumbList(
	input: BreadcrumbListInput
): BreadcrumbListJsonLd {
	const origin = input.origin.replace(/\/+$/, '');
	const itemListElement: BreadcrumbListItemJsonLd[] = input.items.map((item, idx) => {
		const path = item.path.startsWith('/') ? item.path : `/${item.path}`;
		return {
			'@type': 'ListItem',
			position: idx + 1,
			name: item.name,
			item: `${origin}${path}`
		};
	});
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement
	};
}
