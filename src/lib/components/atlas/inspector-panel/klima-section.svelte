<script lang="ts">
	import type { ClimateStation, ClimateData, LayerHit } from '$lib/data';
	import type { Component } from 'svelte';
	import DataStandBanner from './data-stand-banner.svelte';

	type Props = {
		station: ClimateStation | null;
		series: ClimateData | null;
		sourceUrl?: string;
		updatedAt?: string;
		license?: LayerHit['license'];
	};

	let {
		station,
		series,
		sourceUrl = 'https://opendata.dwd.de/climate_environment/CDC/',
		updatedAt = new Date().toISOString().slice(0, 10),
		license = 'dl-de/by-2-0'
	}: Props = $props();

	let Sparkline = $state<Component<Record<string, unknown>> | null>(null);
	let LongView = $state<Component<Record<string, unknown>> | null>(null);
	let loadError = $state(false);
	let loadStarted = $state(false);

	$effect(() => {
		if (loadStarted) return;
		if (!station || !series) return;
		loadStarted = true;
		Promise.all([import('../climate-sparkline.svelte'), import('../climate-long-view.svelte')])
			.then(([sparkMod, longMod]) => {
				Sparkline = sparkMod.default as Component<Record<string, unknown>>;
				LongView = longMod.default as Component<Record<string, unknown>>;
			})
			.catch(() => {
				loadError = true;
			});
	});

	const showLongView = $derived(
		station?.id === '00403' && (series?.annualMeanTemp?.length ?? 0) > 0
	);

	function bannerHit(): LayerHit {
		return {
			layer: 'klima',
			value: null,
			source: sourceUrl,
			updatedAt,
			license
		};
	}
</script>

{#if !station || !series}
	<p class="py-3 font-serif text-ink-subtle italic" data-testid="section-klima-empty">
		Klima-Daten werden geladen oder konnten nicht ermittelt werden.
	</p>
{:else}
	<section
		class="-mx-2 space-y-3 rounded border border-rule bg-bg-elevated px-2.5 py-2"
		data-testid="klima-section"
	>
		<div class="flex items-start justify-between gap-2">
			<h4 class="min-w-0 font-sans text-sm font-semibold text-ink">Klima · DWD-Station</h4>
			<span class="shrink-0 font-serif text-sm text-ink-subtle italic">{station.name}</span>
		</div>
		<p class="font-mono text-[11px] text-ink-subtle" data-testid="klima-station-hint">
			Messreihe seit {station.firstYear}
		</p>

		{#if loadError}
			<p class="py-2 font-mono text-xs text-state-error" data-testid="klima-load-error">
				Klima-Charts konnten nicht geladen werden.
			</p>
		{:else if Sparkline === null}
			<div class="space-y-3" data-testid="klima-skeleton" aria-live="polite" aria-busy="true">
				<div class="h-16 animate-pulse bg-bg" aria-hidden="true"></div>
				<div class="h-16 animate-pulse bg-bg" aria-hidden="true"></div>
				<div class="h-16 animate-pulse bg-bg" aria-hidden="true"></div>
				<span class="font-mono text-xs text-ink-subtle">lädt…</span>
			</div>
		{:else}
			<div class="space-y-3" data-testid="klima-sparkline-grid">
				<Sparkline series={series.summerDays} metric="summer" stationName={station.name} compact />
				<Sparkline series={series.frostDays} metric="frost" stationName={station.name} compact />
				<Sparkline series={series.hotDays} metric="hot" stationName={station.name} compact />
			</div>

			{#if showLongView && LongView}
				<div class="mt-4" data-testid="klima-long-view-slot">
					<LongView series={series.annualMeanTemp ?? []} stationName={station.name} />
				</div>
			{/if}
		{/if}

		<DataStandBanner hit={bannerHit()} />
	</section>
{/if}
