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
	import { formatDistance } from '$lib/components/atlas/inspector-panel/internal/format-distance.js';
	import { m } from '$lib/paraglide/messages.js';
	import { categoryLabel } from './category-label.js';
	import { getLocale } from '$lib/paraglide/runtime';

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
		now: nowProp
	}: Props = $props();

	const LIMIT = 5;
	let phase = $state<Phase>('idle');
	let results = $state<KuehleOrtMitDistanz[]>([]);

	// Live-Uhr, damit der jetzt-offen-Filter die Klick-Zeit nutzt, nicht die Seitenaufruf-Zeit.
	// Test-Injection (nowProp) fixiert die Zeit und schaltet den Minutentakt ab.
	let liveNow = $state(new Date());
	$effect(() => {
		if (nowProp) return;
		const id = setInterval(() => (liveNow = new Date()), 60_000);
		return () => clearInterval(id);
	});
	const now = $derived(nowProp ?? liveNow);

	type FallbackReason = 'denied' | 'unsupported' | 'error';

	function fallbackMessage(reason: FallbackReason): string {
		switch (reason) {
			case 'denied':
				return m.naehe_fallback_denied();
			case 'unsupported':
				return m.naehe_fallback_unsupported();
			case 'error':
				return m.naehe_fallback_error();
		}
	}

	function foundAnnouncement(count: number): string {
		return count === 1
			? m.naehe_announce_found_singular({ count })
			: m.naehe_announce_found_plural({ count });
	}

	function distanceLabel(distanceM: number): string {
		return formatDistance(distanceM, { locale: getLocale() });
	}

	async function locate(): Promise<void> {
		phase = 'locating';
		announceGlobal(m.naehe_announce_locating());
		const pos = await requestPositionFn();
		if (!pos.ok) {
			phase = pos.reason;
			announceGlobal(fallbackMessage(pos.reason));
			return;
		}
		const index = await loadIndex().catch(() => null);
		if (!index) {
			phase = 'error';
			announceGlobal(fallbackMessage('error'));
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
			results.length > 0 ? foundAnnouncement(results.length) : m.naehe_announce_none()
		);
	}

	function statusText(oh: string): string {
		const s = getOpeningStatus(oh, now);
		return s === 'closing-soon' ? m.naehe_status_closing_soon() : m.naehe_status_open_now();
	}
</script>

<section aria-labelledby="naehe-h" class="flex flex-col gap-3" data-testid="in-deiner-naehe">
	<h2 id="naehe-h" class="font-sans text-2xl font-semibold text-ink">{m.naehe_heading()}</h2>

	{#if phase === 'idle' || phase === 'locating'}
		<button
			type="button"
			data-testid="naehe-locate"
			disabled={phase === 'locating'}
			onclick={locate}
			class="hover:bg-accent-strong inline-flex min-h-11 w-fit items-center gap-2 rounded bg-accent px-5 py-3 font-sans text-base font-semibold text-bg-elevated focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
		>
			<LocateFixed size={18} aria-hidden="true" />
			{phase === 'locating' ? m.naehe_button_locating() : m.naehe_button_locate()}
		</button>
		<p class="font-serif text-sm text-ink-subtle">
			{m.naehe_hint()}
		</p>
	{:else if phase === 'ready'}
		{#if results.length > 0}
			<ul class="flex flex-col gap-3" data-testid="naehe-list">
				{#each results as ort (ort.id)}
					{@const cat = categoryLabel(ort.cat)}
					<li class="border-t border-rule pt-3 first:border-t-0 first:pt-0">
						<div class="flex items-baseline justify-between gap-2">
							<span class="min-w-0 truncate font-sans text-sm font-medium text-ink">{ort.name}</span
							>
							<span
								class="shrink-0 font-mono text-xs text-ink-subtle tabular-nums"
								aria-label={m.naehe_distance_aria_label({ distance: distanceLabel(ort.distanceM) })}
								>{distanceLabel(ort.distanceM)}</span
							>
						</div>
						<div class="mt-0.5 flex flex-wrap items-center gap-1.5">
							<span
								class="inline-flex items-center rounded-sm bg-state-success/15 px-1 font-mono text-[10px] font-semibold text-state-success"
								>{statusText(ort.openingHours)}</span
							>
							<span class="font-mono text-[11px] text-ink-muted" lang={cat.lang}>{cat.text}</span>
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
				{m.naehe_empty()}
			</p>
			<a
				href={explorerHref}
				class="hover:text-accent-strong inline-flex w-fit items-center gap-1.5 font-sans text-sm text-accent underline underline-offset-2"
			>
				<MapPin size={14} aria-hidden="true" />
				{m.naehe_link_all_on_map()}
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
			<MapPin size={14} aria-hidden="true" />
			{m.naehe_link_all_on_map()}
		</a>
	{/if}
</section>
