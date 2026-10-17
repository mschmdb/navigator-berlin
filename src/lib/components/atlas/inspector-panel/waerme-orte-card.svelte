<script lang="ts">
	import type { WaermeOrt } from '$lib/data/get-waerme-orte-index.js';
	import { Eye, EyeOff, ExternalLink, ChevronDown, Navigation, Flame, Mail } from '@lucide/svelte';
	import { buildOptOutMailto } from '$lib/utils/contact.js';
	import { announceGlobal } from '$lib/utils/aria-live.js';
	import { nearestWaermeOrte, waermeKategorien } from '$lib/kaelte/nearest-waerme-orte.js';
	import type { WaermeOrtMitDistanz } from '$lib/kaelte/nearest-waerme-orte.js';
	import { categoryLabel } from '$lib/components/kuehle-orte/category-label.js';
	import {
		checkedText,
		counterText,
		feeText,
		reportHref,
		statusClass,
		statusSourceOf,
		statusText,
		stayText,
		winterText
	} from '$lib/kaelte/waerme-ort-labels.js';
	import { getEditorialConfig } from '../internal/editorial-config.js';
	import { getLayerExplainEntry } from './internal/layer-explain.js';
	import { formatDistance } from './internal/format-distance.js';
	import EditorialDisclaimer from '../editorial-disclaimer.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, type Locale } from '$lib/paraglide/runtime';

	const SLUG = 'waerme-orte';
	const LIMIT = 5;

	type Props = {
		layerName: string;
		address: { lat: number; lng: number } | null;
		index: readonly WaermeOrt[] | null;
		isActive?: boolean;
		loadError?: boolean;
		onToggleLayer?: (slug: string) => void;
		lang?: Locale;
	};

	let {
		layerName,
		address,
		index,
		isActive = false,
		loadError = false,
		onToggleLayer,
		lang
	}: Props = $props();

	const locale = $derived(lang ?? getLocale());
	const localeOpts = $derived({ locale });
	const deLang = $derived(locale === 'de' ? undefined : 'de');

	let category = $state<string | null>(null);
	let onlyOpen = $state(false);
	let detailsOpen = $state(false);

	// Live-Uhr für den Öffnungsstatus, aktualisiert minütlich.
	let now = $state(new Date());
	$effect(() => {
		const id = setInterval(() => (now = new Date()), 60_000);
		return () => clearInterval(id);
	});

	const editorial = $derived(getEditorialConfig(SLUG));
	const explainEntry = $derived(getLayerExplainEntry(SLUG, localeOpts));
	const kategorien = $derived(index ? waermeKategorien(index) : []);
	const result = $derived(
		address && index
			? nearestWaermeOrte(address, index, { category, limit: LIMIT, now, onlyOpen })
			: { items: [] as WaermeOrtMitDistanz[], total: 0 }
	);

	const emptyText = $derived(
		onlyOpen
			? m.inspector_waerme_orte_empty_offen(undefined, localeOpts)
			: m.kaelte_orte_empty(undefined, localeOpts)
	);

	function announceResult(): void {
		announceGlobal(
			result.items.length === 0 ? emptyText : counterText(result.items.length, result.total, locale)
		);
	}

	function selectCategory(next: string | null): void {
		category = next;
		announceResult();
	}

	function toggleOnlyOpen(): void {
		onlyOpen = !onlyOpen;
		announceResult();
	}

	const linkClass =
		'hover:text-accent-strong inline-flex items-center gap-1 font-sans text-xs text-accent underline underline-offset-2';
	const chipBase =
		'inline-flex items-center rounded-full border px-2 py-0.5 font-sans text-xs transition-colors';
</script>

<section
	data-testid="waerme-orte-card"
	data-layer={SLUG}
	class="-mx-2 rounded border border-rule bg-bg-elevated px-2.5 py-2"
	aria-label={m.inspector_waerme_orte_aria_label({ layerName }, localeOpts)}
>
	<div class="flex items-start justify-between gap-2">
		<h4 class="flex min-w-0 items-center gap-1.5 font-sans text-sm font-semibold text-ink">
			<Flame size={15} aria-hidden="true" class="shrink-0 text-[#B45309]" />
			{layerName}
		</h4>
		<div class="flex shrink-0 items-center gap-1">
			{#if onToggleLayer}
				<button
					type="button"
					data-testid="map-toggle"
					aria-pressed={isActive}
					aria-label={isActive
						? m.inspector_common_map_toggle_remove_named({ layerName }, localeOpts)
						: m.inspector_common_map_toggle_add_named({ layerName }, localeOpts)}
					title={isActive
						? m.inspector_common_map_toggle_remove_title(undefined, localeOpts)
						: m.inspector_common_map_toggle_add_title(undefined, localeOpts)}
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

	{#if !isActive}
		<div class="mt-2.5 space-y-2" data-testid="waerme-orte-layer-off">
			<p class="font-serif text-sm text-ink-subtle">
				{m.inspector_waerme_orte_layer_off({ layerName }, localeOpts)}
			</p>
			{#if onToggleLayer}
				<button
					type="button"
					data-testid="waerme-orte-show-layer"
					onclick={() => onToggleLayer?.(SLUG)}
					class="inline-flex min-h-8 items-center gap-1.5 rounded bg-accent px-3 py-1 font-sans text-xs font-semibold text-bg-elevated hover:bg-accent-strong focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
				>
					<Eye size={14} aria-hidden="true" />
					{m.inspector_waerme_orte_layer_show(undefined, localeOpts)}
				</button>
			{/if}
		</div>
	{:else if loadError}
		<p class="mt-2.5 font-serif text-sm text-ink-subtle" data-testid="waerme-orte-load-error">
			{m.inspector_waerme_orte_load_error(undefined, localeOpts)}
		</p>
	{:else if !index}
		<p
			class="mt-2.5 font-serif text-sm text-ink-subtle italic"
			role="status"
			data-testid="waerme-orte-loading"
		>
			{m.inspector_waerme_orte_loading(undefined, localeOpts)}
		</p>
	{:else}
		<div
			class="mt-2 flex flex-wrap gap-1.5"
			role="group"
			aria-label={m.inspector_waerme_orte_filter_group_aria_label(undefined, localeOpts)}
		>
			<button
				type="button"
				data-testid="waerme-orte-filter-offen"
				aria-pressed={onlyOpen}
				onclick={toggleOnlyOpen}
				class={`${chipBase} ${onlyOpen ? 'border-accent bg-accent text-bg-elevated' : 'border-rule text-ink-muted hover:border-ink-subtle hover:text-ink'}`}
			>
				{m.inspector_kuehle_orte_filter_jetzt_offen(undefined, localeOpts)}
			</button>
			<span aria-hidden="true" class="mx-1 self-stretch border-l border-rule"></span>
			<button
				type="button"
				data-testid="waerme-orte-filter-all"
				aria-pressed={category === null}
				onclick={() => selectCategory(null)}
				class={`${chipBase} ${category === null ? 'border-accent bg-accent text-bg-elevated' : 'border-rule text-ink-muted hover:border-ink-subtle hover:text-ink'}`}
			>
				{m.kaelte_orte_filter_all(undefined, localeOpts)}
			</button>
			{#each kategorien as cat (cat)}
				{@const label = categoryLabel(cat, locale)}
				<button
					type="button"
					aria-pressed={category === cat}
					lang={label.lang}
					onclick={() => selectCategory(cat)}
					class={`${chipBase} ${category === cat ? 'border-accent bg-accent text-bg-elevated' : 'border-rule text-ink-muted hover:border-ink-subtle hover:text-ink'}`}
				>
					{label.text}
				</button>
			{/each}
		</div>

		{#if result.items.length > 0}
			<ul class="mt-2.5 space-y-2.5" data-testid="waerme-orte-list">
				{#each result.items as ort (ort.id)}
					{@const cat = categoryLabel(ort.cat, locale)}
					<li
						class="border-t border-rule pt-2 first:border-t-0 first:pt-0"
						data-testid="waerme-orte-item"
						data-cat={ort.cat}
					>
						<div class="flex items-baseline justify-between gap-2">
							<span class="min-w-0 font-sans text-sm font-medium text-ink" lang={deLang}
								>{ort.name}</span
							>
							<span class="shrink-0 font-mono text-xs text-ink-subtle tabular-nums">
								<span class="sr-only"
									>{m.naehe_distance_aria_label(
										{ distance: formatDistance(ort.distanceM, localeOpts) },
										localeOpts
									)}</span
								>
								<span aria-hidden="true">{formatDistance(ort.distanceM, localeOpts)}</span>
							</span>
						</div>
						<div class="mt-0.5 flex flex-wrap items-center gap-1">
							<span class="font-mono text-[11px] text-ink-muted" lang={cat.lang}>{cat.text}</span>
							{#if ort.status}
								<span
									class={`inline-flex items-center rounded-sm px-1 font-mono text-[10px] font-semibold ${statusClass(ort.status)} bg-bg`}
									data-testid="waerme-orte-status"
									>{statusText(ort.status, statusSourceOf(ort), locale)}</span
								>
							{/if}
						</div>
						{#if ort.address}
							<p class="mt-0.5 font-serif text-xs text-ink-subtle" lang={deLang}>
								{ort.address}{ort.plz ? `, ${ort.plz}` : ''}
							</p>
						{/if}
						<ul class="mt-0.5 font-sans text-xs text-ink-muted">
							<li>{winterText(ort.winterOpen, locale)}</li>
							<li>{stayText(ort.stayWithoutPurchase, locale)}</li>
							<li>{feeText(ort.isFree, locale)}</li>
							{#if ort.openingHoursNote}
								<li>
									{m.kaelte_orte_zeiten(undefined, localeOpts)}:
									<span lang={deLang}>{ort.openingHoursNote}</span>
								</li>
							{/if}
						</ul>
						<p class="mt-0.5 font-sans text-[11px] text-ink-subtle">
							{#if ort.sourceUrl}
								<a
									href={ort.sourceUrl}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={`${m.kaelte_orte_quelle_aria({ name: ort.name }, localeOpts)} ${m.kaelte_new_tab_hint(undefined, localeOpts)}`}
									class="underline underline-offset-2 hover:text-ink"
									>{m.kaelte_orte_quelle(undefined, localeOpts)}</a
								>
							{:else}
								{m.kaelte_orte_ohne_quelle(undefined, localeOpts)}
							{/if}
							{#if ort.checkedAt}
								· {checkedText(ort.checkedAt, locale)}
							{/if}
						</p>
						<div class="mt-1 flex flex-wrap gap-x-3 gap-y-1">
							<a
								href={ort.googleMapsUrl}
								target="_blank"
								rel="noopener noreferrer"
								data-testid="navi-google"
								aria-label={`${m.kaelte_orte_route_google({ name: ort.name }, localeOpts)} ${m.kaelte_new_tab_hint(undefined, localeOpts)}`}
								class={linkClass}
							>
								<Navigation size={11} aria-hidden="true" />
								Google Maps
							</a>
							<a
								href={ort.appleMapsUrl}
								target="_blank"
								rel="noopener noreferrer"
								data-testid="navi-apple"
								aria-label={`${m.kaelte_orte_route_apple({ name: ort.name }, localeOpts)} ${m.kaelte_new_tab_hint(undefined, localeOpts)}`}
								class={linkClass}
							>
								<Navigation size={11} aria-hidden="true" />
								Apple Maps
							</a>
							<a
								href={reportHref(ort, locale)}
								data-testid="waerme-orte-melden"
								aria-label={m.kaelte_orte_melden_aria({ name: ort.name }, localeOpts)}
								class={linkClass}
							>
								<Mail size={11} aria-hidden="true" />
								{m.kaelte_orte_melden(undefined, localeOpts)}
							</a>
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="mt-2.5 font-serif text-sm text-ink-subtle" data-testid="waerme-orte-empty">
				{emptyText}
			</p>
		{/if}
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
			{m.inspector_common_details_toggle(undefined, localeOpts)}
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
					class={`${linkClass} w-fit`}
				>
					<ExternalLink size={12} aria-hidden="true" />
					{m.inspector_kuehle_orte_source_view(undefined, localeOpts)}
				</a>
			{/if}
			{#each editorial?.disclaimerVariants ?? [] as variant (variant)}
				<EditorialDisclaimer {variant} sourceUrl={editorial?.primarySourceUrl} {locale} />
			{/each}
			<a
				href={buildOptOutMailto({ kind: 'waerme-orte' })}
				data-testid="card-opt-out"
				aria-label={m.inspector_waerme_orte_opt_out_aria_label(undefined, localeOpts)}
				class={`${linkClass} w-fit`}
			>
				<Mail size={12} aria-hidden="true" />
				{m.inspector_waerme_orte_opt_out_link(undefined, localeOpts)}
			</a>
		</div>
	{/if}
</section>
