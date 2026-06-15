<script lang="ts">
	import { X, ArrowLeftRight, Search, Bookmark } from '@lucide/svelte';
	import type { GeocodeSuggestion, LayerMetadata } from '$lib/data';
	import {
		getUiState,
		exitCompareMode,
		setComparisonAddress
	} from '$lib/state/ui-context.svelte.js';
	import { mergeCompareSections, type CompareSection } from './internal/merge-sections.js';
	import { getLayerDisplayName } from '../internal/layer-palette-filter.js';
	import CompareRow from './compare-row.svelte';
	import KiezScoreCompareBlock from './kiez-score-compare-block.svelte';
	import WahlCompareBlock from './wahl-compare-block.svelte';
	import AddressSearch from '../address-search.svelte';
	import EditorialDisclaimer from '../editorial-disclaimer.svelte';
	import { featureFlags } from '$lib/data/feature-flags.js';
	import type { DisclaimerVariant } from '../internal/editorial-types.js';

	type GeocodeFn = (q: string) => Promise<GeocodeSuggestion[]>;

	type Props = {
		layerMeta?: readonly LayerMetadata[];
		geocode?: GeocodeFn;
		onOpenBookmarkPicker?: () => void;
	};

	let { layerMeta = [], geocode, onOpenBookmarkPicker }: Props = $props();

	const ui = getUiState();

	const sections: CompareSection[] = $derived(
		mergeCompareSections(ui.selectedLayerHits, ui.comparisonLayerHits, layerMeta)
	);

	const hasAnyRows = $derived(sections.some((s) => s.rows.length > 0));

	let activeTab = $state<'a' | 'b'>('a');

	function exit(): void {
		exitCompareMode(ui);
	}

	function pickAddressB(suggestion: GeocodeSuggestion): void {
		setComparisonAddress(ui, suggestion);
	}

	function getSectionDisclaimers(section: CompareSection): DisclaimerVariant[] {
		const variants = new Set<DisclaimerVariant>();
		for (const row of section.rows) {
			if (row.slug === 'stolpersteine') variants.add('compare-stolperstein');
			if (row.slug === 'mietspiegel-wohnlage' || row.slug === 'wohnlagen-2024')
				variants.add('compare-mietspiegel');
			if (row.slug === 'bodenrichtwerte') variants.add('compare-bodenrichtwerte');
		}
		return [...variants];
	}
</script>

{#if ui.compareMode && ui.selectedAddress}
	<section
		data-testid="compare-panel"
		aria-label="Adressen vergleichen"
		class="flex h-full flex-col overflow-auto bg-bg-elevated text-ink"
	>
		<header
			class="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-rule bg-bg-elevated px-6 pt-5 pb-4"
		>
			<div>
				<p class="font-mono text-xs tracking-wide text-ink-subtle uppercase">Vergleich</p>
				<div class="mt-1 flex items-baseline gap-2 font-serif text-lg leading-tight text-ink">
					<span data-testid="compare-address-a">{ui.selectedAddress.displayName}</span>
					<ArrowLeftRight size={14} aria-hidden="true" class="text-ink-muted" />
					<span data-testid="compare-address-b" class="text-ink-muted">
						{ui.comparisonAddress?.displayName ?? 'Adresse B fehlt'}
					</span>
				</div>
			</div>
			<button
				type="button"
				onclick={exit}
				data-testid="compare-exit"
				aria-label="Vergleich verlassen"
				class="rounded-sm p-1 text-ink-muted hover:text-ink"
			>
				<X size={18} aria-hidden="true" />
			</button>
		</header>

		{#if !ui.comparisonAddress}
			<div
				data-testid="compare-b-picker"
				class="flex flex-col gap-3 border-b border-rule px-6 py-4"
			>
				<p class="font-mono text-xs tracking-wide text-ink-subtle uppercase">Adresse B wählen</p>
				{#if geocode}
					<div class="flex items-center gap-2">
						<Search size={14} aria-hidden="true" class="text-ink-muted" />
						<div class="min-w-0 flex-1">
							<AddressSearch
								variant="header"
								{geocode}
								onSelect={pickAddressB}
								placeholder="Adresse B suchen"
							/>
						</div>
					</div>
				{/if}
				{#if onOpenBookmarkPicker}
					<button
						type="button"
						data-testid="compare-pick-bookmarks"
						onclick={onOpenBookmarkPicker}
						class="inline-flex items-center gap-2 self-start border-b border-rule-strong text-sm text-ink hover:text-ink"
					>
						<Bookmark size={14} aria-hidden="true" />
						<span>Aus Bookmarks wählen</span>
					</button>
				{/if}
			</div>
		{/if}

		{#if ui.comparisonAddress && ui.comparisonLoading}
			<div
				data-testid="compare-loading"
				class="px-6 py-6 font-mono text-sm text-ink-muted"
				aria-live="polite"
			>
				Daten für Adresse B werden geladen…
			</div>
		{/if}

		{#if ui.comparisonAddress && !ui.comparisonLoading}
			{#if featureFlags.kiezScore && (ui.kiezScore !== null || ui.comparisonKiezScore !== null)}
				<KiezScoreCompareBlock scoreA={ui.kiezScore} scoreB={ui.comparisonKiezScore} />
			{/if}
			{#if ui.wahlResults !== null || ui.comparisonWahlResults !== null}
				<div class="px-6">
					<WahlCompareBlock resultsA={ui.wahlResults} resultsB={ui.comparisonWahlResults} />
				</div>
			{/if}
			<div
				data-testid="compare-mobile-tabs"
				role="tablist"
				aria-label="Vergleichs-Spalte auswählen"
				class="flex gap-2 border-b border-rule px-6 py-2 lg:hidden"
			>
				<button
					type="button"
					role="tab"
					data-testid="compare-tab-a"
					aria-selected={activeTab === 'a'}
					aria-controls="compare-table"
					onclick={() => (activeTab = 'a')}
					class="min-h-11 px-3 py-1 text-sm aria-selected:border-b-2 aria-selected:border-accent aria-selected:font-semibold"
				>
					Adresse A
				</button>
				<button
					type="button"
					role="tab"
					data-testid="compare-tab-b"
					aria-selected={activeTab === 'b'}
					aria-controls="compare-table"
					onclick={() => (activeTab = 'b')}
					class="min-h-11 px-3 py-1 text-sm aria-selected:border-b-2 aria-selected:border-accent aria-selected:font-semibold"
				>
					Adresse B
				</button>
			</div>

			<div class="flex-1 px-6 py-4">
				{#if !hasAnyRows}
					<p data-testid="compare-empty" class="py-6 font-mono text-sm text-ink-subtle">
						Keine vergleichbaren Layer-Daten für beide Adressen.
					</p>
				{:else}
					<table
						id="compare-table"
						data-testid="compare-table"
						data-active-tab={activeTab}
						class="w-full border-collapse"
					>
						<caption class="sr-only">
							Vergleich: {ui.selectedAddress.displayName} vs {ui.comparisonAddress.displayName}
						</caption>
						<thead>
							<tr class="border-b border-rule-strong">
								<th
									scope="col"
									class="py-2 pr-3 text-left font-mono text-xs tracking-wide text-ink-muted uppercase"
								>
									Indikator
								</th>
								<th
									scope="col"
									data-cell="a"
									class="py-2 pr-3 text-left font-mono text-xs tracking-wide text-ink-muted uppercase"
								>
									Adresse A
								</th>
								<th
									scope="col"
									data-cell="b"
									class="py-2 text-left font-mono text-xs tracking-wide text-ink-muted uppercase"
								>
									Adresse B
								</th>
							</tr>
						</thead>
						<tbody>
							{#each sections as section (section.key)}
								{#if section.rows.length > 0}
									{@const disclaimers = getSectionDisclaimers(section)}
									<tr data-testid={`compare-section-${section.key}`} data-section={section.key}>
										<th
											colspan="3"
											scope="rowgroup"
											class="border-t border-rule pt-4 pb-1 text-left font-mono text-xs tracking-wide text-ink-muted uppercase"
										>
											{section.label}
										</th>
									</tr>
									{#each section.rows as row (row.slug)}
										<CompareRow
											slug={row.slug}
											layerName={getLayerDisplayName(row.slug)}
											hitA={row.hitA}
											hitB={row.hitB}
										/>
									{/each}
									{#each disclaimers as variant (variant)}
										<tr data-testid={`compare-disclaimer-${variant}`}>
											<td colspan="3" class="pb-2 pl-3">
												<EditorialDisclaimer {variant} />
											</td>
										</tr>
									{/each}
								{/if}
							{/each}
						</tbody>
					</table>
				{/if}
			</div>

			<footer
				data-testid="compare-footer"
				class="border-t border-rule px-6 py-3"
				role="note"
				aria-label="Editorial-Hinweis zum Adress-Vergleich"
			>
				<EditorialDisclaimer variant="compare-stigma-footer" />
			</footer>
		{/if}
	</section>
{/if}

<style>
	@media (max-width: 1023px) {
		[data-testid='compare-table'][data-active-tab='a'] [data-cell='b'],
		[data-testid='compare-table'][data-active-tab='a'] td:nth-of-type(2) {
			display: none;
		}
		[data-testid='compare-table'][data-active-tab='b'] [data-cell='a'],
		[data-testid='compare-table'][data-active-tab='b'] td:nth-of-type(1) {
			display: none;
		}
	}
	@media print {
		[data-testid='compare-table'] [data-cell] {
			display: table-cell !important;
		}
	}
</style>
