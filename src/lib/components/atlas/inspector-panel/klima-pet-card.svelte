<script lang="ts">
	import type { LayerHit } from '$lib/data';
	import type { NumericMedianAggregate } from '$lib/data/layer-aggregates-types.js';
	import { Eye, EyeOff, ExternalLink, ChevronDown } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { getValueSeverity } from './internal/value-severity-mapping.js';
	import { getLayerExplainEntry, getLayerExternalLink } from './internal/layer-explain.js';
	import { getEditorialConfig } from '../internal/editorial-config.js';
	import DataStandBanner from './data-stand-banner.svelte';
	import EditorialDisclaimer from '../editorial-disclaimer.svelte';
	import ScoreBar from '../charts/score-bar.svelte';

	type Props = {
		hit: LayerHit;
		layerName: string;
		lang?: string;
		isActive?: boolean;
		onToggleLayer?: (slug: string) => void;
		kiezName: string | null;
		kiezAggregate: NumericMedianAggregate | null;
		bezirkName: string | null;
		bezirkAggregate: NumericMedianAggregate | null;
		berlinAggregate: NumericMedianAggregate | null;
	};

	let {
		hit,
		layerName,
		lang = 'de',
		isActive = false,
		onToggleLayer,
		kiezName,
		kiezAggregate,
		bezirkName,
		bezirkAggregate,
		berlinAggregate
	}: Props = $props();

	const fmt = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });

	function petOf(value: unknown): number | null {
		if (value && typeof value === 'object' && 'pet14h' in value) {
			const p = (value as Record<string, unknown>).pet14h;
			if (typeof p === 'number' && Number.isFinite(p)) return p;
		}
		return null;
	}

	const addressPet = $derived(petOf(hit.value));
	const severity = $derived(getValueSeverity('klima-pet-2022', hit.value));
	const scale = $derived(kiezAggregate?.median != null ? kiezAggregate : (berlinAggregate ?? null));

	const contextRows = $derived(
		[
			{ label: kiezName ?? 'Kiez', agg: kiezAggregate },
			{ label: bezirkName ?? 'Bezirk', agg: bezirkAggregate },
			{ label: 'Berlin', agg: berlinAggregate }
		].filter((r): r is { label: string; agg: NumericMedianAggregate } => r.agg?.median != null)
	);

	const explainEntry = $derived(getLayerExplainEntry('klima-pet-2022'));
	const externalLink = $derived(getLayerExternalLink('klima-pet-2022'));
	const editorial = $derived(getEditorialConfig('klima-pet-2022'));
	const learnMoreHref = $derived(
		(resolve as (p: string) => string)(`/${lang}/layer/klima-pet-2022`)
	);

	const SEVERITY_TEXT: Record<string, string> = {
		success: 'text-severity-success',
		'success-soft': 'text-severity-success-soft',
		neutral: 'text-ink',
		warning: 'text-severity-warning',
		danger: 'text-severity-danger'
	};

	let detailsOpen = $state(false);
</script>

<section
	data-testid="klima-pet-card"
	class="-mx-2 rounded border border-rule bg-bg-elevated px-2.5 py-2"
	aria-label={`${layerName} an dieser Adresse und im Umfeld`}
>
	<div class="flex items-start justify-between gap-2">
		<h4 class="min-w-0 font-sans text-sm font-semibold text-ink">{layerName}</h4>
		{#if addressPet !== null}
			<span
				data-testid="pet-address-value"
				class={`shrink-0 font-mono text-lg leading-none tabular-nums ${SEVERITY_TEXT[severity] ?? 'text-ink'}`}
			>
				{fmt.format(addressPet)}<span class="text-xs">°C</span>
			</span>
		{/if}
	</div>

	{#if addressPet !== null && scale?.median != null && scale.min != null && scale.max != null}
		<div class="mt-2">
			<ScoreBar
				value={addressPet}
				min={scale.min}
				max={scale.max}
				anchorValue={scale.median}
				anchorLabel="Median"
				unit="°C"
				{severity}
				layerName={`${layerName} im Kiez-Kontext`}
			/>
		</div>
	{/if}

	{#if addressPet === null && contextRows.length > 0}
		<p data-testid="pet-no-point-value" class="mt-2 font-serif text-xs text-ink-subtle italic">
			An dieser Stelle kein direkter Messwert · Werte im Umfeld:
		</p>
	{/if}

	{#if contextRows.length > 0}
		<dl class="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-xs">
			{#each contextRows as row (row.label)}
				<dt class="truncate text-ink-muted">{row.label}</dt>
				<dd class="text-right font-mono text-ink tabular-nums">
					{fmt.format(row.agg.median as number)}°C
					<span class="text-ink-subtle"
						>· {fmt.format(row.agg.min as number)}–{fmt.format(row.agg.max as number)}</span
					>
				</dd>
			{/each}
		</dl>
	{/if}

	<div class="mt-2 flex items-center justify-between gap-2">
		<button
			type="button"
			data-testid="pet-details-toggle"
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
					aria-label={isActive
						? `${layerName} von Karte entfernen`
						: `${layerName} auf Karte zeigen`}
					title={isActive ? 'Von Karte entfernen' : 'Auf Karte zeigen'}
					onclick={() => onToggleLayer?.('klima-pet-2022')}
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
		<div data-testid="pet-details" class="mt-1.5 space-y-1.5">
			<p class="font-serif text-xs leading-snug text-ink-muted">{explainEntry.long}</p>
			{#if externalLink}
				<a
					href={externalLink.href}
					target="_blank"
					rel="noopener noreferrer"
					class="hover:text-accent-strong inline-flex w-fit items-center gap-1 font-sans text-xs text-accent underline underline-offset-2"
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
