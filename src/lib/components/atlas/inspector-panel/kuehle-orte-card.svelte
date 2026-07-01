<script lang="ts">
	import type { KuehleOrt } from '$lib/data/get-kuehle-orte-index.js';
	import {
		Eye,
		EyeOff,
		ExternalLink,
		ChevronDown,
		Navigation,
		Snowflake,
		Clock
	} from '@lucide/svelte';
	import { getEditorialConfig } from '../internal/editorial-config.js';
	import { getLayerExplainEntry } from './internal/layer-explain.js';
	import {
		nearestFilteredKuehleOrte,
		type KuehleOrteFilters
	} from './internal/nearest-kuehle-orte.js';
	import { getOpeningStatus } from './internal/opening-status.js';
	import { formatOpeningHoursDe } from './internal/format-opening-hours.js';
	import EditorialDisclaimer from '../editorial-disclaimer.svelte';

	const SLUG = 'kuehle-orte';

	type Props = {
		layerName: string;
		address: { lat: number; lng: number } | null;
		index: readonly KuehleOrt[] | null;
		isActive?: boolean;
		onToggleLayer?: (slug: string) => void;
	};

	let { layerName, address, index, isActive = false, onToggleLayer }: Props = $props();

	const LIMIT = 5;
	let filters = $state<KuehleOrteFilters>({
		jetztOffen: false,
		mitKlimaanlage: false,
		kostenlos: false,
		imSommerNutzbar: false
	});
	let detailsOpen = $state(false);

	// Live-Uhr für den Öffnungsstatus, aktualisiert minütlich.
	let now = $state(new Date());
	$effect(() => {
		const id = setInterval(() => (now = new Date()), 60_000);
		return () => clearInterval(id);
	});

	const editorial = $derived(getEditorialConfig(SLUG));
	const explainEntry = $derived(getLayerExplainEntry(SLUG));

	const nearest = $derived.by(() => {
		if (!address || !index) return [];
		return nearestFilteredKuehleOrte(address, index, filters, LIMIT, now);
	});

	const FILTER_CHIPS: { key: keyof KuehleOrteFilters; label: string }[] = [
		{ key: 'jetztOffen', label: 'jetzt offen' },
		{ key: 'mitKlimaanlage', label: 'mit Klimaanlage' },
		{ key: 'kostenlos', label: 'kostenlos' },
		{ key: 'imSommerNutzbar', label: 'im Sommer nutzbar' }
	];

	function statusInfo(oh: string): { text: string; tone: 'open' | 'soon' | 'closed' | 'unknown' } {
		const s = getOpeningStatus(oh, now);
		if (s === 'open') return { text: 'jetzt offen', tone: 'open' };
		if (s === 'closing-soon') return { text: 'schließt bald', tone: 'soon' };
		if (s === 'closed') return { text: 'geschlossen', tone: 'closed' };
		return { text: 'Zeiten unbekannt', tone: 'unknown' };
	}

	const STATUS_CLASS: Record<'open' | 'soon' | 'closed' | 'unknown', string> = {
		open: 'bg-state-success/15 text-state-success',
		soon: 'bg-state-warning/15 text-state-warning',
		closed: 'bg-state-error/15 text-state-error',
		unknown: 'bg-bg text-ink-subtle'
	};

	function toggleFilter(key: keyof KuehleOrteFilters): void {
		filters = { ...filters, [key]: !filters[key] };
	}

	function formatDistance(m: number): string {
		if (m < 1000) return `${m} m`;
		return `${(m / 1000).toFixed(1).replace('.', ',')} km`;
	}

	function freeLabel(isFree: string): string | null {
		if (isFree === 'free') return 'kostenlos';
		if (isFree === 'ticket') return 'Ticket';
		if (isFree === 'consumption') return 'Konsum';
		return null;
	}

	function summerLabel(summer: string): { text: string; tone: 'warn' | 'muted' } | null {
		if (summer === 'no') return { text: 'im Sommer geschlossen', tone: 'warn' };
		if (summer === 'limited') return { text: 'eingeschränkt', tone: 'muted' };
		return null;
	}
</script>

<section
	data-testid="kuehle-orte-card"
	data-layer={SLUG}
	class="-mx-2 rounded border border-rule bg-bg-elevated px-2.5 py-2"
	aria-label={`${layerName} in der Nähe`}
>
	<div class="flex items-start justify-between gap-2">
		<h4 class="flex min-w-0 items-center gap-1.5 font-sans text-sm font-semibold text-ink">
			<Snowflake size={15} aria-hidden="true" class="shrink-0 text-[#0277BD]" />
			{layerName}
		</h4>
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
					onclick={() => onToggleLayer?.(SLUG)}
					class={`inline-flex h-6 w-6 items-center justify-center rounded-sm hover:bg-bg ${isActive ? 'text-accent' : 'text-ink-subtle hover:text-ink'}`}
				>
					{#if isActive}<EyeOff size={14} aria-hidden="true" />{:else}<Eye
							size={14}
							aria-hidden="true"
						/>{/if}
				</button>
			{/if}
		</div>
	</div>

	<p class="mt-0.5 font-serif text-sm leading-snug text-ink-muted">{explainEntry.short}</p>

	<!-- Filter-Chips (multi-select, kombinierbar) -->
	<div class="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Kühle Orte filtern">
		{#each FILTER_CHIPS as chip (chip.key)}
			<button
				type="button"
				data-testid={`filter-${chip.key}`}
				aria-pressed={filters[chip.key]}
				onclick={() => toggleFilter(chip.key)}
				class={`inline-flex items-center rounded-full border px-2 py-0.5 font-sans text-xs transition-colors ${
					filters[chip.key]
						? 'border-accent bg-accent text-bg-elevated'
						: 'border-rule text-ink-muted hover:border-ink-subtle hover:text-ink'
				}`}
			>
				{chip.label}
			</button>
		{/each}
	</div>

	<!-- Nächste Orte zum Klickpunkt -->
	{#if nearest.length > 0}
		<ul class="mt-2.5 space-y-2.5" data-testid="kuehle-orte-list">
			{#each nearest as ort (ort.id)}
				{@const summer = summerLabel(ort.summerAvailable)}
				{@const free = freeLabel(ort.isFree)}
				{@const status = statusInfo(ort.openingHours)}
				<li class="border-t border-rule pt-2 first:border-t-0 first:pt-0" data-testid="kuehle-ort">
					<div class="flex items-baseline justify-between gap-2">
						<span class="min-w-0 truncate font-sans text-sm font-medium text-ink">{ort.name}</span>
						<span class="shrink-0 font-mono text-xs text-ink-subtle tabular-nums"
							>{formatDistance(ort.distanceM)}</span
						>
					</div>
					<div class="mt-0.5 flex flex-wrap items-center gap-1">
						<span
							class={`inline-flex items-center rounded-sm px-1 font-mono text-[10px] font-semibold ${STATUS_CLASS[status.tone]}`}
							data-testid="ort-status">{status.text}</span
						>
						<span class="font-mono text-[11px] text-ink-muted">{ort.cat}</span>
						<span class="inline-flex items-center rounded-sm bg-bg px-1 font-mono text-[10px] text-ink-muted">
							Kühle {ort.coolScore}/5
						</span>
						{#if ort.acStatus === 'yes'}
							<span class="inline-flex items-center rounded-sm bg-[#0277BD]/12 px-1 font-mono text-[10px] text-[#0277BD]">
								klimatisiert
							</span>
						{/if}
						{#if free}
							<span class="inline-flex items-center rounded-sm bg-bg px-1 font-mono text-[10px] text-ink-muted"
								>{free}</span
							>
						{/if}
						{#if summer}
							<span
								class={`inline-flex items-center rounded-sm px-1 font-mono text-[10px] ${
									summer.tone === 'warn'
										? 'bg-state-warning/15 text-state-warning'
										: 'bg-bg text-ink-muted'
								}`}>{summer.text}</span
							>
						{/if}
					</div>
					{#if ort.address}
						<p class="mt-0.5 font-serif text-xs text-ink-subtle">{ort.address}</p>
					{/if}
					{#if ort.openingHours}
						<p
							class="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-ink-muted"
							data-testid="ort-hours"
						>
							<Clock size={11} aria-hidden="true" class="shrink-0" />
							{formatOpeningHoursDe(ort.openingHours)}
						</p>
					{/if}
					<div class="mt-1 flex flex-wrap gap-2">
						<a
							href={ort.googleMapsUrl}
							target="_blank"
							rel="noopener noreferrer"
							data-testid="navi-google"
							class="hover:text-accent-strong inline-flex items-center gap-1 font-sans text-xs text-accent underline underline-offset-2"
						>
							<Navigation size={11} aria-hidden="true" /> Google Maps
						</a>
						<a
							href={ort.appleMapsUrl}
							target="_blank"
							rel="noopener noreferrer"
							data-testid="navi-apple"
							class="hover:text-accent-strong inline-flex items-center gap-1 font-sans text-xs text-accent underline underline-offset-2"
						>
							<Navigation size={11} aria-hidden="true" /> Apple Maps
						</a>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="mt-2.5 font-serif text-sm text-ink-subtle italic" data-testid="kuehle-orte-empty">
			{#if !index}
				Lade kühle Orte …
			{:else}
				Keine kühlen Orte mit diesen Filtern in der Nähe.
			{/if}
		</p>
	{/if}

	{#if nearest.length > 0}
		<p
			class="mt-2.5 border-t border-rule pt-2.5 font-serif text-[11px] leading-snug text-ink-subtle"
			data-testid="kuehle-legende"
		>
			„Kühle x/5" heißt: 5 sehr kalt (z.B. Eishalle), 4 klimatisiert oder am Wasser, 3 kühler
			Massivbau wie Bibliothek oder Museum, darunter weniger kühl.
		</p>
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
	</div>
	{#if detailsOpen}
		<div data-testid="card-details" class="mt-1.5 space-y-1.5">
			<p class="font-serif text-xs leading-snug text-ink-muted">{explainEntry.long}</p>
			{#if editorial?.primarySourceUrl}
				<a
					href={editorial.primarySourceUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="hover:text-accent-strong inline-flex w-fit items-center gap-1 font-sans text-xs text-accent underline underline-offset-2"
				>
					<ExternalLink size={12} aria-hidden="true" /> Quelle ansehen
				</a>
			{/if}
			{#each editorial?.disclaimerVariants ?? [] as variant (variant)}
				<EditorialDisclaimer {variant} sourceUrl={editorial?.primarySourceUrl} />
			{/each}
		</div>
	{/if}
</section>
