<script lang="ts">
	import EditorialDisclaimer from './editorial-disclaimer.svelte';
	import type { RenderedTemplate } from '$lib/data/cross-layer-templates/index.js';

	type SourceRef = {
		readonly label: string;
		readonly url?: string;
		readonly license?: string;
	};

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
		methodikHref = '/methodik',
		methodikLinkLabel = 'Methodik',
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
				class="font-mono text-[10px] uppercase tracking-wide text-ink-muted space-y-0.5"
				data-testid={`${testid}-sources`}
				aria-label="Quellen für diese Beobachtung"
			>
				{#each sources as src, i (i)}
					<li>
						{#if src.url}
							<a href={src.url} class="hover:text-ink underline-offset-2 hover:underline" rel="noopener">
								{src.label}
							</a>
						{:else}
							<span>{src.label}</span>
						{/if}
						{#if src.license}
							· Lizenz {src.license}
						{/if}
					</li>
				{/each}
			</ul>
		{/if}

		<EditorialDisclaimer variant="cross-layer-template" />

		<a
			href={methodikHref}
			class="inline-block font-mono text-xs text-accent underline underline-offset-2 hover:text-accent-strong"
			data-testid={`${testid}-methodik-link`}
		>
			{methodikLinkLabel}
		</a>
	</section>
{/if}
