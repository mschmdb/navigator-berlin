/**
 * Shared meta-link source für meta-footer + mobile-hamburger-drawer.
 *
 * META_LINKS = flache Liste (Drawer + Compact-Footer auf /explore).
 * META_LINK_GROUPS = gruppierte Struktur für den vollen Footer.
 *
 * `kontakt` ist mailto, hat keinen href hier, wird in Konsumenten aus
 * `FEEDBACK_EMAIL` zur Laufzeit konstruiert.
 *
 * i18n Block B2: `label`/`title` sind keine Modul-Konstanten mehr, sondern
 * `id`-Datenschlüssel (Boundary: „Meta-Link-Gruppen bekommen eine feste id,
 * Kontakt-Link hängt heute an title === 'Sonstiges'"). `metaLinkLabel()`/
 * `metaLinkGroupTitle()` lösen den Anzeige-Text locale-abhängig über
 * Paraglide-Messages auf, ausgewertet beim Aufruf statt beim Modul-Import.
 */
import { m } from '$lib/paraglide/messages.js';
import { toMessageOptions, assertUnreachable, type LocaleOptions } from '$lib/i18n/message-options.js';

export const META_LINK_IDS = [
	'atlas',
	'score',
	'wahlen',
	'hitze',
	'methodik',
	'updates',
	'lizenzen',
	'datenschutz',
	'impressum',
	'architektur',
	'webmcp'
] as const;
export type MetaLinkId = (typeof META_LINK_IDS)[number];

export const META_LINK_GROUP_IDS = ['erkunden', 'transparenz', 'sonstiges'] as const;
export type MetaLinkGroupId = (typeof META_LINK_GROUP_IDS)[number];

export interface MetaLink {
	readonly id: MetaLinkId;
	readonly href: string;
}

export interface MetaLinkGroup {
	readonly id: MetaLinkGroupId;
	readonly links: readonly MetaLink[];
}

export const META_LINKS: readonly MetaLink[] = [
	{ id: 'score', href: '/umwelt-infrastruktur-score' },
	{ id: 'wahlen', href: '/berlin-wahlen' },
	{ id: 'hitze', href: '/hitze' },
	{ id: 'methodik', href: '/methodik' },
	{ id: 'updates', href: '/updates' },
	{ id: 'lizenzen', href: '/lizenzen' },
	{ id: 'datenschutz', href: '/datenschutz' },
	{ id: 'impressum', href: '/impressum' },
	{ id: 'architektur', href: '/architektur' },
	{ id: 'webmcp', href: '/webmcp' }
] as const;

export const META_LINK_GROUPS: readonly MetaLinkGroup[] = [
	{
		id: 'erkunden',
		links: [
			{ id: 'atlas', href: '/explore' },
			{ id: 'score', href: '/umwelt-infrastruktur-score' },
			{ id: 'wahlen', href: '/berlin-wahlen' },
			{ id: 'hitze', href: '/hitze' }
		]
	},
	{
		id: 'transparenz',
		links: [
			{ id: 'methodik', href: '/methodik' },
			{ id: 'lizenzen', href: '/lizenzen' },
			{ id: 'architektur', href: '/architektur' },
			{ id: 'webmcp', href: '/webmcp' }
		]
	},
	{
		id: 'sonstiges',
		links: [
			{ id: 'updates', href: '/updates' },
			{ id: 'datenschutz', href: '/datenschutz' },
			{ id: 'impressum', href: '/impressum' }
		]
	}
] as const;

/** Anzeige-Label für einen Meta-Link, aufgelöst über die Paraglide-Message
 * dieser `id` (Datenschlüssel bleibt `id`, der `href` bleibt unübersetzt). */
export function metaLinkLabel(id: MetaLinkId, o?: LocaleOptions): string {
	const options = toMessageOptions(o);
	switch (id) {
		case 'atlas':
			return m.shell_meta_link_atlas(undefined, options);
		case 'score':
			return m.shell_meta_link_score(undefined, options);
		case 'wahlen':
			return m.shell_meta_link_wahlen(undefined, options);
		case 'hitze':
			return m.shell_meta_link_hitze(undefined, options);
		case 'methodik':
			return m.shell_meta_link_methodik(undefined, options);
		case 'updates':
			return m.shell_meta_link_updates(undefined, options);
		case 'lizenzen':
			return m.shell_meta_link_lizenzen(undefined, options);
		case 'datenschutz':
			return m.shell_meta_link_datenschutz(undefined, options);
		case 'impressum':
			return m.shell_meta_link_impressum(undefined, options);
		case 'architektur':
			return m.shell_meta_link_architektur(undefined, options);
		case 'webmcp':
			return m.shell_meta_link_webmcp(undefined, options);
		default:
			return assertUnreachable(id);
	}
}

/** Anzeige-Titel einer Meta-Link-Gruppe, aufgelöst über die Paraglide-Message
 * dieser `id` (der bisherige `group.title === 'Sonstiges'`-Vergleich in den
 * Konsumenten läuft jetzt gegen `group.id === 'sonstiges'`). */
export function metaLinkGroupTitle(id: MetaLinkGroupId, o?: LocaleOptions): string {
	const options = toMessageOptions(o);
	switch (id) {
		case 'erkunden':
			return m.shell_meta_group_erkunden(undefined, options);
		case 'transparenz':
			return m.shell_meta_group_transparenz(undefined, options);
		case 'sonstiges':
			return m.shell_meta_group_sonstiges(undefined, options);
		default:
			return assertUnreachable(id);
	}
}
