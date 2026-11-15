<!--
	Häufige Fragen am Seitenende, nach Kapiteln geordnet. Jede Antwort verweist auf ihr Kapitel.
	Natives details/summary: Tastatur und Screenreader ohne Zusatzcode. JSON-LD wie heute.
-->
<script lang="ts">
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import { buildFaqPage } from '$lib/seo/jsonld-faqpage.js';
	import type { FaqItemWithChapter } from '../faq';

	let { items }: { items: readonly FaqItemWithChapter[] } = $props();
	const jsonLd = $derived(buildFaqPage({ items }));
</script>

{#if items.length > 0}
	<JsonLd data={jsonLd} testid="skizze-faq-jsonld" />
	<section id="fragen" aria-labelledby="fragen-h" class="scroll-mt-28 border-t border-rule py-12">
		<h2 id="fragen-h" class="text-xl font-semibold text-ink">Häufige Fragen</h2>
		<div class="mt-4 flex max-w-3xl flex-col">
			{#each items as item, i (i)}
				<details class="group border-b border-rule py-3">
					<summary
						class="cursor-pointer list-none text-base font-medium text-ink marker:hidden focus-visible:outline-2 focus-visible:outline-focus"
					>
						<span
							class="mr-2 inline-block text-ink-subtle transition-transform group-open:rotate-90"
							>›</span
						>{item.question}
					</summary>
					<p class="mt-2 text-base leading-body text-ink-muted">{item.answer}</p>
					{#if item.chapter}
						<p class="mt-1 text-sm">
							<a class="text-accent underline" href="#{item.chapter.id}"
								>Mehr dazu: {item.chapter.title}</a
							>
						</p>
					{/if}
				</details>
			{/each}
		</div>
	</section>
{/if}
