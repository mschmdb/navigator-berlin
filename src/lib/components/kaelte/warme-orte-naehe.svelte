<script lang="ts">
	import { tick } from 'svelte';
	import { LocateFixed, Navigation, Mail, ExternalLink } from '@lucide/svelte';
	import { requestPosition, type PositionResult } from '$lib/utils/geolocation.js';
	import { announceGlobal } from '$lib/utils/aria-live.js';
	import { formatDistance } from '$lib/components/atlas/inspector-panel/internal/format-distance.js';
	import { getWaermeOrteIndex, type WaermeOrt } from '$lib/data/get-waerme-orte-index.js';
	import {
		nearestWaermeOrte,
		waermeKategorien,
		type WaermeOrtMitDistanz
	} from '$lib/kaelte/nearest-waerme-orte.js';
	import { categoryLabel } from '$lib/components/kuehle-orte/category-label.js';
	import {
		checkedText,
		counterText,
		feeText,
		reportHref,
		statusClass,
		statusText,
		stayText,
		winterText
	} from '$lib/kaelte/waerme-ort-labels.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	type Phase = 'idle' | 'locating' | 'ready' | 'denied' | 'unsupported' | 'error' | 'load-error';

	type Props = {
		// Injizierbar für Tests, sonst die echten Implementierungen.
		requestPositionFn?: () => Promise<PositionResult>;
		loadIndex?: () => Promise<WaermeOrt[]>;
		now?: Date;
	};

	let {
		requestPositionFn = requestPosition,
		loadIndex = getWaermeOrteIndex,
		now: nowProp
	}: Props = $props();

	const LIMIT = 5;
	let phase = $state<Phase>('idle');
	let position = $state<{ lat: number; lng: number } | null>(null);
	let index = $state<WaermeOrt[]>([]);
	let category = $state<string | null>(null);
	let headingEl = $state<HTMLElement>();
	let messageEl = $state<HTMLElement>();

	// Live-Uhr: der Status nutzt die aktuelle Zeit. Test-Injection fixiert sie.
	let liveNow = $state(new Date());
	$effect(() => {
		if (nowProp) return;
		const id = setInterval(() => (liveNow = new Date()), 60_000);
		return () => clearInterval(id);
	});
	const now = $derived(nowProp ?? liveNow);

	const locale = $derived(getLocale());
	const kategorien = $derived(waermeKategorien(index));
	const result = $derived(
		position
			? nearestWaermeOrte(position, index, { category, limit: LIMIT, now })
			: { items: [] as WaermeOrtMitDistanz[], total: 0 }
	);

	function fallbackMessage(reason: 'denied' | 'unsupported' | 'error'): string {
		switch (reason) {
			case 'denied':
				return m.kaelte_orte_fallback_denied();
			case 'unsupported':
				return m.kaelte_orte_fallback_unsupported();
			case 'error':
				return m.kaelte_orte_fallback_error();
		}
	}

	function resultCounter(): string {
		return counterText(result.items.length, result.total);
	}

	// Der auslösende Button verschwindet beim Phasenwechsel. Der Fokus wandert auf das neue Ziel.
	async function moveFocus(): Promise<void> {
		await tick();
		(phase === 'ready' ? headingEl : messageEl)?.focus();
	}

	async function loadIndexForPosition(): Promise<void> {
		phase = 'locating';
		const loaded = await loadIndex().catch(() => null);
		if (!loaded) {
			phase = 'load-error';
			announceGlobal(m.kaelte_orte_load_error());
			await moveFocus();
			return;
		}
		index = loaded;
		phase = 'ready';
		if (loaded.length > 0) announceGlobal(resultCounter());
		await moveFocus();
	}

	async function locate(): Promise<void> {
		phase = 'locating';
		announceGlobal(m.kaelte_orte_announce_locating());
		const pos = await requestPositionFn().catch(
			(): PositionResult => ({ ok: false, reason: 'error' })
		);
		if (!pos.ok) {
			phase = pos.reason;
			announceGlobal(fallbackMessage(pos.reason));
			await moveFocus();
			return;
		}
		position = { lat: pos.lat, lng: pos.lng };
		await loadIndexForPosition();
	}

	// Nach einem Ladefehler genügt es, den Index neu zu laden. Ohne Position startet die Ortung neu.
	function retry(): Promise<void> {
		return phase === 'load-error' && position ? loadIndexForPosition() : locate();
	}

	function selectCategory(next: string | null): void {
		category = next;
		announceGlobal(resultCounter());
	}

	function distanceText(distanceM: number): string {
		return formatDistance(distanceM, { locale });
	}

	const buttonClass =
		'hover:bg-accent-strong inline-flex min-h-11 w-fit items-center gap-2 rounded bg-accent px-5 py-3 font-sans text-base font-semibold text-bg-elevated focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60';
	const linkClass =
		'hover:text-accent-strong inline-flex min-h-11 items-center gap-1.5 font-sans text-sm text-accent underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
	const chipClass =
		'inline-flex min-h-11 items-center rounded border px-3 py-1.5 font-sans text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
</script>

<section
	aria-labelledby="waerme-naehe-h"
	class="flex flex-col gap-3"
	data-testid="waerme-orte-naehe"
>
	<h2
		id="waerme-naehe-h"
		bind:this={headingEl}
		tabindex="-1"
		class="font-sans text-2xl font-semibold text-ink focus:outline-none"
	>
		{m.kaelte_orte_heading()}
	</h2>

	{#if phase === 'idle' || phase === 'locating'}
		<button
			type="button"
			data-testid="waerme-locate"
			disabled={phase === 'locating'}
			onclick={locate}
			class={buttonClass}
		>
			<LocateFixed size={18} aria-hidden="true" />
			{phase === 'locating' ? m.kaelte_orte_button_locating() : m.kaelte_orte_button_locate()}
		</button>
		<p class="font-serif text-sm text-ink-subtle">{m.kaelte_orte_hint()}</p>
	{:else if phase === 'ready' && index.length === 0}
		<p
			class="font-serif text-sm text-ink-muted"
			tabindex="-1"
			bind:this={messageEl}
			data-testid="waerme-keine-daten"
		>
			{m.kaelte_orte_keine_verfuegbar()}
		</p>
		<button type="button" data-testid="waerme-retry" onclick={retry} class={buttonClass}>
			{m.kaelte_orte_retry()}
		</button>
	{:else if phase === 'ready'}
		<div
			role="group"
			aria-labelledby="waerme-filter-h"
			class="flex flex-col gap-2"
			data-testid="waerme-filter"
		>
			<p id="waerme-filter-h" class="font-sans text-sm font-medium text-ink">
				{m.kaelte_orte_filter_label()}
			</p>
			<div class="flex flex-wrap gap-2">
				<button
					type="button"
					aria-pressed={category === null}
					onclick={() => selectCategory(null)}
					class={`${chipClass} ${category === null ? 'border-accent bg-accent text-bg-elevated' : 'border-rule text-ink hover:border-ink-subtle'}`}
					>{m.kaelte_orte_filter_all()}</button
				>
				{#each kategorien as cat (cat)}
					{@const label = categoryLabel(cat)}
					<button
						type="button"
						aria-pressed={category === cat}
						onclick={() => selectCategory(cat)}
						lang={label.lang}
						class={`${chipClass} ${category === cat ? 'border-accent bg-accent text-bg-elevated' : 'border-rule text-ink hover:border-ink-subtle'}`}
						>{label.text}</button
					>
				{/each}
			</div>
		</div>

		<p class="font-sans text-sm text-ink-muted" data-testid="waerme-zaehler">
			{resultCounter()}
		</p>

		{#if result.items.length > 0}
			<ul class="flex flex-col gap-3" data-testid="waerme-list">
				{#each result.items as ort (ort.id)}
					{@const cat = categoryLabel(ort.cat)}
					<li
						data-testid="waerme-ort"
						data-cat={ort.cat}
						class="flex flex-col gap-1.5 rounded border border-rule bg-bg-elevated px-3 py-2.5"
					>
						<div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
							<h3 class="min-w-0 font-sans text-base font-semibold text-ink">
								<span lang={locale === 'de' ? undefined : 'de'}>{ort.name}</span>
							</h3>
							<span class="shrink-0 font-mono text-sm text-ink-muted tabular-nums">
								<span class="sr-only"
									>{m.naehe_distance_aria_label({ distance: distanceText(ort.distanceM) })}</span
								>
								<span aria-hidden="true">{distanceText(ort.distanceM)}</span>
							</span>
						</div>
						<p class="flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-sm text-ink-muted">
							<span lang={cat.lang}>{cat.text}</span>
							{#if ort.status}
								<span data-testid="waerme-status" class={`font-medium ${statusClass(ort.status)}`}
									>{statusText(ort.status)}</span
								>
							{/if}
						</p>
						{#if ort.address}
							<p
								class="font-serif text-sm text-ink-muted"
								lang={locale === 'de' ? undefined : 'de'}
							>
								{ort.address}{ort.plz ? `, ${ort.plz}` : ''}
							</p>
						{/if}
						<ul class="flex flex-col gap-0.5 font-sans text-sm text-ink">
							<li>{winterText(ort.winterOpen)}</li>
							<li>{stayText(ort.stayWithoutPurchase)}</li>
							<li>{feeText(ort.isFree)}</li>
							{#if ort.openingHoursNote}
								<li>
									{m.kaelte_orte_zeiten()}:
									<span lang={locale === 'de' ? undefined : 'de'}>{ort.openingHoursNote}</span>
								</li>
							{/if}
						</ul>
						<p class="font-sans text-xs text-ink-subtle">
							{#if ort.sourceUrl}
								<a
									href={ort.sourceUrl}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={`${m.kaelte_orte_quelle_aria({ name: ort.name })} ${m.kaelte_new_tab_hint()}`}
									class="underline underline-offset-2 hover:text-ink">{m.kaelte_orte_quelle()}</a
								>
							{:else}
								{m.kaelte_orte_ohne_quelle()}
							{/if}
							{#if ort.checkedAt}
								· {checkedText(ort.checkedAt)}
							{/if}
						</p>
						{#if ort.website && ort.website !== ort.sourceUrl}
							<a
								href={ort.website}
								target="_blank"
								rel="noopener noreferrer"
								data-testid="waerme-website"
								aria-label={`${m.kaelte_orte_website_aria({ name: ort.name })} ${m.kaelte_new_tab_hint()}`}
								class={`${linkClass} w-fit`}
							>
								<ExternalLink size={14} aria-hidden="true" />
								{m.kaelte_orte_website()}
							</a>
						{/if}
						<div class="flex flex-wrap gap-x-4">
							<a
								href={ort.googleMapsUrl}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={`${m.kaelte_orte_route_google({ name: ort.name })} ${m.kaelte_new_tab_hint()}`}
								class={linkClass}
							>
								<Navigation size={14} aria-hidden="true" /> Google Maps
							</a>
							<a
								href={ort.appleMapsUrl}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={`${m.kaelte_orte_route_apple({ name: ort.name })} ${m.kaelte_new_tab_hint()}`}
								class={linkClass}
							>
								<Navigation size={14} aria-hidden="true" /> Apple Maps
							</a>
							<a
								href={reportHref(ort)}
								data-testid="waerme-melden"
								aria-label={m.kaelte_orte_melden_aria({ name: ort.name })}
								class={linkClass}
							>
								<Mail size={14} aria-hidden="true" />
								{m.kaelte_orte_melden()}
							</a>
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="font-serif text-sm text-ink-muted" data-testid="waerme-empty">
				{m.kaelte_orte_empty()}
			</p>
		{/if}
		<button type="button" data-testid="waerme-refresh" onclick={locate} class={buttonClass}>
			<LocateFixed size={18} aria-hidden="true" />
			{m.kaelte_orte_refresh()}
		</button>
	{:else if phase === 'load-error'}
		<p
			class="font-serif text-sm text-ink-muted"
			tabindex="-1"
			bind:this={messageEl}
			data-testid="waerme-load-error"
		>
			{m.kaelte_orte_load_error()}
		</p>
		<button type="button" data-testid="waerme-retry" onclick={retry} class={buttonClass}>
			{m.kaelte_orte_retry()}
		</button>
	{:else}
		<p
			class="font-serif text-sm text-ink-muted"
			tabindex="-1"
			bind:this={messageEl}
			data-testid="waerme-fallback"
		>
			{fallbackMessage(phase)}
		</p>
		{#if phase !== 'unsupported'}
			<button type="button" data-testid="waerme-retry" onclick={retry} class={buttonClass}>
				{m.kaelte_orte_retry()}
			</button>
		{/if}
	{/if}
</section>
