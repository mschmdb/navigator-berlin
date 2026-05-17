<script lang="ts">
	import { Share2, X, Bookmark, BookmarkCheck, Check, GitCompare } from '@lucide/svelte';
	import type { LayerMetadata } from '$lib/data';
	import {
		getUiState,
		toggleLayer,
		addBookmark,
		toggleCompareMode,
		openBookmarksDialog
	} from '$lib/state/ui-context.svelte.js';
	import { featureFlags } from '$lib/data/feature-flags.js';
	import {
		createBookmark,
		isBookmarked,
		persistBookmarks
	} from '$lib/state/bookmark-store.js';
	import LayerHitRow from './inspector-panel/layer-hit-row.svelte';
	import ShareSheet from './inspector-panel/share-sheet.svelte';
	import KlimaSection from './inspector-panel/klima-section.svelte';
	import NearestStopsCard from './inspector-panel/nearest-stops-card.svelte';
	import KiezScoreSection from './inspector-panel/kiez-score-section.svelte';
	import { groupHitsBySection } from './inspector-panel/internal/sections.js';
	import { applyApplicabilityReasons } from './inspector-panel/internal/applicability.js';
	import { getLayerDisplayName } from './internal/layer-palette-filter.js';
	import { extractStreetName, formatAddressSubline } from './internal/address-subline.js';
	import { scrollToLayerHitRow } from './inspector-panel/internal/scroll-to-layer-row.js';
	import {
		findAllNearestStops,
		findAllNearestStopsWithSoft
	} from './inspector-panel/internal/nearest-oepnv-stop.js';
	import { getMobilityRating } from './inspector-panel/internal/mobility-rating.js';
	import { isResidentialLocation } from './inspector-panel/internal/residential-location.js';
	import { buildLlmExportMarkdown } from '$lib/utils/llm-export-builder.js';
	import { buildOgImageUrl } from '$lib/utils/og-image-url.js';
	import { formatLayerValue } from './inspector-panel/internal/value-formatters.js';
	import { page } from '$app/state';

	type Props = {
		layerMeta?: readonly LayerMetadata[];
		lang?: string;
		variant?: 'panel' | 'sheet';
		mountId?: string;
	};

	let {
		layerMeta = [],
		lang = 'de',
		variant = 'panel',
		mountId = crypto.randomUUID()
	}: Props = $props();

	const ui = getUiState();

	const enrichedHits = $derived(applyApplicabilityReasons(ui.selectedLayerHits));
	const sections = $derived(groupHitsBySection(enrichedHits, layerMeta));

	const EMPTY_SECTIONS_KEY = 'nav.inspector.showEmptySections';
	let showEmptySections = $state(false);

	$effect(() => {
		if (typeof window === 'undefined') return;
		try {
			showEmptySections = window.localStorage.getItem(EMPTY_SECTIONS_KEY) === '1';
		} catch {
			showEmptySections = false;
		}
	});

	function toggleEmptySections(): void {
		showEmptySections = !showEmptySections;
		if (typeof window === 'undefined') return;
		try {
			window.localStorage.setItem(EMPTY_SECTIONS_KEY, showEmptySections ? '1' : '0');
		} catch {
			// localStorage may be unavailable (private mode); state stays in-memory.
		}
	}

	function close(): void {
		ui.inspectorOpen = false;
	}

	const addressBookmarked = $derived.by(() => {
		if (!ui.selectedAddress) return false;
		return isBookmarked(
			{ schemaVersion: 1, bookmarks: ui.bookmarks },
			ui.selectedAddress.lat,
			ui.selectedAddress.lng
		);
	});

	let inspectorSaveJustHappened = $state(false);
	let inspectorSaveTimer: ReturnType<typeof setTimeout> | null = null;

	function handleInspectorBookmark(): void {
		const addr = ui.selectedAddress;
		if (!addr) return;
		if (addressBookmarked) {
			openBookmarksDialog(ui);
			return;
		}
		const bm = createBookmark({
			displayName: addr.displayName,
			lat: addr.lat,
			lng: addr.lng,
			bezirk: addr.bezirk,
			postcode: addr.postcode
		});
		const ok = addBookmark(ui, bm);
		if (!ok) return;
		persistBookmarks(typeof window === 'undefined' ? null : localStorage, {
			schemaVersion: 1,
			bookmarks: ui.bookmarks
		});
		inspectorSaveJustHappened = true;
		if (inspectorSaveTimer) clearTimeout(inspectorSaveTimer);
		inspectorSaveTimer = setTimeout(() => {
			inspectorSaveJustHappened = false;
			inspectorSaveTimer = null;
		}, 1800);
	}

	const addressName = $derived(ui.selectedAddress?.displayName ?? '');
	const addressPrimary = $derived(
		ui.selectedAddress ? extractStreetName(ui.selectedAddress) : ''
	);
	const addressSubline = $derived(
		ui.selectedAddress ? formatAddressSubline(ui.selectedAddress) : ''
	);

	let shareOpen = $state(false);
	let shareTriggerEl: HTMLButtonElement | undefined = $state();

	function openShare(): void {
		shareOpen = true;
	}

	function closeShare(): void {
		shareOpen = false;
		shareTriggerEl?.focus();
	}

	function currentHref(): string {
		if (typeof window === 'undefined') return '';
		return window.location.href;
	}

	function currentOrigin(): string {
		if (typeof window === 'undefined') return '';
		return window.location.origin;
	}

	const ogImageInput = $derived.by(() => {
		const addr = ui.selectedAddress;
		if (!addr) return null;
		const topLayers: string[] = [];
		for (const hit of enrichedHits) {
			if (topLayers.length >= 3) break;
			const formatted = formatLayerValue(hit.layer, hit.value);
			if (formatted.text === 'Daten nicht vorhanden') continue;
			topLayers.push(`${getLayerDisplayName(hit.layer)}: ${formatted.text}`);
		}
		return {
			address: addr.displayName,
			lat: addr.lat,
			lng: addr.lng,
			bezirk: addr.bezirk,
			topLayers
		};
	});

	const isResidential = $derived(isResidentialLocation(ui.selectedLayerHits));

	const llmMarkdown = $derived.by(() => {
		const addr = ui.selectedAddress;
		if (!addr) return '';
		const point = { lat: addr.lat, lng: addr.lng };
		const nearest = ui.oepnvStopIndex
			? isResidential
				? findAllNearestStopsWithSoft(point, ui.oepnvStopIndex)
				: findAllNearestStops(point, ui.oepnvStopIndex)
			: null;
		return buildLlmExportMarkdown({
			address: {
				displayName: addr.displayName,
				lat: addr.lat,
				lng: addr.lng,
				bezirk: addr.bezirk,
				postcode: addr.postcode
			},
			permalinkUrl: shareOpen ? currentHref() : '',
			generatedAt: new Date().toISOString(),
			layerHits: enrichedHits,
			layerMeta,
			climate: ui.nearestStation ? { station: ui.nearestStation, series: ui.climateSeries } : null,
			oepnv: nearest
				? { nearest, rating: getMobilityRating(nearest, { isResidential }) }
				: null,
			kiezScore: ui.kiezScore
		});
	});

	const ogImageUrl = $derived(shareOpen ? buildOgImageUrl(ogImageInput, currentOrigin()) : null);
	const permalinkUrl = $derived(shareOpen ? currentHref() : '');
	const nativeShareData = $derived<ShareData>({
		title: addressName ? `${addressName} · Berlin Navigator` : 'Berlin Navigator',
		text: ogImageInput?.topLayers.join(' · ') ?? '',
		url: permalinkUrl || currentHref()
	});

	let panelEl: HTMLElement | undefined = $state();

	$effect(() => {
		const target = ui.scrollToLayerSlug;
		if (!target || !panelEl) return;
		const reduced =
			typeof window !== 'undefined' &&
			window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
		queueMicrotask(() => {
			scrollToLayerHitRow(panelEl ?? null, target, { reducedMotion: reduced ?? false });
			ui.scrollToLayerSlug = null;
		});
	});

	const nearestAddressPoint = $derived(
		ui.selectedAddress
			? { lat: ui.selectedAddress.lat, lng: ui.selectedAddress.lng }
			: null
	);

	const hasNearestStops = $derived.by(() => {
		if (!nearestAddressPoint || !ui.oepnvStopIndex) return false;
		const result = isResidential
			? findAllNearestStopsWithSoft(nearestAddressPoint, ui.oepnvStopIndex)
			: findAllNearestStops(nearestAddressPoint, ui.oepnvStopIndex);
		return !!(result.ubahn || result.sbahn || result.tram || result.bus);
	});

	function shouldRenderSection(sectionKey: string, hitCount: number): boolean {
		if (sectionKey === 'klima') return true;
		if (sectionKey === 'mobilitaet' && hasNearestStops) return true;
		if (hitCount > 0) return true;
		return showEmptySections;
	}
</script>

{#if ui.inspectorOpen && ui.selectedAddress}
	<section
		bind:this={panelEl}
		aria-live="polite"
		aria-atomic="false"
		aria-label={`Layer-Daten für ${addressName}`}
		data-testid="inspector-panel"
		data-mount-id={mountId}
		data-variant={variant}
		class="flex h-full flex-col overflow-x-hidden overflow-y-auto bg-bg-elevated text-ink"
	>
		<header
			class="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-rule bg-bg-elevated px-6 pb-4 pt-5"
		>
			<div class="min-w-0">
				<h2
					class="font-serif text-xl leading-tight text-ink"
					data-testid="inspector-address"
					title={addressName}
				>
					{addressPrimary || addressName}
				</h2>
				{#if addressSubline}
					<p
						data-testid="inspector-address-subline"
						class="font-sans text-sm text-ink-muted"
					>
						{addressSubline}
					</p>
				{/if}
			</div>
			<button
				type="button"
				onclick={close}
				data-testid="inspector-close"
				aria-label="Inspektor schließen"
				class="rounded-sm p-1 text-ink-muted hover:text-ink"
			>
				<X size={18} aria-hidden="true" />
			</button>
		</header>

		<div
			data-testid="inspector-toolbar"
			class="sticky top-[var(--header-height,56px)] z-10 flex items-center justify-end gap-3 border-b border-rule bg-bg-elevated px-6 py-2"
		>
			<div class="flex items-center gap-3">
				<button
					type="button"
					data-testid="inspector-bookmark-trigger"
					data-bookmarked={addressBookmarked ? 'true' : 'false'}
					onclick={handleInspectorBookmark}
					aria-label={addressBookmarked
						? 'Adresse ist gespeichert · Bookmark-Liste öffnen'
						: 'Adresse als Bookmark speichern'}
					class="inline-flex items-center gap-1.5 border-b border-rule-strong text-sm text-ink hover:text-ink"
				>
					{#if inspectorSaveJustHappened}
						<Check size={14} aria-hidden="true" />
						<span data-testid="inspector-bookmark-confirmation">Gespeichert</span>
					{:else if addressBookmarked}
						<BookmarkCheck size={14} aria-hidden="true" />
						<span>Gespeichert</span>
					{:else}
						<Bookmark size={14} aria-hidden="true" />
						<span>Bookmark</span>
					{/if}
				</button>
				{#if featureFlags.compareMode}
					<button
						type="button"
						onclick={() => toggleCompareMode(ui)}
						data-testid="compare-trigger"
						aria-label="Mit Adresse vergleichen"
						aria-pressed={ui.compareMode}
						class="inline-flex items-center gap-1.5 border-b border-rule-strong text-sm text-ink hover:text-ink"
					>
						<GitCompare size={14} aria-hidden="true" />
						<span>Vergleichen</span>
					</button>
				{/if}
				<div class="relative">
					<button
						type="button"
						bind:this={shareTriggerEl}
						onclick={openShare}
						aria-haspopup="dialog"
						aria-expanded={shareOpen}
						aria-controls="inspector-share-sheet"
						data-testid="share-sheet-trigger"
						class="inline-flex items-center gap-1.5 border-b border-rule-strong text-sm text-ink hover:text-ink"
					>
						<Share2 size={14} aria-hidden="true" />
						<span>Teilen</span>
					</button>
					<div id="inspector-share-sheet">
						<ShareSheet
							open={shareOpen}
							onClose={closeShare}
							{permalinkUrl}
							llmExportText={llmMarkdown}
							{ogImageUrl}
							{addressName}
							variant={variant === 'sheet' ? 'sheet' : 'popover'}
							{nativeShareData}
						/>
					</div>
				</div>
			</div>
		</div>

		<div
			data-testid="inspector-toggle-row"
			class="flex items-center justify-end border-b border-rule px-6 py-1"
		>
			<button
				type="button"
				data-testid="toggle-empty-sections"
				aria-pressed={showEmptySections}
				onclick={toggleEmptySections}
				class="font-mono text-xs text-ink-subtle underline-offset-2 hover:text-ink hover:underline"
			>
				{showEmptySections ? 'Leere Sektionen ausblenden' : 'Leere Sektionen einblenden'}
			</button>
		</div>

		<div class="flex-1 space-y-4 px-6 py-4">
			<KiezScoreSection score={ui.kiezScore} />
			{#each sections as section (section.key)}
				{#if shouldRenderSection(section.key, section.hits.length)}
					<section
						data-testid={`section-${section.key}`}
						data-section={section.key}
						class="border-t border-rule pt-4"
					>
						<h3
							class="mb-3 flex items-baseline gap-2 font-sans text-xs font-semibold uppercase tracking-wide text-ink-muted"
							data-testid={`section-header-${section.key}`}
						>
							<span>{section.label}</span>
							{#if section.hits.length > 0}
								<span
									class="font-mono tabular-nums text-ink-subtle"
									data-testid={`section-count-${section.key}`}>{section.hits.length}</span
								>
							{/if}
						</h3>
						<div class="mt-2 space-y-3">
							{#if section.key === 'mobilitaet'}
								<NearestStopsCard
									address={nearestAddressPoint}
									index={ui.oepnvStopIndex}
									{isResidential}
								/>
							{/if}
							{#if section.key === 'klima'}
								<KlimaSection station={ui.nearestStation} series={ui.climateSeries} />
							{:else if section.hits.length === 0 && section.key !== 'mobilitaet'}
								<p
									class="py-2 font-mono text-xs text-ink-subtle"
									data-testid={`section-${section.key}-empty`}
								>
									{section.label} · keine Daten an dieser Adresse
								</p>
							{:else if section.hits.length > 0}
								<div class="divide-y divide-rule">
									{#each section.hits as hit (hit.layer)}
										<LayerHitRow
											{hit}
											layerName={getLayerDisplayName(hit.layer)}
											{lang}
											lat={ui.selectedAddress?.lat}
											lng={ui.selectedAddress?.lng}
											isActive={ui.activeLayerSlugs.includes(hit.layer)}
											onToggleLayer={(slug: string) => toggleLayer(ui, slug)}
										/>
									{/each}
								</div>
							{/if}
						</div>
					</section>
				{/if}
			{/each}
		</div>

		<div data-testid="inspector-print-meta">
			<p>{addressName}</p>
			<p>navigator.berlin · {new Date().toLocaleDateString('de-DE')}</p>
			<p>{page.url.toString()}</p>
		</div>

	</section>
{/if}
