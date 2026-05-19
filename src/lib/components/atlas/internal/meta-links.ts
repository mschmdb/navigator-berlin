/**
 * Shared meta-link source für meta-footer + mobile-hamburger-drawer.
 *
 * Order matters (Reihenfolge wie sie im Footer + Drawer erscheinen).
 *
 * `kontakt` ist mailto, hat keinen href hier — wird in Konsumenten aus
 * `FEEDBACK_EMAIL` zur Laufzeit konstruiert.
 */

export interface MetaLink {
	readonly label: string;
	readonly href: string;
}

export const META_LINKS: readonly MetaLink[] = [
	{ label: 'Wo lebt es sich gut?', href: '/wo-lebt-es-sich-gut' },
	{ label: 'Wahlen', href: '/wahl' },
	{ label: 'Methodik', href: '/methodik' },
	{ label: 'Updates', href: '/updates' },
	{ label: 'Lizenzen', href: '/lizenzen' },
	{ label: 'Datenschutz', href: '/datenschutz' },
	{ label: 'Impressum', href: '/impressum' },
	{ label: 'Architektur', href: '/architektur' },
	{ label: 'WebMCP', href: '/webmcp' }
] as const;
