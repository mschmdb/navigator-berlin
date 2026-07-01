<script lang="ts">
	import { MapPin, Navigation, LocateFixed } from '@lucide/svelte';
	import { requestPosition, type PositionResult } from '$lib/utils/geolocation.js';
	import { announceGlobal } from '$lib/utils/aria-live.js';
	import { getKuehleOrteIndex, type KuehleOrt } from '$lib/data/get-kuehle-orte-index.js';
	import {
		nearestFilteredKuehleOrte,
		EMPTY_FILTERS,
		type KuehleOrtMitDistanz
	} from '$lib/components/atlas/inspector-panel/internal/nearest-kuehle-orte.js';
	import { getOpeningStatus } from '$lib/components/atlas/inspector-panel/internal/opening-status.js';

	type Phase = 'idle' | 'locating' | 'ready' | 'denied' | 'unsupported' | 'error';

	type Props = {
		explorerHref: string;
		// Injizierbar für Tests, sonst die echten Implementierungen.
		requestPositionFn?: () => Promise<PositionResult>;
		loadIndex?: () => Promise<KuehleOrt[]>;
		now?: Date;
	};

	let {
		explorerHref,
		requestPositionFn = requestPosition,
		loadIndex = getKuehleOrteIndex,
		now = new Date()
	}: Props = $props();

	const LIMIT = 5;
	let phase = $state<Phase>('idle');
	let results = $state<KuehleOrtMitDistanz[]>([]);

	const FALLBACK_MSG: Record<'denied' | 'unsupported' | 'error', string> = {
		denied: 'Ohne Standort können wir keine Orte in deiner Nähe zeigen.',
		unsupported: 'Dein Browser unterstützt keine Standort-Bestimmung.',
		error: 'Standort konnte nicht bestimmt werden.'
	};

	function fallbackMessage(s: Phase): string {
		if (s === 'denied' || s === 'unsupported' || s === 'error') return FALLBACK_MSG[s];
		return '';
	}

	async function locate(): Promise<void> {
		phase = 'locating';
		announceGlobal('Standort wird bestimmt');
		const pos = await requestPositionFn();
		if (!pos.ok) {
			phase = pos.reason;
			announceGlobal(FALLBACK_MSG[pos.reason]);
			return;
		}
		const index = await loadIndex().catch(() => null);
		if (!index) {
			phase = 'error';
			announceGlobal(FALLBACK_MSG.error);
			return;
		}
		results = nearestFilteredKuehleOrte(
			{ lat: pos.lat, lng: pos.lng },
			index,
			{ ...EMPTY_FILTERS, jetztOffen: true },
			LIMIT,
			now
		);
		phase = 'ready';
		announceGlobal(
			results.length > 0
				? `${results.length} offene kühle Orte in der Nähe gefunden`
				: 'Keine offenen kühlen Orte in der Nähe gefunden'
		);
	}

	function formatDistance(m: number): string {
		if (m < 1000) return `${m} m`;
		return `${(m / 1000).toFixed(1).replace('.', ',')} km`;
	}

	function statusText(oh: string): string {
		const s = getOpeningStatus(oh, now);
		return s === 'closing-soon' ? 'schließt bald' : 'jetzt offen';
	}
</script>

<section aria-labelledby="naehe-h" class="flex flex-col gap-3" data-testid="in-deiner-naehe">
	<h2 id="naehe-h" class="font-sans text-2xl font-semibold text-ink">In deiner Nähe</h2>

	{#if phase === 'idle' || phase === 'locating'}
		<button
			type="button"
			data-testid="naehe-locate"
			disabled={phase === 'locating'}
			onclick={locate}
			class="bg-accent hover:bg-accent-strong focus-visible:ring-accent inline-flex min-h-11 w-fit items-center gap-2 rounded px-5 py-3 font-sans text-base font-semibold text-bg-elevated focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
		>
			<LocateFixed size={18} aria-hidden="true" />
			{phase === 'locating' ? 'Standort wird bestimmt …' : 'Orte in meiner Nähe'}
		</button>
		<p class="font-serif text-sm text-ink-subtle">
			Wir fragen deinen Standort ab und zeigen die nächsten jetzt geöffneten kühlen Orte.
		</p>
	{:else if phase === 'ready'}
		{#if results.length > 0}
			<ul class="flex flex-col gap-3" data-testid="naehe-list">
				{#each results as ort (ort.id)}
					<li class="border-t border-rule pt-3 first:border-t-0 first:pt-0">
						<div class="flex items-baseline justify-between gap-2">
							<span class="min-w-0 truncate font-sans text-sm font-medium text-ink">{ort.name}</span
							>
							<span class="shrink-0 font-mono text-xs text-ink-subtle tabular-nums"
								aria-label={`Entfernung ${formatDistance(ort.distanceM)}`}
								>{formatDistance(ort.distanceM)}</span
							>
						</div>
						<div class="mt-0.5 flex flex-wrap items-center gap-1.5">
							<span
								class="inline-flex items-center rounded-sm bg-state-success/15 px-1 font-mono text-[10px] font-semibold text-state-success"
								>{statusText(ort.openingHours)}</span
							>
							<span class="font-mono text-[11px] text-ink-muted">{ort.cat}</span>
						</div>
						{#if ort.address}
							<p class="mt-0.5 font-serif text-xs text-ink-subtle">{ort.address}</p>
						{/if}
						<div class="mt-1 flex flex-wrap gap-3">
							<a
								href={ort.googleMapsUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="hover:text-accent-strong inline-flex items-center gap-1 font-sans text-xs text-accent underline underline-offset-2"
							>
								<Navigation size={11} aria-hidden="true" /> Google Maps
							</a>
							<a
								href={ort.appleMapsUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="hover:text-accent-strong inline-flex items-center gap-1 font-sans text-xs text-accent underline underline-offset-2"
							>
								<Navigation size={11} aria-hidden="true" /> Apple Maps
							</a>
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="font-serif text-sm text-ink-muted" data-testid="naehe-empty">
				Gerade sind keine offenen kühlen Orte in deiner Nähe. Auf der Karte siehst du alle,
				inklusive der geschlossenen.
			</p>
			<a
				href={explorerHref}
				class="hover:text-accent-strong inline-flex w-fit items-center gap-1.5 font-sans text-sm text-accent underline underline-offset-2"
			>
				<MapPin size={14} aria-hidden="true" /> Alle kühlen Orte auf der Karte
			</a>
		{/if}
	{:else}
		<p class="font-serif text-sm text-ink-muted" data-testid="naehe-fallback">
			{fallbackMessage(phase)}
		</p>
		<a
			href={explorerHref}
			class="hover:text-accent-strong inline-flex w-fit items-center gap-1.5 font-sans text-sm text-accent underline underline-offset-2"
		>
			<MapPin size={14} aria-hidden="true" /> Alle kühlen Orte auf der Karte
		</a>
	{/if}
</section>
