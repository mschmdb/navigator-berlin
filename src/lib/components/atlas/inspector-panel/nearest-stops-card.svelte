<script lang="ts">
	import type { OepnvStopIndex } from '$lib/data';
	import { TrainFront, TrainTrack, TramFront, Bus } from '@lucide/svelte';
	import ValueChip from '../value-chip.svelte';
	import {
		walkingSeverity,
		MAX_WALKING_DISTANCE_M,
		EXTENDED_WALKING_DISTANCE_M,
		WALKING_SPEED_M_PER_MIN,
		DETOUR_FACTOR
	} from '$lib/utils/oepnv-walking.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, type Locale } from '$lib/paraglide/runtime';
	import { formatDecimal } from '$lib/i18n/format.js';
	import { severityDescriptions } from './internal/value-severity-mapping.js';
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
		lang?: Locale;
	};

	let { address, index, isResidential = false, lang }: Props = $props();

	const locale = $derived(lang ?? getLocale());
	const localeOpts = $derived({ locale });

	// Faktor/Geschwindigkeit stammen aus `oepnv-walking.ts` statt einem
	// zweiten hartcodierten Literal in der Message (Review-Fund). `formatDecimal`
	// mit fester 1-Nachkommastelle reicht DE ("1,3"/"4,8") unverändert durch.
	const detourFactorText = $derived(
		formatDecimal(DETOUR_FACTOR, { ...localeOpts, maximumFractionDigits: 1, minimumFractionDigits: 1 })
	);
	const walkingSpeedKmhText = $derived(
		formatDecimal((WALKING_SPEED_M_PER_MIN * 60) / 1000, {
			...localeOpts,
			maximumFractionDigits: 1,
			minimumFractionDigits: 1
		})
	);
	// Radien ebenfalls aus dem Code (statt zweitem Literal), aber bewusst OHNE
	// `formatCount`: dessen Tausendertrennzeichen würde "1500m" zu "1.500m"
	// machen und damit die DE-Ausgabe ändern (Boundary: Zeichen-für-Zeichen
	// gleich) -- roh wie vormals im Message-String selbst.
	const emptyStateRadiusText = $derived(
		String(isResidential ? EXTENDED_WALKING_DISTANCE_M : MAX_WALKING_DISTANCE_M)
	);

	const MODUS_LABEL: Record<Modus, () => string> = {
		ubahn: () => m.inspector_nearest_stops_modus_ubahn(undefined, localeOpts),
		sbahn: () => m.inspector_nearest_stops_modus_sbahn(undefined, localeOpts),
		tram: () => m.inspector_nearest_stops_modus_tram(undefined, localeOpts),
		bus: () => m.inspector_nearest_stops_modus_bus(undefined, localeOpts)
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
		return getMobilityRating(nearestPerModus, { isResidential, ...localeOpts });
	});

	function rowAriaLabel(modus: Modus, stop: NearestStop): string {
		const softPart = stop.soft ? m.inspector_nearest_stops_row_soft_suffix(undefined, localeOpts) : '';
		const minutes =
			stop.walkingMin === 1
				? m.inspector_nearest_stops_minutes_singular(
						{ count: String(stop.walkingMin) },
						localeOpts
					)
				: m.inspector_nearest_stops_minutes_plural(
						{ count: String(stop.walkingMin) },
						localeOpts
					);
		return m.inspector_nearest_stops_row_aria(
			{
				modus: MODUS_LABEL[modus](),
				name: stop.name,
				distance: String(stop.distanceM),
				minutes,
				soft: softPart
			},
			localeOpts
		);
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
			<p class="font-mono text-xs text-ink-subtle">
				{m.inspector_nearest_stops_loading(undefined, localeOpts)}
			</p>
		</div>
	{:else}
		<div
			class="rounded-sm border border-rule bg-bg-elevated p-3"
			data-testid="nearest-stops-card"
			role="region"
			aria-label={m.inspector_nearest_stops_aria_label(undefined, localeOpts)}
		>
			<div class="flex items-center justify-between gap-2 border-b border-rule pb-1">
				<h3 class="font-mono text-xs tracking-wide text-ink-muted uppercase">
					{m.inspector_nearest_stops_heading(undefined, localeOpts)}
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
						aria-label={m.inspector_nearest_stops_rating_aria({ label: rating.label }, localeOpts)}
					>
						{rating.label}
					</span>
				{/if}
			</div>
			<p
				class="mt-1 pb-2 font-mono text-[10px] leading-snug text-ink-subtle"
				data-testid="nearest-stops-method"
			>
				{m.inspector_nearest_stops_method(
					{ factor: detourFactorText, speed: walkingSpeedKmhText },
					localeOpts
				)}
			</p>
			{#if entries.length === 0}
				<p class="py-1 font-mono text-xs text-ink-subtle" data-testid="nearest-stops-empty">
					{isResidential
						? m.inspector_nearest_stops_empty_residential(
								{ radius: emptyStateRadiusText },
								localeOpts
							)
						: m.inspector_nearest_stops_empty_default(
								{ radius: emptyStateRadiusText },
								localeOpts
							)}
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
							<span
								class="w-12 shrink-0 font-mono text-[10px] tracking-wide text-ink-subtle uppercase"
							>
								{MODUS_LABEL[modus]()}
							</span>
							<span class="flex-1 truncate text-sm text-ink">{stop.name}</span>
							<span
								class="shrink-0 font-mono text-[11px] text-ink-subtle tabular-nums"
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
									layerName={`${MODUS_LABEL[modus]()} ${stop.name}`}
									numeric={true}
									severityDescriptions={severityDescriptions(localeOpts)}
								/>
							</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
{/if}
