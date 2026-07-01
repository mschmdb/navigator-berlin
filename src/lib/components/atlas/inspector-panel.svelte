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
	import { createBookmark, isBookmarked, persistBookmarks } from '$lib/state/bookmark-store.js';
	import {
		createInspectorLevelState,
		resolveSpatialContext,
		applySpatialContext
	} from '$lib/state/inspector-level-context.svelte.js';
	import LayerHitRow from './inspector-panel/layer-hit-row.svelte';
	import KlimaPetCard from './inspector-panel/klima-pet-card.svelte';
	import LayerCard, { type ContextRow } from './inspector-panel/layer-card.svelte';
	import { loadLayerAggregates } from '$lib/data/get-layer-aggregates.js';
	import {
		loadRegionComposites,
		regionComposite,
		type RegionComposites
	} from '$lib/data/get-region-composites.js';
	import type {
		LayerAggregate,
		LayerAggregatesFile,
		NumericMedianAggregate
	} from '$lib/data/layer-aggregates-types.js';
	import ShareSheet from './inspector-panel/share-sheet.svelte';
	import KlimaSection from './inspector-panel/klima-section.svelte';
	import NearestStopsCard from './inspector-panel/nearest-stops-card.svelte';
	import KuehleOrteCard from './inspector-panel/kuehle-orte-card.svelte';
	import HitzeTrinkbrunnenToggle from './inspector-panel/hitze-trinkbrunnen-toggle.svelte';
	import KiezScoreSection from './inspector-panel/kiez-score-section.svelte';
	import ScoreMembershipBadge from './inspector-panel/score-membership-badge.svelte';
	import WahlSection from './inspector-panel/wahl-section.svelte';
	import DemografieBlock from './inspector-panel/demografie-block.svelte';
	import { getDemografieByScopeAt } from '$lib/data/get-kiez-demografie.js';
	import {
		demografieBezugLabel,
		type DemografieByScope,
		type DemografieScope
	} from './inspector-panel/internal/demografie-types.js';
	import { groupHitsBySection } from './inspector-panel/internal/sections.js';
	import { applyApplicabilityReasons } from './inspector-panel/internal/applicability.js';
	import { getLayerDisplayName } from './internal/layer-palette-filter.js';
	import { extractStreetName, formatAddressSubline } from './internal/address-subline.js';
	import { trackEvent } from '$lib/utils/plausible.js';
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
	import { browser } from '$app/environment';
	import { resolveAppMode } from '$lib/app-mode';
	import { resolve } from '$app/paths';

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

	// Story 8.1: globaler Spatial-Level-Context (Composition-Root des Inspectors).
	// Default = 'address' → Backwards-Compat: bei address-Level rendert alles unverändert.
	const level = createInspectorLevelState();

	// Kiez/Bezirk-Kontext der Adresse still auflösen (Foundation für Layout-Anreicherung,
	// Story 8.2b-Pivot: kein User-Level-Switch mehr, Kontext dient der Kiez-Anreicherung).
	$effect(() => {
		const addr = ui.selectedAddress;
		if (!addr) {
			applySpatialContext(level, {
				kiezSlug: null,
				kiezName: null,
				bezirkSlug: null,
				bezirkName: null
			});
			return;
		}
		const { lat, lng } = addr;
		void resolveSpatialContext(level, lat, lng).catch(() => {
			// Boundary-Fetch fehlgeschlagen: Slugs bleiben null, kein unhandled rejection.
		});
	});

	// Pre-Aggregate (8.2a) für die Kiez/Bezirk/Berlin-Anreicherung laden, sobald eine Adresse aktiv ist.
	let layerAggregates = $state<LayerAggregatesFile | null>(null);
	$effect(() => {
		if (!ui.selectedAddress || layerAggregates) return;
		void loadLayerAggregates()
			.then((d) => {
				layerAggregates = d;
			})
			.catch(() => {
				// JSON-Load fehlgeschlagen: Karten zeigen nur den Adresswert, kein Crash.
			});
	});

	// Story 14.10: Composite-Scores der Bezirksregion + des Bezirks für die Profil-Links.
	let regionComposites = $state<RegionComposites | null>(null);
	$effect(() => {
		if (!ui.selectedAddress || regionComposites) return;
		void loadRegionComposites().then((d) => {
			regionComposites = d;
		});
	});
	const kiezComposite = $derived(
		regionComposite(regionComposites, 'kiez', level.kiezSlug, level.bezirkSlug)
	);
	const bezirkComposite = $derived(
		regionComposite(regionComposites, 'bezirk', level.kiezSlug, level.bezirkSlug)
	);

	// Story 10.5: Bevölkerungsprofil pro Scope (Standort/Kiez/Bezirk) + Umschaltung.
	// Lädt alle drei sobald Adresse + aufgelöste Slugs vorliegen; Scope steuert auch die Karten-Outline.
	let demografieByScope = $state<DemografieByScope | null>(null);
	$effect(() => {
		const addr = ui.selectedAddress;
		if (!addr) {
			demografieByScope = null;
			ui.demografieScope = 'standort';
			return;
		}
		const { lat, lng } = addr;
		const kiezSlug = level.kiezSlug;
		const bezirkSlug = level.bezirkSlug;
		const addrId = addr.id;
		void getDemografieByScopeAt(lat, lng, kiezSlug, bezirkSlug)
			.then((d) => {
				if (ui.selectedAddress?.id !== addrId) return;
				demografieByScope = d;
				// Scope auf Standort zurücksetzen, wenn der gewählte Bezug hier keine Daten hat.
				if (
					(ui.demografieScope === 'kiez' && !d.kiez) ||
					(ui.demografieScope === 'bezirk' && !d.bezirk)
				) {
					ui.demografieScope = 'standort';
				}
			})
			.catch(() => {
				if (ui.selectedAddress?.id === addrId) demografieByScope = null;
			});
	});

	const kiezDemografieAvailable = $derived(!!demografieByScope?.kiez);
	const bezirkDemografieAvailable = $derived(!!demografieByScope?.bezirk);
	const activeDemografie = $derived(
		demografieByScope ? (demografieByScope[ui.demografieScope] ?? demografieByScope.standort) : null
	);
	const demografieScopeName = $derived(
		ui.demografieScope === 'kiez'
			? level.kiezName
			: ui.demografieScope === 'bezirk'
				? level.bezirkName
				: null
	);

	function changeDemografieScope(scope: DemografieScope): void {
		ui.demografieScope = scope;
	}

	// Story 14.11: Sprung von einer Layer-Card zur zugehörigen Score-Dimension (scrollt + klappt auf).
	function jumpToDimension(dimension: string): void {
		const row = document.querySelector<HTMLElement>(`[data-testid="kiez-score-dim-${dimension}"]`);
		if (!row) return;
		row.scrollIntoView({ behavior: 'smooth', block: 'center' });
		const toggle = row.querySelector<HTMLButtonElement>(
			`[data-testid="kiez-score-toggle-sources-${dimension}"]`
		);
		if (toggle && toggle.getAttribute('aria-expanded') === 'false') toggle.click();
	}

	function numericAgg(
		slug: string,
		scope: 'kiez' | 'bezirk' | 'berlin'
	): NumericMedianAggregate | null {
		const entry = layerAggregates?.aggregates[slug];
		if (!entry) return null;
		let a;
		if (scope === 'berlin') {
			a = entry.berlin;
		} else if (scope === 'kiez') {
			const s = level.kiezSlug;
			a = s
				? (entry.kiez[s] ?? (level.bezirkSlug ? entry.kiez[`${s}-${level.bezirkSlug}`] : undefined))
				: undefined;
		} else {
			a = level.bezirkSlug ? entry.bezirk[level.bezirkSlug] : undefined;
		}
		return a?.type === 'numeric-median' ? a : null;
	}

	// Layer im Card-Muster (Wert-Chip + Umfeld-Kontext). PET hat eigene Karte (Range-Bar).
	const CARD_SLUGS = new Set([
		'laerm-2023',
		'luft-2023',
		'bioklima-2023',
		'gruenversorgung-2023',
		'umweltgerechtigkeit-2023',
		'wohnlagen-2024',
		'mss-gesamtindex-2025',
		'bodenrichtwerte',
		'milieuschutz-erhaltungsmiete',
		'milieuschutz-staedtebau',
		// Lage & Verwaltung + Einschulbereiche: nur kompakter Name/Code, kein Umfeld-Kontext.
		'bezirke',
		'ortsteile',
		'plz',
		'einschulbereiche-2024',
		// Einrichtungs-POIs: Name + Adresse als kompakte Card statt alter Hit-Row.
		'kitas-2024',
		'schulen-2024',
		'krankenhaeuser-plan',
		'krankenhaeuser-weitere',
		'sportanlagen-2024',
		'schwimmbaeder',
		'spielplaetze',
		'gruenanlagen',
		'fahrradstrassen-2024'
	]);

	function aggFor(slug: string, scope: 'kiez' | 'bezirk' | 'berlin'): LayerAggregate | undefined {
		const entry = layerAggregates?.aggregates[slug];
		if (!entry) return undefined;
		if (scope === 'berlin') return entry.berlin;
		if (scope === 'kiez') {
			const s = level.kiezSlug;
			if (!s) return undefined;
			return (
				entry.kiez[s] ?? (level.bezirkSlug ? entry.kiez[`${s}-${level.bezirkSlug}`] : undefined)
			);
		}
		return level.bezirkSlug ? entry.bezirk[level.bezirkSlug] : undefined;
	}

	function contextText(agg: LayerAggregate): string | null {
		if (agg.type === 'ordinal-distribution') {
			if (agg.dominant === null) return null;
			const share = agg.classes.find((c) => c.label === agg.dominant)?.share;
			return share != null ? `meist ${agg.dominant} (${share}%)` : `meist ${agg.dominant}`;
		}
		if (agg.type === 'coverage-share' || agg.type === 'area-share') {
			return `${agg.share}% der Fläche`;
		}
		return null;
	}

	// Eine Card zeigt EINEN Wert → Singular-Label, obwohl der Layer-Name (Map-Legende) Plural ist.
	const CARD_LABEL_SINGULAR: Record<string, string> = {
		bezirke: 'Bezirk',
		ortsteile: 'Ortsteil',
		plz: 'Postleitzahl',
		'einschulbereiche-2024': 'Einschulbereich'
	};

	function cardLayerName(slug: string): string {
		return CARD_LABEL_SINGULAR[slug] ?? getLayerDisplayName(slug);
	}

	function contextRowsFor(slug: string): ContextRow[] {
		const scopes: { label: string; scope: 'kiez' | 'bezirk' | 'berlin' }[] = [
			{ label: level.kiezName ?? 'Kiez', scope: 'kiez' },
			{ label: level.bezirkName ?? 'Bezirk', scope: 'bezirk' },
			{ label: 'Berlin', scope: 'berlin' }
		];
		const rows = scopes.flatMap((s) => {
			const agg = aggFor(slug, s.scope);
			const text = agg ? contextText(agg) : null;
			return text ? [{ label: s.label, text }] : [];
		});
		// Story 10.6b: Lärm-dB-Kiez-Mittel (L_DEN) als Kontext zur adress-genauen 3-Stufen-Karte.
		if (slug === 'laerm-2023' && ui.kiezLaermDb !== null) {
			rows.unshift({ label: 'Lärm-Mittel (Kiez)', text: `${ui.kiezLaermDb} dB (L_DEN)` });
		}
		return rows;
	}

	const enrichedHits = $derived(applyApplicabilityReasons(ui.selectedLayerHits));
	const sections = $derived(groupHitsBySection(enrichedHits, layerMeta));

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
		trackEvent('Bookmark', addr.bezirk ? { bezirk: addr.bezirk } : undefined);
		inspectorSaveJustHappened = true;
		if (inspectorSaveTimer) clearTimeout(inspectorSaveTimer);
		inspectorSaveTimer = setTimeout(() => {
			inspectorSaveJustHappened = false;
			inspectorSaveTimer = null;
		}, 1800);
	}

	const addressName = $derived(ui.selectedAddress?.displayName ?? '');
	const addressPrimary = $derived(ui.selectedAddress ? extractStreetName(ui.selectedAddress) : '');
	const addressSubline = $derived(
		ui.selectedAddress ? formatAddressSubline(ui.selectedAddress) : ''
	);

	let shareOpen = $state(false);
	let shareTriggerEl: HTMLButtonElement | undefined = $state();

	function openShare(): void {
		shareOpen = true;
		trackEvent('Share');
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
			oepnv: nearest ? { nearest, rating: getMobilityRating(nearest, { isResidential }) } : null,
			kiezScore: ui.kiezScore,
			wahl: ui.wahlResults,
			demografie: activeDemografie,
			demografieBezug: demografieBezugLabel(ui.demografieScope, demografieScopeName),
			laermDb: ui.kiezLaermDb,
			regional: {
				kiezName: level.kiezName,
				kiezSlug: level.kiezSlug,
				kiezComposite,
				bezirkName: level.bezirkName,
				bezirkSlug: level.bezirkSlug,
				bezirkComposite
			}
		});
	});

	const ogImageUrl = $derived(shareOpen ? buildOgImageUrl(ogImageInput, currentOrigin()) : null);
	const permalinkUrl = $derived(shareOpen ? currentHref() : '');
	const nativeShareData = $derived<ShareData>({
		title: addressName ? `${addressName} - Berlin in Daten - navigator.berlin` : 'navigator.berlin',
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
		ui.selectedAddress ? { lat: ui.selectedAddress.lat, lng: ui.selectedAddress.lng } : null
	);

	const hasNearestStops = $derived.by(() => {
		if (!nearestAddressPoint || !ui.oepnvStopIndex) return false;
		const result = isResidential
			? findAllNearestStopsWithSoft(nearestAddressPoint, ui.oepnvStopIndex)
			: findAllNearestStops(nearestAddressPoint, ui.oepnvStopIndex);
		return !!(result.ubahn || result.sbahn || result.tram || result.bus);
	});

	// Story 15.3-15.5: Kühle-Orte-Card rendert auf Section-Ebene (wie NearestStopsCard),
	// nicht per-Hit. Als Punkt-Layer liefert kuehle-orte bei präziser Adresse oft keinen
	// Hit am exakten Punkt; die Card zeigt stattdessen die nächsten kühlen Orte.
	const hasKuehleOrte = $derived(
		ui.activeLayerSlugs.includes('kuehle-orte') &&
			nearestAddressPoint !== null &&
			ui.kuehleOrteIndex !== null
	);

	// Hitze-Subdomain (hitze.navigator.berlin) oder ?mode=hitze: der Inspector zeigt nur die
	// Kühle-Orte-Section, kein Kiez-Score/Wahl/Demografie-Clutter. Link zum vollen Navigator unten.
	const hitzeMode = $derived(
		resolveAppMode(browser ? page.url.host : '', page.url.searchParams.get('mode')) === 'hitze'
	);

	function shouldRenderSection(sectionKey: string, hitCount: number): boolean {
		if (hitzeMode) return sectionKey === 'umwelt' && hasKuehleOrte;
		if (sectionKey === 'klima') return true;
		if (sectionKey === 'mobilitaet' && hasNearestStops) return true;
		if (sectionKey === 'umwelt' && hasKuehleOrte) return true;
		return hitCount > 0;
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
		<div class="sticky top-0 z-10 bg-bg-elevated">
			<header class="flex items-start justify-between gap-3 border-b border-rule px-6 pt-5 pb-4">
				<div class="min-w-0">
					<h2
						class="font-serif text-xl leading-tight text-ink"
						data-testid="inspector-address"
						title={addressName}
					>
						{addressPrimary || addressName}
					</h2>
					{#if addressSubline}
						<p data-testid="inspector-address-subline" class="font-sans text-sm text-ink-muted">
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
				class="flex items-center justify-end gap-3 border-b border-rule px-6 py-2"
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
							onclick={() => {
								if (!ui.compareMode) trackEvent('Compare');
								toggleCompareMode(ui);
							}}
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
		</div>
		<!-- /sticky-header-wrapper -->

		{#key ui.selectedAddress?.id}
			<div class="lc-inspector-body flex-1 space-y-4 px-6 py-4">
				{#if !hitzeMode}
				<KiezScoreSection
					score={ui.kiezScore}
					{lang}
					activeLayerSlugs={ui.activeLayerSlugs}
					onToggleLayer={(slug: string) => toggleLayer(ui, slug)}
				/>
				{#if level.kiezSlug || level.bezirkSlug}
					<nav
						data-testid="inspector-profile-links"
						aria-label="Profilseiten"
						class="flex flex-col gap-1"
					>
						{#if level.kiezSlug}
							{@const kiezHref = resolve('/(with-header)/kiez/[slug]', { slug: level.kiezSlug })}
							<div class="flex items-baseline justify-between gap-2">
								<a
									data-testid="inspector-kiez-link"
									class="font-sans text-sm text-accent underline underline-offset-2 hover:no-underline"
									href={kiezHref}
								>
									Kiez-Profil{level.kiezName ? `: ${level.kiezName}` : ''}
								</a>
								{#if kiezComposite !== null}
									<span
										data-testid="inspector-kiez-composite"
										class="shrink-0 font-mono text-xs text-ink-muted"
										title="Gesamt-Score der Bezirksregion (Mittel ihrer Planungsräume)"
									>
										Score {Math.round(kiezComposite)}
									</span>
								{/if}
							</div>
						{/if}
						{#if level.bezirkSlug}
							{@const bezirkHref = resolve('/(with-header)/bezirk/[slug]', {
								slug: level.bezirkSlug
							})}
							<div class="flex items-baseline justify-between gap-2">
								<a
									data-testid="inspector-bezirk-link"
									class="font-sans text-sm text-accent underline underline-offset-2 hover:no-underline"
									href={bezirkHref}
								>
									Bezirks-Profil{level.bezirkName ? `: ${level.bezirkName}` : ''}
								</a>
								{#if bezirkComposite !== null}
									<span
										data-testid="inspector-bezirk-composite"
										class="shrink-0 font-mono text-xs text-ink-muted"
										title="Gesamt-Score des Bezirks (Mittel seiner Planungsräume)"
									>
										Score {Math.round(bezirkComposite)}
									</span>
								{/if}
							</div>
						{/if}
					</nav>
				{/if}
				<div class="border-t border-rule pt-4" data-testid="weitere-daten-header">
					<h3 class="font-sans text-xs font-semibold tracking-wide text-ink-muted uppercase">
						Weitere Daten an dieser Adresse
					</h3>
					<p class="mt-1 font-serif text-[11px] leading-snug text-ink-muted italic">
						Markierte Werte fließen in den Kiez-Score oben ein, die übrigen sind zusätzlicher
						Kontext.
					</p>
				</div>
				<WahlSection results={ui.wahlResults} />
				<DemografieBlock
					data={activeDemografie}
					isActive={ui.activeLayerSlugs.includes('einwohner-dichte-2024')}
					onToggleLayer={(slug: string) => toggleLayer(ui, slug)}
					scope={ui.demografieScope}
					scopeName={demografieScopeName}
					kiezAvailable={kiezDemografieAvailable}
					bezirkAvailable={bezirkDemografieAvailable}
					onScopeChange={changeDemografieScope}
				/>
				{/if}
				{#each sections as section (section.key)}
					{#if shouldRenderSection(section.key, section.hits.length)}
						<section
							data-testid={`section-${section.key}`}
							data-section={section.key}
							class="border-t border-rule pt-4"
						>
							<h3
								class="mb-3 flex items-baseline gap-2 font-sans text-xs font-semibold tracking-wide text-ink-muted uppercase"
								data-testid={`section-header-${section.key}`}
							>
								<span>{section.label}</span>
								{#if section.hits.length > 0}
									<span
										class="font-mono text-ink-subtle tabular-nums"
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
								{#if section.key === 'umwelt' && hasKuehleOrte}
									<KuehleOrteCard
										layerName={getLayerDisplayName('kuehle-orte')}
										address={nearestAddressPoint}
										index={ui.kuehleOrteIndex}
										isActive={ui.activeLayerSlugs.includes('kuehle-orte')}
										onToggleLayer={(slug: string) => toggleLayer(ui, slug)}
									/>
									{#if hitzeMode}
										<HitzeTrinkbrunnenToggle
											isActive={ui.activeLayerSlugs.includes('trinkbrunnen')}
											onToggleLayer={(slug: string) => toggleLayer(ui, slug)}
											address={nearestAddressPoint}
											index={ui.trinkbrunnenIndex}
										/>
									{/if}
								{/if}
								{#if section.key === 'klima'}
									<KlimaSection station={ui.nearestStation} series={ui.climateSeries} />
								{:else if section.hits.length > 0 && !hitzeMode}
									<div class="space-y-2">
										{#each section.hits as hit (hit.layer)}
											<div data-testid="hit-{hit.layer}">
												<ScoreMembershipBadge slug={hit.layer} onJump={jumpToDimension} />
												{#if hit.layer === 'klima-pet-2022'}
													<KlimaPetCard
														{hit}
														layerName={getLayerDisplayName(hit.layer)}
														{lang}
														isActive={ui.activeLayerSlugs.includes(hit.layer)}
														onToggleLayer={(slug: string) => toggleLayer(ui, slug)}
														kiezName={level.kiezName}
														kiezAggregate={numericAgg('klima-pet-2022', 'kiez')}
														bezirkName={level.bezirkName}
														bezirkAggregate={numericAgg('klima-pet-2022', 'bezirk')}
														berlinAggregate={numericAgg('klima-pet-2022', 'berlin')}
													/>
												{:else if hit.layer === 'kuehle-orte'}
													<!-- Auf Section-Ebene gerendert (hasKuehleOrte), kein per-Hit-Row. -->
												{:else if CARD_SLUGS.has(hit.layer)}
													<LayerCard
														{hit}
														layerName={cardLayerName(hit.layer)}
														{lang}
														isActive={ui.activeLayerSlugs.includes(hit.layer)}
														onToggleLayer={(slug: string) => toggleLayer(ui, slug)}
														contextRows={contextRowsFor(hit.layer)}
													/>
												{:else}
													<LayerHitRow
														{hit}
														layerName={getLayerDisplayName(hit.layer)}
														{lang}
														lat={ui.selectedAddress?.lat}
														lng={ui.selectedAddress?.lng}
														isActive={ui.activeLayerSlugs.includes(hit.layer)}
														onToggleLayer={(slug: string) => toggleLayer(ui, slug)}
													/>
												{/if}
											</div>
										{/each}
									</div>
								{/if}
							</div>
						</section>
					{/if}
				{/each}
			{#if hitzeMode}
				<div class="border-t border-rule pt-4" data-testid="hitze-full-navigator">
					<a
						href="https://navigator.berlin/explore"
						class="inline-flex items-center gap-1.5 font-sans text-sm text-accent underline underline-offset-2 hover:no-underline"
					>
						Alle Layer und Daten im vollen navigator.berlin
					</a>
				</div>
			{/if}
			</div>
		{/key}

		<div data-testid="inspector-print-meta">
			<p>{addressName}</p>
			<p>navigator.berlin · {new Date().toLocaleDateString('de-DE')}</p>
			<p>{page.url.toString()}</p>
		</div>
	</section>
{/if}
