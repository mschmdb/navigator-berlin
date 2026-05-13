<script lang="ts">
	import type { ClimateStation, ClimateData, LayerHit } from '$lib/data';
	import ClimateSparkline from '../climate-sparkline.svelte';
	import ClimateLongView from '../climate-long-view.svelte';
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

		<div class="space-y-5" data-testid="klima-sparkline-grid">
			<ClimateSparkline
				series={series.summerDays}
				metric="summer"
				stationName={station.name}
			/>
			<ClimateSparkline
				series={series.frostDays}
				metric="frost"
				stationName={station.name}
			/>
			<ClimateSparkline
				series={series.hotDays}
				metric="hot"
				stationName={station.name}
			/>
		</div>

		{#if showLongView}
			<div class="mt-6" data-testid="klima-long-view-slot">
				<ClimateLongView
					series={series.annualMeanTemp ?? []}
					stationName={station.name}
				/>
			</div>
		{/if}

		<div class="mt-2">
			<DataStandBanner hit={bannerHit()} />
		</div>
	</div>
{/if}
