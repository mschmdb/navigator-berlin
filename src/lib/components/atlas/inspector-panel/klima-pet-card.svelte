<script lang="ts">
	import type { LayerHit } from '$lib/data';
	import type { NumericMedianAggregate } from '$lib/data/layer-aggregates-types.js';
	import { Eye, EyeOff, ExternalLink, ChevronDown } from '@lucide/svelte';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, type Locale } from '$lib/paraglide/runtime';
	import { formatDecimal } from '$lib/i18n/format.js';
	import { getValueSeverity } from './internal/value-severity-mapping.js';
	import { getLayerExplainEntry, getLayerExternalLink } from './internal/layer-explain.js';
	import { getEditorialConfig } from '../internal/editorial-config.js';
	import DataStandBanner from './data-stand-banner.svelte';
	import EditorialDisclaimer from '../editorial-disclaimer.svelte';
	import ScoreBar from '../charts/score-bar.svelte';

	type Props = {
		hit: LayerHit;
		layerName: string;
		lang?: Locale;
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
		lang,
		isActive = false,
		onToggleLayer,
		kiezName,
		kiezAggregate,
		bezirkName,
		bezirkAggregate,
		berlinAggregate
	}: Props = $props();

	const locale = $derived(lang ?? getLocale());
	const localeOpts = $derived({ locale });

	function fmt(n: number): string {
		return formatDecimal(n, { ...localeOpts, maximumFractionDigits: 1 });
	}

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

	// Fallback-Labels teilen sich dieselben Keys wie `inspector-panel.svelte`s
	// `contextRowsFor` (Review-Fund: vormals eigene 'Kiez'/'Bezirk'/'Berlin'-
	// Literale statt derselben Message-Quelle).
	const contextRows = $derived(
		[
			{
				id: 'kiez',
				label: kiezName ?? m.inspector_context_row_kiez_fallback(undefined, localeOpts),
				agg: kiezAggregate
			},
			{
				id: 'bezirk',
				label: bezirkName ?? m.inspector_context_row_bezirk_fallback(undefined, localeOpts),
				agg: bezirkAggregate
			},
			{ id: 'berlin', label: m.inspector_context_row_berlin(undefined, localeOpts), agg: berlinAggregate }
		].filter(
			(r): r is { id: string; label: string; agg: NumericMedianAggregate } => r.agg?.median != null
		)
	);

	const explainEntry = $derived(getLayerExplainEntry('klima-pet-2022'));
	const externalLink = $derived(getLayerExternalLink('klima-pet-2022'));
	const editorial = $derived(getEditorialConfig('klima-pet-2022'));
	const learnMoreHref = $derived(localizedHref('/layer/klima-pet-2022', locale));

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
	aria-label={m.inspector_klima_pet_aria_label({ layerName }, localeOpts)}
>
	<div class="flex items-start justify-between gap-2">
		<h4 class="min-w-0 font-sans text-sm font-semibold text-ink">{layerName}</h4>
		{#if addressPet !== null}
			<span
				data-testid="pet-address-value"
				class={`shrink-0 font-mono text-lg leading-none tabular-nums ${SEVERITY_TEXT[severity] ?? 'text-ink'}`}
			>
				{fmt(addressPet)}<span class="text-xs">°C</span>
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
				anchorLabel={m.inspector_score_bar_anchor_median(undefined, localeOpts)}
				valueLabel={m.inspector_score_bar_value_label(undefined, localeOpts)}
				unit="°C"
				{severity}
				layerName={m.inspector_klima_pet_kiez_context_label({ layerName }, localeOpts)}
			/>
		</div>
	{/if}

	{#if addressPet === null && contextRows.length > 0}
		<p data-testid="pet-no-point-value" class="mt-2 font-serif text-xs text-ink-subtle italic">
			{m.inspector_klima_pet_no_point_value(undefined, localeOpts)}
		</p>
	{/if}

	{#if contextRows.length > 0}
		<dl class="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-xs">
			{#each contextRows as row (row.id)}
				<dt class="truncate text-ink-muted">{row.label}</dt>
				<dd class="text-right font-mono text-ink tabular-nums">
					{fmt(row.agg.median as number)}°C
					<span class="text-ink-subtle">· {fmt(row.agg.min as number)}–{fmt(row.agg.max as number)}</span>
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
			{m.inspector_common_details_toggle(undefined, localeOpts)}
		</button>
		<div class="flex shrink-0 items-center gap-1">
			{#if onToggleLayer}
				<button
					type="button"
					data-testid="map-toggle"
					aria-pressed={isActive}
					aria-label={isActive
						? m.inspector_klima_pet_map_toggle_remove({ layerName }, localeOpts)
						: m.inspector_klima_pet_map_toggle_add({ layerName }, localeOpts)}
					title={isActive
						? m.inspector_common_map_toggle_remove_title(undefined, localeOpts)
						: m.inspector_common_map_toggle_add_title(undefined, localeOpts)}
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
				aria-label={m.inspector_klima_pet_learn_more_aria({ layerName }, localeOpts)}
				title={m.inspector_common_learn_more_title(undefined, localeOpts)}
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
			<DataStandBanner {hit} lang={locale} />
			{#each editorial?.disclaimerVariants ?? [] as variant (variant)}
				<EditorialDisclaimer {variant} sourceUrl={editorial?.primarySourceUrl} />
			{/each}
		</div>
	{/if}
</section>
