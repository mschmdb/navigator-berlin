<!--
	Story 2.5b T6: FAQ-Section mit Disclosure-Pattern + FAQPage-JSON-LD.

	Konsument: Bezirks-/Kiez-/Layer-Page (Stories 2.3/2.4/1.29). Daten kommen aus
	`getFaqQna({pageType, slug, locale})` (Story 2.0 Schema, Story 2.5b Befüllung).

	Phase-1 DE-only (Memory `project_i18n_phase_1_de_only`); EN-Fallback +
	TranslationDisclaimer kommen in Phase-3-Future-Epic.

	Progressive-Enhancement: erstes Q&A ist SSR-offen damit Crawler ohne JS die
	Antwort sieht; bits-ui hydratet und toggelt anschließend per User-Click.
-->
<script lang="ts">
	import { Accordion } from 'bits-ui';
	import JsonLd from './json-ld.svelte';
	import { buildFaqPage } from '$lib/seo/jsonld-faqpage.js';
	import type { FaqEntry } from '$lib/data/types.js';

	type PageType = 'bezirk' | 'kiez' | 'layer';

	interface Props {
		readonly items: readonly FaqEntry[];
		readonly pageType: PageType;
		readonly headingLevel?: 2 | 3;
	}

	const { items, pageType, headingLevel = 2 }: Props = $props();
	const faqJsonLd = $derived(
		buildFaqPage({ items: items.map((i) => ({ question: i.question, answer: i.answer })) })
	);
	const initialValue = $derived(items.length > 0 ? 'faq-0' : '');
</script>

{#if items.length > 0}
	<JsonLd data={faqJsonLd} testid="faq-jsonld" />
	<section
		data-testid="faq-section"
		data-page-type={pageType}
		class="mx-auto max-w-prose space-y-6"
		aria-labelledby="faq-heading"
	>
		{#if headingLevel === 2}
			<h2 id="faq-heading" class="font-serif text-2xl text-ink">Häufige Fragen</h2>
		{:else}
			<h3 id="faq-heading" class="font-serif text-xl text-ink">Häufige Fragen</h3>
		{/if}
		<Accordion.Root type="single" value={initialValue} class="divide-y divide-rule border-y border-rule">
			{#each items as item, index (item.question)}
				<Accordion.Item value="faq-{index}">
					<Accordion.Header>
						<Accordion.Trigger
							data-faq-question
							class="flex w-full items-center justify-between gap-4 py-4 text-left font-sans text-base font-semibold text-ink hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
						>
							{item.question}
						</Accordion.Trigger>
					</Accordion.Header>
					<Accordion.Content
						data-faq-answer-index={index}
						class="pb-4 font-sans text-base leading-relaxed text-ink-muted"
					>
						{item.answer}
					</Accordion.Content>
				</Accordion.Item>
			{/each}
		</Accordion.Root>
		{#if pageType === 'kiez' || pageType === 'bezirk'}
			<p class="font-sans text-sm text-ink-muted" data-testid="faq-methodik-link">
				Allgemeine Erklärungen zu den Kennzahlen stehen auf der
				<a class="text-accent underline hover:no-underline" href="/methodik">Methodik-Seite</a>.
			</p>
		{/if}
	</section>
{/if}
