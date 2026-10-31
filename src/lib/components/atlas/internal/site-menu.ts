/**
 * Header-Menü (#138): Gruppen, Einträge und Saison-Reihenfolge.
 *
 * Reine Daten, keine Texte: Titel und Kurztexte löst `site-menu-labels.ts`
 * über Paraglide auf. Die Gruppen folgen der Abnahme vom 17.10.2026
 * (Karte, Vergleichen, Saison, Daten und Projekt).
 */

export type SiteMenuItemId =
	| 'karte'
	| 'finder'
	| 'score'
	| 'wahlen'
	| 'kieze'
	| 'kaelte'
	| 'hitze'
	| 'daten'
	| 'methodik'
	| 'stories'
	| 'updates'
	| 'ueber';

export type SiteMenuGroupId = 'karte' | 'vergleichen' | 'saison' | 'projekt';

export interface SiteMenuItem {
	readonly id: SiteMenuItemId;
	readonly href: string;
	/** Trägt einen Kurztext unter dem Titel (Gruppe „Daten und Projekt“ nicht). */
	readonly described: boolean;
}

export interface SiteMenuGroup {
	readonly id: SiteMenuGroupId;
	readonly items: readonly SiteMenuItem[];
}

const KAELTE: SiteMenuItem = { id: 'kaelte', href: '/kaelte', described: true };
const HITZE: SiteMenuItem = { id: 'hitze', href: '/hitze', described: true };

/** Oktober bis März steht Kälte vorn, April bis September Hitze. */
export function seasonOrder(now: Date): ['kaelte', 'hitze'] | ['hitze', 'kaelte'] {
	const month = now.getMonth();
	return month >= 9 || month <= 2 ? ['kaelte', 'hitze'] : ['hitze', 'kaelte'];
}

export function siteMenuGroups(now: Date): readonly SiteMenuGroup[] {
	const seasonal = seasonOrder(now).map((id) => (id === 'kaelte' ? KAELTE : HITZE));
	return [
		{
			id: 'karte',
			items: [
				{ id: 'karte', href: '/explore', described: true },
				{ id: 'finder', href: '/explore?finder=1', described: true }
			]
		},
		{
			id: 'vergleichen',
			items: [
				{ id: 'score', href: '/kiez-score', described: true },
				{ id: 'wahlen', href: '/berlin-wahlen', described: true },
				{ id: 'kieze', href: '/kieze', described: true }
			]
		},
		{ id: 'saison', items: seasonal },
		{
			id: 'projekt',
			items: [
				{ id: 'daten', href: '/daten', described: false },
				{ id: 'methodik', href: '/methodik', described: false },
				{ id: 'stories', href: '/stories', described: false },
				{ id: 'updates', href: '/updates', described: false },
				{ id: 'ueber', href: '/ueber', described: false }
			]
		}
	];
}

/**
 * Ist `href` der aktuelle Bereich? `pathname` kommt ohne Locale-Präfix.
 * Links mit Query (Finder) gelten nie als aktuell, sonst wären Karte und
 * Finder auf /explore gleichzeitig markiert.
 */
export function isCurrentMenuHref(pathname: string, href: string): boolean {
	if (href.includes('?')) return false;
	if (pathname === '/' || pathname === '') return false;
	return pathname === href || pathname.startsWith(`${href}/`);
}
