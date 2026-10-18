<!-- Thematische Sektionen des Inspectors (Wohnen, Umwelt, Mobilität …). Aus
     `inspector-panel.svelte` herausgelöst (GH-88). Datensätze stehen als Zeilen mit Linie,
     Quellen und Details einmal am Ende jeder Sektion. -->
<script lang="ts">
	import type { LayerHit } from '$lib/data';
	import type { NumericMedianAggregate } from '$lib/data/layer-aggregates-types.js';
	import { getUiState, toggleLayer } from '$lib/state/ui-context.svelte.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import type { Locale } from '$lib/paraglide/runtime';
	import { getLayerDisplayName } from '../internal/layer-palette-filter.js';
	import { CARD_SLUGS } from './internal/card-slugs.js';
	import type { InspectorSection } from './internal/sections.js';
	import type { AggregateScope, ContextRow } from './internal/context-rows.js';
	import { cardLayerName } from './internal/context-rows.js';
	import LayerHitRow from './layer-hit-row.svelte';
	import KlimaPetCard from './klima-pet-card.svelte';
	import LayerCard from './layer-card.svelte';
	import KlimaSection from './klima-section.svelte';
	import NearestStopsCard from './nearest-stops-card.svelte';
	import KuehleOrteCard from './kuehle-orte-card.svelte';
	import WaermeOrteCard from './waerme-orte-card.svelte';
	import HitzeTrinkbrunnenToggle from './hitze-trinkbrunnen-toggle.svelte';
	import ScoreMembershipBadge from './score-membership-badge.svelte';
	import SectionSources from './section-sources.svelte';

	type Point = { lat: number; lng: number };

	type Props = {
		sections: readonly InspectorSection[];
		lang: Locale;
		hitzeMode: boolean;
		kaelteMode: boolean;
		hasKuehleOrte: boolean;
		hasWaermeOrte: boolean;
		hasNearestStops: boolean;
		isResidential: boolean;
		addressPoint: Point | null;
		kiezName: string | null;
		bezirkName: string | null;
		contextRowsFor: (slug: string) => ContextRow[];
		numericAgg: (slug: string, scope: AggregateScope) => NumericMedianAggregate | null;
		onJump: (dimension: string) => void;
	};
	let {
		sections,
		lang,
		hitzeMode,
		kaelteMode,
		hasKuehleOrte,
		hasWaermeOrte,
		hasNearestStops,
		isResidential,
		addressPoint,
		kiezName,
		bezirkName,
		contextRowsFor,
		numericAgg,
		onJump
	}: Props = $props();

	const ui = getUiState();
	const localeOpts = $derived({ locale: lang });
	const reducedMode = $derived(hitzeMode || kaelteMode);

	function onToggleLayer(slug: string): void {
		toggleLayer(ui, slug);
	}

	function shouldRender(sectionKey: string, hitCount: number): boolean {
		if (kaelteMode) return sectionKey === 'umwelt' && hasWaermeOrte;
		if (hitzeMode) return sectionKey === 'umwelt' && hasKuehleOrte;
		if (sectionKey === 'klima') return true;
		if (sectionKey === 'mobilitaet' && hasNearestStops) return true;
		if (sectionKey === 'umwelt' && hasKuehleOrte) return true;
		return hitCount > 0;
	}

	/** Datensätze, die als Zeile erscheinen; kühle Orte stehen auf Sektions-Ebene. */
	function rowHits(hits: readonly LayerHit[]): LayerHit[] {
		return hits.filter((h) => h.layer !== 'kuehle-orte');
	}

	function nameFor(slug: string): string {
		return CARD_SLUGS.has(slug)
			? cardLayerName(slug, localeOpts)
			: getLayerDisplayName(slug, localeOpts);
	}
</script>

{#each sections as section (section.key)}
	{#if shouldRender(section.key, section.hits.length)}
		<section
			data-testid={`section-${section.key}`}
			data-section={section.key}
			data-scroll-anchor="section:{section.key}"
			class="border-t border-rule pt-4"
		>
			<h3
				class="mb-1 flex items-baseline gap-2 font-sans text-sm font-semibold text-ink"
				data-testid={`section-header-${section.key}`}
			>
				<span>{section.label}</span>
				{#if section.hits.length > 0}
					<span
						class="text-dense-label font-normal text-ink-subtle tabular-nums"
						data-testid={`section-count-${section.key}`}>{section.hits.length}</span
					>
				{/if}
			</h3>
			<div class="space-y-3">
				{#if section.key === 'mobilitaet'}
					<NearestStopsCard
						address={addressPoint}
						index={ui.oepnvStopIndex}
						{isResidential}
						{lang}
					/>
				{/if}
				{#if section.key === 'umwelt' && hasWaermeOrte}
					<WaermeOrteCard
						layerName={getLayerDisplayName('waerme-orte', localeOpts)}
						address={addressPoint}
						index={ui.waermeOrteIndex}
						loadError={ui.waermeOrteLoadError}
						isActive={ui.activeLayerSlugs.includes('waerme-orte')}
						{onToggleLayer}
						{lang}
					/>
				{:else if section.key === 'umwelt' && hasKuehleOrte}
					<KuehleOrteCard
						layerName={getLayerDisplayName('kuehle-orte', localeOpts)}
						address={addressPoint}
						index={ui.kuehleOrteIndex}
						isActive={ui.activeLayerSlugs.includes('kuehle-orte')}
						{onToggleLayer}
						{lang}
					/>
					{#if hitzeMode}
						<HitzeTrinkbrunnenToggle
							isActive={ui.activeLayerSlugs.includes('trinkbrunnen')}
							{onToggleLayer}
							address={addressPoint}
							index={ui.trinkbrunnenIndex}
							{lang}
						/>
					{/if}
				{/if}
				{#if section.key === 'klima'}
					<KlimaSection station={ui.nearestStation} series={ui.climateSeries} {lang} />
				{:else if section.hits.length > 0 && !reducedMode}
					{@const hits = rowHits(section.hits)}
					<div>
						{#each hits as hit (hit.layer)}
							<div data-testid="hit-{hit.layer}" data-scroll-anchor="hit:{hit.layer}">
								{#snippet membership()}
									<ScoreMembershipBadge slug={hit.layer} {onJump} {lang} />
								{/snippet}
								{#if hit.layer === 'klima-pet-2022'}
									<KlimaPetCard
										{hit}
										layerName={getLayerDisplayName(hit.layer, localeOpts)}
										{lang}
										isActive={ui.activeLayerSlugs.includes(hit.layer)}
										{onToggleLayer}
										{kiezName}
										kiezAggregate={numericAgg('klima-pet-2022', 'kiez')}
										{bezirkName}
										bezirkAggregate={numericAgg('klima-pet-2022', 'bezirk')}
										berlinAggregate={numericAgg('klima-pet-2022', 'berlin')}
										afterTitle={membership}
									/>
								{:else if CARD_SLUGS.has(hit.layer)}
									<LayerCard
										{hit}
										layerName={cardLayerName(hit.layer, localeOpts)}
										{lang}
										isActive={ui.activeLayerSlugs.includes(hit.layer)}
										{onToggleLayer}
										contextRows={contextRowsFor(hit.layer)}
										afterTitle={membership}
									/>
								{:else}
									<LayerHitRow
										{hit}
										layerName={getLayerDisplayName(hit.layer, localeOpts)}
										{lang}
										isActive={ui.activeLayerSlugs.includes(hit.layer)}
										{onToggleLayer}
										afterTitle={membership}
									/>
								{/if}
							</div>
						{/each}
					</div>
					<SectionSources
						sectionLabel={section.label}
						hits={section.hits}
						layerNameFor={nameFor}
						{lang}
					/>
				{/if}
			</div>
		</section>
	{/if}
{/each}
{#if reducedMode}
	<div
		class="border-t border-rule pt-4"
		data-testid={kaelteMode ? 'kaelte-full-navigator' : 'hitze-full-navigator'}
	>
		<a
			href={localizedHref('/explore', lang)}
			class="inline-flex min-h-(--target-min) items-center gap-1.5 font-sans text-sm text-accent underline underline-offset-2 hover:no-underline"
		>
			{m.inspector_hitze_full_navigator_link(undefined, localeOpts)}
		</a>
	</div>
{/if}
