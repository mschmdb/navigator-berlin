<!--
	GH-88: Quelle, Stand, Lizenz und Erklärung einmal pro Sektion statt „Quelle & Details" an
	jedem Datensatz. Die Quelle hängt am Datensatz-Typ, nicht an der Adresse. Lizenz-Angaben
	bleiben so im Inspector erreichbar.
-->
<script lang="ts">
	import type { LayerHit } from '$lib/data';
	import { ChevronDown, ExternalLink } from '@lucide/svelte';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, type Locale } from '$lib/paraglide/runtime';
	import DataStandBanner from './data-stand-banner.svelte';
	import EditorialDisclaimer from '../editorial-disclaimer.svelte';
	import { getLayerExplainEntry, getLayerExternalLink } from './internal/layer-explain.js';
	import { getEditorialConfig } from '../internal/editorial-config.js';

	type Props = {
		sectionLabel: string;
		hits: readonly LayerHit[];
		layerNameFor: (slug: string) => string;
		lang?: Locale;
	};
	let { sectionLabel, hits, layerNameFor, lang }: Props = $props();

	const locale = $derived(lang ?? getLocale());
	const localeOpts = $derived({ locale });
	const regionId = `section-sources-${crypto.randomUUID()}`;
	let open = $state(false);

	/** Hostname einer http(s)-Quelle, sonst null (kein Link auf leere oder interne Quellen). */
	function sourceHost(source: string): string | null {
		try {
			const url = new URL(source);
			return url.protocol === 'https:' || url.protocol === 'http:' ? url.hostname : null;
		} catch {
			return null;
		}
	}

	type Variants = NonNullable<ReturnType<typeof getEditorialConfig>>['disclaimerVariants'];

	function disclaimersFor(hit: LayerHit): Variants {
		const editorial = getEditorialConfig(hit.layer);
		if (!editorial) return [];
		// Saison-Hinweis nur, wenn der Datensatz gerade außer Saison ist (wie bisher pro Zeile).
		return editorial.disclaimerVariants.filter(
			(v) => v !== 'seasonal' || hit.reason === 'seasonal'
		);
	}
</script>

{#if hits.length > 0}
	<div data-testid="section-sources" class="pt-1">
		<button
			type="button"
			data-testid="section-sources-toggle"
			aria-expanded={open}
			aria-controls={regionId}
			onclick={() => (open = !open)}
			class="inline-flex min-h-(--target-min) items-center gap-1 text-dense-label text-ink-muted hover:text-ink"
		>
			<ChevronDown
				size={12}
				aria-hidden="true"
				class={open ? 'rotate-180 transition-transform' : 'transition-transform'}
			/>
			{m.inspector_section_sources_toggle({ section: sectionLabel }, localeOpts)}
		</button>
		{#if open}
			<ul id={regionId} class="mt-1 divide-y divide-rule">
				{#each hits as hit (hit.layer)}
					{@const explain = getLayerExplainEntry(hit.layer, localeOpts)}
					{@const external = getLayerExternalLink(hit.layer, localeOpts)}
					{@const editorial = getEditorialConfig(hit.layer)}
					{@const host = sourceHost(hit.source)}
					<li data-testid="section-sources-item" data-layer={hit.layer} class="space-y-1 py-2">
						<a
							href={localizedHref(`/layer/${hit.layer}`, locale)}
							class="inline-flex min-h-(--target-min) items-center text-dense-value font-semibold text-ink underline-offset-2 hover:underline"
						>
							{layerNameFor(hit.layer)}
						</a>
						{#if explain.long}
							<p data-testid="explain-long" class="text-dense-label leading-snug text-ink-muted">
								{explain.long}
							</p>
						{/if}
						{#if explain.valueScaleExplain}
							<p data-testid="explain-scale" class="text-dense-meta text-ink-subtle">
								{explain.valueScaleExplain}
							</p>
						{/if}
						<!-- Externer Link (z. B. Mietspiegel-Rechner) nur, wenn der Datensatz hier einen Wert hat. -->
						{#if external && !hit.reason}
							<a
								data-testid="external-link"
								href={external.href}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex min-h-(--target-min) w-fit items-center gap-1 text-dense-label text-accent underline underline-offset-2 hover:text-accent-strong"
							>
								<ExternalLink size={12} aria-hidden="true" />
								{external.label}
							</a>
						{/if}
						<DataStandBanner {hit} lang={locale} />
						{#if host}
							<a
								data-testid="section-sources-source-link"
								href={hit.source}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex min-h-(--target-min) w-fit items-center text-dense-meta text-accent underline underline-offset-2 hover:text-accent-strong"
							>
								{m.inspector_data_stand_source_info({ hostname: host }, localeOpts)}
							</a>
						{/if}
						{#each disclaimersFor(hit) as variant (variant)}
							<EditorialDisclaimer {variant} sourceUrl={editorial?.primarySourceUrl} {locale} />
						{/each}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
{/if}
