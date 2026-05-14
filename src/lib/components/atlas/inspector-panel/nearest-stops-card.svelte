<script lang="ts">
	import type { OepnvStopIndex } from '$lib/data';
	import { TrainFront, TrainTrack, TramFront, Bus } from '@lucide/svelte';
	import ValueChip from '../value-chip.svelte';
	import { walkingSeverity } from '$lib/utils/oepnv-walking.js';
	import {
		findAllNearestStops,
		findAllNearestStopsWithSoft,
		type Modus,
		type NearestStop
	} from './internal/nearest-oepnv-stop.js';
	import { getMobilityRating } from './internal/mobility-rating.js';

	type Props = {
		address: { lat: number; lng: number } | null;
		index: OepnvStopIndex | null;
		isResidential?: boolean;
	};

	let { address, index, isResidential = false }: Props = $props();

	const MODUS_LABEL: Record<Modus, string> = {
		ubahn: 'U-Bahn',
		sbahn: 'S-Bahn',
		tram: 'Tram',
		bus: 'Bus'
	};

	const MODUS_ICON: Record<Modus, typeof TrainFront> = {
		ubahn: TrainFront,
		sbahn: TrainTrack,
		tram: TramFront,
		bus: Bus
	};

	const ORDER: readonly Modus[] = ['ubahn', 'sbahn', 'tram', 'bus'];

	type ModusEntry = { modus: Modus; stop: NearestStop };

	const nearestPerModus = $derived.by(() => {
		if (!address || !index) return null;
		return isResidential
			? findAllNearestStopsWithSoft(address, index)
			: findAllNearestStops(address, index);
	});

	const entries = $derived.by<ModusEntry[]>(() => {
		if (!nearestPerModus) return [];
		const out: ModusEntry[] = [];
		for (const modus of ORDER) {
			const stop = nearestPerModus[modus];
			if (stop) out.push({ modus, stop });
		}
		return out;
	});

	const rating = $derived.by(() => {
		if (!nearestPerModus) return null;
		return getMobilityRating(nearestPerModus, { isResidential });
	});

	function rowAriaLabel(modus: Modus, stop: NearestStop): string {
		const softPart = stop.soft ? ', schwach angebunden' : '';
		return `${MODUS_LABEL[modus]} ${stop.name}, ${stop.distanceM} Meter Fußweg, ungefähr ${stop.walkingMin} ${stop.walkingMin === 1 ? 'Minute' : 'Minuten'}${softPart}`;
	}
</script>

{#if address}
	{#if !index}
		<div
			class="rounded-sm border border-rule bg-bg-elevated p-3"
			data-testid="nearest-stops-loading"
			aria-busy="true"
			aria-live="polite"
		>
			<p class="font-mono text-xs text-ink-subtle">Nächste Haltestellen werden geladen…</p>
		</div>
	{:else}
		<div
			class="rounded-sm border border-rule bg-bg-elevated p-3"
			data-testid="nearest-stops-card"
			role="region"
			aria-label="Nächste ÖPNV-Haltestellen"
		>
			<div class="flex items-center justify-between gap-2 border-b border-rule pb-1">
				<h3 class="font-mono text-xs uppercase tracking-wide text-ink-muted">
					Nächste Haltestellen
				</h3>
				{#if rating}
					<span
						data-testid="mobility-rating-badge"
						data-rating={rating.key}
						data-severity={rating.severity}
						class={[
							'inline-flex items-center rounded-sm px-2 py-0.5 font-sans text-xs font-semibold',
							rating.severity === 'success' && 'bg-severity-success-bg text-severity-success',
							rating.severity === 'success-soft' &&
								'bg-severity-success-soft-bg text-severity-success-soft',
							rating.severity === 'warning' && 'bg-severity-warning-bg text-severity-warning',
							rating.severity === 'danger' && 'bg-severity-danger-bg text-severity-danger'
						]
							.filter(Boolean)
							.join(' ')}
						aria-label={`ÖPNV-Anbindung: ${rating.label}`}
					>
						{rating.label}
					</span>
				{/if}
			</div>
			<p
				class="mt-1 pb-2 font-mono text-[10px] leading-snug text-ink-subtle"
				data-testid="nearest-stops-method"
			>
				Berechnete Schätzung: Luftlinie × 1,3 Umweg-Faktor, 4,8 km/h Gehgeschwindigkeit. Reale Fußwege können abweichen.
			</p>
			{#if entries.length === 0}
				<p
					class="py-1 font-mono text-xs text-ink-subtle"
					data-testid="nearest-stops-empty"
				>
					{isResidential
						? 'Keine ÖPNV-Haltestelle im Umkreis von 1500m'
						: 'Keine ÖPNV-Haltestelle im Umkreis von 600m'}
				</p>
			{:else}
				<ul class="divide-y divide-rule/40">
					{#each entries as { modus, stop } (modus)}
						{@const Icon = MODUS_ICON[modus]}
						{@const sev = stop.soft ? 'warning' : walkingSeverity(stop.distanceM)}
						<li
							class="flex min-h-[36px] items-center gap-3 py-1.5"
							data-testid="nearest-stop-row"
							data-modus={modus}
							data-severity={sev}
							data-soft={stop.soft ? 'true' : null}
							aria-label={rowAriaLabel(modus, stop)}
						>
							<span
								class="inline-flex h-5 w-5 shrink-0 items-center justify-center text-ink-muted"
								data-testid="nearest-stop-icon"
								aria-hidden="true"
							>
								<Icon size={16} aria-hidden="true" />
							</span>
							<span class="w-12 shrink-0 font-mono text-[10px] uppercase tracking-wide text-ink-subtle">
								{MODUS_LABEL[modus]}
							</span>
							<span class="flex-1 truncate text-sm text-ink">{stop.name}</span>
							<span
								class="shrink-0 font-mono text-[11px] tabular-nums text-ink-subtle"
								data-testid="nearest-stop-distance"
								aria-hidden="true"
							>
								{stop.distanceM}m
							</span>
							<span data-testid="nearest-stop-chip" aria-hidden="true">
								<ValueChip
									severity={sev}
									value={stop.walkingMin}
									unit="min"
									layerName={`${MODUS_LABEL[modus]} ${stop.name}`}
									numeric={true}
								/>
							</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
{/if}
