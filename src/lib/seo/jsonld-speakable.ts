import type { WithContext } from 'schema-dts';

/**
 * Story 5.9 AC-6: WebPage + SpeakableSpecification fuer Voice-Search-Agents.
 *
 * Google Assistant, Alexa, Siri bevorzugen Pages mit `speakable`-cssSelector,
 * die einen sprechbaren Q&A-Abschnitt markieren. Wir emittieren das pro Page
 * als separaten WebPage-JSON-LD-Block; das schlaegt Inline-`speakable` auf
 * BlogPosting weil unsere Methodik-Seiten WebPage-Typ sind, nicht Articles.
 */
export interface SpeakableSpecificationLeaf {
	'@type': 'SpeakableSpecification';
	cssSelector: string[];
}

export interface SpeakableWebPageLeafJsonLd {
	'@type': 'WebPage';
	url: string;
	name: string;
	inLanguage: string;
	speakable: SpeakableSpecificationLeaf;
}

export type SpeakableWebPageJsonLd = WithContext<SpeakableWebPageLeafJsonLd>;

export interface SpeakableWebPageInput {
	readonly origin: string;
	readonly urlPath: string;
	readonly name: string;
	readonly cssSelectors: readonly string[];
	readonly inLanguage?: string;
}

function stripTrailingSlash(s: string): string {
	return s.replace(/\/+$/, '');
}

function ensureLeadingSlash(s: string): string {
	return s.startsWith('/') ? s : `/${s}`;
}

export function buildSpeakableWebPage(
	input: SpeakableWebPageInput
): SpeakableWebPageJsonLd {
	if (input.cssSelectors.length === 0) {
		throw new Error('buildSpeakableWebPage: cssSelectors darf nicht leer sein');
	}
	const origin = stripTrailingSlash(input.origin);
	const path = ensureLeadingSlash(input.urlPath);
	return {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		url: `${origin}${path}`,
		name: input.name,
		inLanguage: input.inLanguage ?? 'de-DE',
		speakable: {
			'@type': 'SpeakableSpecification',
			cssSelector: [...input.cssSelectors]
		}
	};
}
