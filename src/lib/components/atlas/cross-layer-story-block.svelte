<script lang="ts">
	import EditorialDisclaimer from './editorial-disclaimer.svelte';
	import type { RenderedTemplate } from '$lib/data/cross-layer-templates/index.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';

	type SourceRef = {
		readonly label: string;
		readonly url?: string;
		readonly license?: string;
	};

	// `rendered.body` liefert der Aufrufer bereits in der Seiten-Locale
	// (`renderTemplate(..., { locale })`). Rahmen, Hinweis und Body teilen damit
	// eine Sprache, ein eigenes `lang` entfällt (i18n C4a).
	type Props = {
		rendered: RenderedTemplate;
		sources: ReadonlyArray<SourceRef>;
		methodikHref?: string;
		methodikLinkLabel?: string;
		testid?: string;
	};

	let {
		rendered,
		sources,
		methodikHref = localizedHref('/methodik'),
		methodikLinkLabel = m.cross_layer_story_methodik_link_label(),
		testid = 'cross-layer-story-block'
	}: Props = $props();

	const hasMissing = $derived(rendered.missingVars.length > 0);
</script>

{#if !hasMissing}
	<section
		class="space-y-3 border-l-2 border-rule pl-3"
		data-testid={testid}
		data-template-id={rendered.id}
	>
		<p class="font-serif text-base leading-relaxed text-ink" data-testid={`${testid}-body`}>
			{rendered.body}
		</p>

		{#if sources.length > 0}
			<ul
				class="space-y-0.5 font-mono text-[10px] tracking-wide text-ink-muted uppercase"
				data-testid={`${testid}-sources`}
				aria-label={m.cross_layer_story_sources_aria_label()}
			>
				{#each sources as src, i (i)}
					<li>
						{#if src.url}
							<a
								href={src.url}
								class="underline-offset-2 hover:text-ink hover:underline"
								rel="noopener"
							>
								{src.label}
							</a>
						{:else}
							<span>{src.label}</span>
						{/if}
						{#if src.license}
							· {m.cross_layer_story_license_prefix()} {src.license}
						{/if}
					</li>
				{/each}
			</ul>
		{/if}

		<EditorialDisclaimer variant="cross-layer-template" />

		<a
			href={methodikHref}
			class="hover:text-accent-strong inline-block font-mono text-xs text-accent underline underline-offset-2"
			data-testid={`${testid}-methodik-link`}
		>
			{methodikLinkLabel}
		</a>
	</section>
{/if}
