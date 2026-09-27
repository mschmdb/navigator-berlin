<script lang="ts">
	import { page } from '$app/state';
	import EditorialDisclaimer from './editorial-disclaimer.svelte';
	import type { RenderedTemplate } from '$lib/data/cross-layer-templates/index.js';
	import { resolveEffectiveLocale } from '$lib/seo/effective-locale.js';

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
		/** Pathname used to resolve the effective content locale. Defaults to
		 * the current route (`page.url.pathname`) -- an explicit prop keeps the
		 * component testable without a real SvelteKit route context (same
		 * pattern as `SeoHead`'s `pathname` prop). */
		pathname?: string;
	};

	let {
		rendered,
		sources,
		methodikHref = '/methodik',
		methodikLinkLabel = 'Methodik',
		testid = 'cross-layer-story-block',
		pathname
	}: Props = $props();

	const hasMissing = $derived(rendered.missingVars.length > 0);
	// spec-i18n-teiluebersetzung-banner.md: `rendered.body` (Template-Prosa)
	// bleibt bis Block C deutsch. Review-Fund (i18n Block C1): diese
	// Komponente rendert auf `/methodik/cross-layer-templates`, einer NICHT
	// registrierten Seite -- die Content-Locale ist dort immer die effektive
	// Locale (`resolveEffectiveLocale`, faellt fuer unregistrierte Pfade auf
	// DE zurueck), nicht die URL-Locale (`getLocale()`). Auf `/en/methodik/
	// cross-layer-templates` waere `getLocale() === 'en'`, obwohl der Content
	// (Rahmen UND `EditorialDisclaimer`) tatsaechlich deutsch bleibt.
	const effectiveLocale = $derived(resolveEffectiveLocale(pathname ?? page.url.pathname));
	const contentLang = $derived(effectiveLocale === 'de' ? undefined : 'de');
</script>

{#if !hasMissing}
	<section
		class="space-y-3 border-l-2 border-rule pl-3"
		data-testid={testid}
		data-template-id={rendered.id}
	>
		<p
			lang={contentLang}
			class="font-serif text-base leading-relaxed text-ink"
			data-testid={`${testid}-body`}
		>
			{rendered.body}
		</p>

		{#if sources.length > 0}
			<ul
				class="space-y-0.5 font-mono text-[10px] tracking-wide text-ink-muted uppercase"
				data-testid={`${testid}-sources`}
				aria-label="Quellen für diese Beobachtung"
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
							· Lizenz {src.license}
						{/if}
					</li>
				{/each}
			</ul>
		{/if}

		<EditorialDisclaimer variant="cross-layer-template" locale={effectiveLocale} />

		<a
			href={methodikHref}
			class="hover:text-accent-strong inline-block font-mono text-xs text-accent underline underline-offset-2"
			data-testid={`${testid}-methodik-link`}
		>
			{methodikLinkLabel}
		</a>
	</section>
{/if}
