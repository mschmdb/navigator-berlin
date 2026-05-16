import type { WithContext } from 'schema-dts';

/**
 * Story 2.2 T3.5: FAQPage-JSON-LD.
 *
 * Konsumenten: Story 2.5b (FAQ-Section-Template). Generator nimmt
 * Plain-Question-Answer-Paare und liefert das Schema.org-konforme Constructor-
 * Pattern (Question + acceptedAnswer Answer.text).
 */
export interface FaqItem {
	readonly question: string;
	readonly answer: string;
}

export interface FaqPageInput {
	readonly items: readonly FaqItem[];
}

export interface FaqAnswerJsonLd {
	'@type': 'Answer';
	text: string;
}

export interface FaqQuestionJsonLd {
	'@type': 'Question';
	name: string;
	acceptedAnswer: FaqAnswerJsonLd;
}

export interface FaqPageLeafJsonLd {
	'@type': 'FAQPage';
	mainEntity: FaqQuestionJsonLd[];
}

export type FaqPageJsonLd = WithContext<FaqPageLeafJsonLd>;

export function buildFaqPage(input: FaqPageInput): FaqPageJsonLd {
	const mainEntity: FaqQuestionJsonLd[] = input.items.map((item) => ({
		'@type': 'Question',
		name: item.question,
		acceptedAnswer: {
			'@type': 'Answer',
			text: item.answer
		}
	}));
	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity
	};
}
