import { FEEDBACK_EMAIL } from '$lib/utils/contact.js';
import { REPO_URL } from '$lib/seo/jsonld-organization.js';
import { FOUNDER_PROFILE_URLS, FOUNDER_URL } from '$lib/seo/jsonld-person.js';

export interface InternalLink {
	readonly kind: 'internal';
	readonly path: string;
}

export interface ExternalLink {
	readonly kind: 'external';
	readonly url: string;
	/** Sprache des Ziels (`hreflang`), wenn sie von der Seitensprache abweichen kann. */
	readonly hreflang?: 'de' | 'en';
	/** Sprache des Linktexts (`lang`), nur wenn der Text selbst fremdsprachig ist. */
	readonly textLang?: 'de' | 'en';
}

export interface MailLink {
	readonly kind: 'mail';
	readonly url: string;
}

export type UeberLink = InternalLink | ExternalLink | MailLink;

export const UEBER_LINK_NAMES = [
	'methodik',
	'architektur',
	'lizenzen',
	'daten',
	'updates',
	'hitze',
	'kaelte',
	'impressum',
	'datenschutz',
	'site',
	'bluesky',
	'linkedin',
	'mtc',
	'github',
	'talk',
	'taz',
	'mail'
] as const;
export type UeberLinkName = (typeof UEBER_LINK_NAMES)[number];

export function isUeberLinkName(name: string): name is UeberLinkName {
	return (UEBER_LINK_NAMES as readonly string[]).includes(name);
}

/** Folien zum Talk beim Svelte Meetup Berlin (02.09.2026), Quelle: schmidbauer.dev `projects.ts`. */
const TALK_URL = 'https://svelte-meetup.schmidbauer.dev';
/** taz-Artikel zum Hitze-Navigator vom 03.08.2026, Quelle: `_content/updates/2026-08-03-taz-artikel-kuehle-orte.md`. */
const TAZ_URL = 'https://taz.de/Kuehle-Orte-in-Berlin/!6201300/';
/** Arbeitgeber, gleiche URL wie das Partner-Logo im Footer (`mtc-logo.svelte`). */
const MTC_URL = 'https://mtc.berlin';

const internal = (path: string): InternalLink => ({ kind: 'internal', path });

/** Link-Ziele je Platzhalter-Name (`{name_start}…{name_end}`) in den `ueber_*`-Messages. */
export const UEBER_LINKS: Readonly<Record<UeberLinkName, UeberLink>> = {
	methodik: internal('/methodik'),
	architektur: internal('/architektur'),
	lizenzen: internal('/lizenzen'),
	daten: internal('/daten'),
	updates: internal('/updates'),
	hitze: internal('/hitze'),
	kaelte: internal('/kaelte'),
	impressum: internal('/impressum'),
	datenschutz: internal('/datenschutz'),
	site: { kind: 'external', url: FOUNDER_URL },
	bluesky: { kind: 'external', url: FOUNDER_PROFILE_URLS.bluesky },
	linkedin: { kind: 'external', url: FOUNDER_PROFILE_URLS.linkedin },
	mtc: { kind: 'external', url: MTC_URL },
	github: { kind: 'external', url: REPO_URL },
	talk: { kind: 'external', url: TALK_URL, hreflang: 'en', textLang: 'en' },
	taz: { kind: 'external', url: TAZ_URL, hreflang: 'de' },
	mail: { kind: 'mail', url: `mailto:${FEEDBACK_EMAIL}` }
};
