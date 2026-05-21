<script lang="ts" module>
	export interface ContextRow {
		label: string;
		text: string;
	}
</script>

<script lang="ts">
	import type { LayerHit } from '$lib/data';
	import { Eye, EyeOff, ExternalLink, ChevronDown } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { getLayerHitDisplay } from './internal/layer-hit-display.js';
	import { getValueSeverity } from './internal/value-severity-mapping.js';
	import { getLayerExplainEntry, getLayerExternalLink } from './internal/layer-explain.js';
	import { getEditorialConfig } from '../internal/editorial-config.js';
	import DataStandBanner from './data-stand-banner.svelte';
	import EditorialDisclaimer from '../editorial-disclaimer.svelte';
	import ValueChip from '../value-chip.svelte';

	type Props = {
		hit: LayerHit;
		layerName: string;
		lang?: string;
		isActive?: boolean;
		onToggleLayer?: (slug: string) => void;
		/** Vom Parent vorgebaute Umfeld-Zeilen (Kiez/Bezirk/Berlin), aggregat-typ-agnostisch. */
		contextRows?: readonly ContextRow[];
	};

	let {
		hit,
		layerName,
		lang = 'de',
		isActive = false,
		onToggleLayer,
		contextRows = []
	}: Props = $props();

	const display = $derived(getLayerHitDisplay(hit.layer, hit.value));
	const severity = $derived(getValueSeverity(hit.layer, hit.value));
	const explainEntry = $derived(getLayerExplainEntry(hit.layer));
	const externalLink = $derived(getLayerExternalLink(hit.layer));
	const editorial = $derived(getEditorialConfig(hit.layer));
	const learnMoreHref = $derived((resolve as (p: string) => string)(`/${lang}/layer/${hit.layer}`));

	let detailsOpen = $state(false);
</script>

<section
	data-testid="layer-card"
	data-layer={hit.layer}
	class="-mx-2 rounded border border-rule bg-bg-elevated px-2.5 py-2"
	aria-label={`${layerName} an dieser Adresse und im Umfeld`}
>
	<div class="flex items-start justify-between gap-2">
		<h4 class="min-w-0 font-sans text-sm font-semibold text-ink">{layerName}</h4>
		<div class="shrink-0">
			{#if display.chip}
				<ValueChip
					{severity}
					value={display.chip.value}
					unit={display.chip.unit}
					numeric={display.chip.numeric}
					{layerName}
					compact
				/>
			{:else}
				<span class="font-serif text-sm italic text-ink-subtle"
					>{display.fallbackText ?? 'k. A.'}</span
				>
			{/if}
		</div>
	</div>

	{#if display.context}
		<p class="mt-1 font-sans text-xs text-ink-muted">{display.context}</p>
	{/if}

	{#if contextRows.length > 0}
		<dl class="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
			{#each contextRows as row (row.label)}
				<dt class="truncate text-ink-muted">{row.label}</dt>
				<dd class="text-right text-ink">{row.text}</dd>
			{/each}
		</dl>
	{/if}

	<div class="mt-2 flex items-center justify-between gap-2">
		<button
			type="button"
			data-testid="card-details-toggle"
			aria-expanded={detailsOpen}
			onclick={() => (detailsOpen = !detailsOpen)}
			class="inline-flex items-center gap-1 font-mono text-[11px] text-ink-subtle hover:text-ink"
		>
			<ChevronDown
				size={12}
				aria-hidden="true"
				class={detailsOpen ? 'rotate-180 transition-transform' : 'transition-transform'}
			/>
			Quelle &amp; Details
		</button>
		<div class="flex shrink-0 items-center gap-1">
			{#if onToggleLayer}
				<button
					type="button"
					data-testid="map-toggle"
					aria-pressed={isActive}
					aria-label={isActive ? `${layerName} von Karte entfernen` : `${layerName} auf Karte zeigen`}
					title={isActive ? 'Von Karte entfernen' : 'Auf Karte zeigen'}
					onclick={() => onToggleLayer?.(hit.layer)}
					class={`inline-flex h-6 w-6 items-center justify-center rounded-sm hover:bg-bg ${isActive ? 'text-accent' : 'text-ink-subtle hover:text-ink'}`}
				>
					{#if isActive}<EyeOff size={14} aria-hidden="true" />{:else}<Eye
							size={14}
							aria-hidden="true"
						/>{/if}
				</button>
			{/if}
			<a
				href={learnMoreHref}
				data-testid="learn-more"
				aria-label={`Mehr über ${layerName}`}
				title="Layer-Details"
				class="inline-flex h-6 w-6 items-center justify-center rounded-sm text-ink-subtle hover:bg-bg hover:text-ink"
			>
				<ExternalLink size={13} aria-hidden="true" />
			</a>
		</div>
	</div>
	{#if detailsOpen}
		<div data-testid="card-details" class="mt-1.5 space-y-1.5">
			<p class="font-serif text-xs leading-snug text-ink-muted">{explainEntry.long}</p>
			{#if externalLink}
				<a
					href={externalLink.href}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex w-fit items-center gap-1 font-sans text-xs text-accent underline underline-offset-2 hover:text-accent-strong"
				>
					<ExternalLink size={12} aria-hidden="true" />
					{externalLink.label}
				</a>
			{/if}
			<DataStandBanner {hit} />
			{#each editorial?.disclaimerVariants ?? [] as variant (variant)}
				<EditorialDisclaimer {variant} sourceUrl={editorial?.primarySourceUrl} />
			{/each}
		</div>
	{/if}
</section>
