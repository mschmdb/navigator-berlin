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
		Promise.all([
			import('../climate-sparkline.svelte'),
			import('../climate-long-view.svelte')
		])
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
	<p
		class="py-3 font-serif italic text-ink-subtle"
		data-testid="section-klima-empty"
	>
		Klima-Daten werden geladen oder konnten nicht ermittelt werden.
	</p>
{:else}
	<div class="space-y-4" data-testid="klima-section">
		<p
			class="font-serif text-sm text-ink-subtle"
			data-testid="klima-station-hint"
		>
			Nächstgelegene DWD-Station: {station.name}, {station.firstYear}+
		</p>

		{#if loadError}
			<p
				class="py-2 font-mono text-xs text-state-error"
				data-testid="klima-load-error"
			>
				Klima-Charts konnten nicht geladen werden.
			</p>
		{:else if Sparkline === null}
			<div
				class="space-y-5"
				data-testid="klima-skeleton"
				aria-live="polite"
				aria-busy="true"
			>
				<div class="h-16 animate-pulse bg-bg" aria-hidden="true"></div>
				<div class="h-16 animate-pulse bg-bg" aria-hidden="true"></div>
				<div class="h-16 animate-pulse bg-bg" aria-hidden="true"></div>
				<span class="font-mono text-xs text-ink-subtle">lädt…</span>
			</div>
		{:else}
			<div class="space-y-5" data-testid="klima-sparkline-grid">
				<Sparkline
					series={series.summerDays}
					metric="summer"
					stationName={station.name}
				/>
				<Sparkline
					series={series.frostDays}
					metric="frost"
					stationName={station.name}
				/>
				<Sparkline
					series={series.hotDays}
					metric="hot"
					stationName={station.name}
				/>
			</div>

			{#if showLongView && LongView}
				<div class="mt-6" data-testid="klima-long-view-slot">
					<LongView
						series={series.annualMeanTemp ?? []}
						stationName={station.name}
					/>
				</div>
			{/if}
		{/if}

		<div class="mt-2">
			<DataStandBanner hit={bannerHit()} />
		</div>
	</div>
{/if}
