/**
 * Shared meta-link source für meta-footer + mobile-hamburger-drawer.
 *
 * META_LINKS = flache Liste (Drawer + Compact-Footer auf /explore).
 * META_LINK_GROUPS = gruppierte Struktur für den vollen Footer.
 *
 * `kontakt` ist mailto, hat keinen href hier, wird in Konsumenten aus
 * `FEEDBACK_EMAIL` zur Laufzeit konstruiert.
 */

export interface MetaLink {
	readonly label: string;
	readonly href: string;
}

export interface MetaLinkGroup {
	readonly title: string;
	readonly links: readonly MetaLink[];
}

export const META_LINKS: readonly MetaLink[] = [
	{ label: 'Umwelt- & Infrastruktur-Score', href: '/umwelt-infrastruktur-score' },
	{ label: 'Wahlen', href: '/wahl' },
	{ label: 'Kühle Orte bei Hitze', href: '/hitze' },
	{ label: 'Methodik', href: '/methodik' },
	{ label: 'Updates', href: '/updates' },
	{ label: 'Lizenzen', href: '/lizenzen' },
	{ label: 'Datenschutz', href: '/datenschutz' },
	{ label: 'Impressum', href: '/impressum' },
	{ label: 'Architektur', href: '/architektur' },
	{ label: 'WebMCP', href: '/webmcp' }
] as const;

export const META_LINK_GROUPS: readonly MetaLinkGroup[] = [
	{
		title: 'Erkunden',
		links: [
			{ label: 'Atlas', href: '/explore' },
			{ label: 'Umwelt- & Infrastruktur-Score', href: '/umwelt-infrastruktur-score' },
			{ label: 'Wahlen', href: '/wahl' },
			{ label: 'Kühle Orte bei Hitze', href: '/hitze' }
		]
	},
	{
		title: 'Transparenz',
		links: [
			{ label: 'Methodik', href: '/methodik' },
			{ label: 'Lizenzen', href: '/lizenzen' },
			{ label: 'Architektur', href: '/architektur' },
			{ label: 'WebMCP', href: '/webmcp' }
		]
	},
	{
		title: 'Sonstiges',
		links: [
			{ label: 'Updates', href: '/updates' },
			{ label: 'Datenschutz', href: '/datenschutz' },
			{ label: 'Impressum', href: '/impressum' }
		]
	}
] as const;
