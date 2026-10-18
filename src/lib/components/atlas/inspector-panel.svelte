<script lang="ts">
	import { prefersReducedMotion, scrollBehavior } from '$lib/utils/reduced-motion.js';
	import type { LayerMetadata } from '$lib/data';
	import { getUiState, toggleLayer } from '$lib/state/ui-context.svelte.js';
	import {
		createInspectorLevelState,
		resolveSpatialContext,
		applySpatialContext
	} from '$lib/state/inspector-level-context.svelte.js';
	import { loadLayerAggregates } from '$lib/data/get-layer-aggregates.js';
	import {
		loadRegionComposites,
		regionComposite,
		type RegionComposites
	} from '$lib/data/get-region-composites.js';
	import type { LayerAggregatesFile } from '$lib/data/layer-aggregates-types.js';
	import InspectorHeader from './inspector-panel/inspector-header.svelte';
	import InspectorProfileLinks from './inspector-panel/inspector-profile-links.svelte';
	import InspectorSections from './inspector-panel/inspector-sections.svelte';
	import KiezScoreSection from './inspector-panel/kiez-score-section.svelte';
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
	import {
		buildContextRows,
		numericAggregateFor,
		type AggregateScope
	} from './inspector-panel/internal/context-rows.js';
	import { getLayerDisplayName } from './internal/layer-palette-filter.js';
	import { extractStreetName, formatAddressSubline } from './internal/address-subline.js';
	import { scrollToLayerHitRow } from './inspector-panel/internal/scroll-to-layer-row.js';
	import {
		captureScrollAnchor,
		createAnchorKeeper,
		type AnchorKeeper,
		type ScrollAnchor
	} from './inspector-panel/internal/scroll-anchor.js';
	import { untrack } from 'svelte';
	import {
		findAllNearestStops,
		findAllNearestStopsWithSoft
	} from './inspector-panel/internal/nearest-oepnv-stop.js';
	import { getMobilityRating } from './inspector-panel/internal/mobility-rating.js';
	import { isResidentialLocation } from './inspector-panel/internal/residential-location.js';
	import { buildLlmExportMarkdown } from '$lib/utils/llm-export-builder.js';
	import { formatLayerValue } from './inspector-panel/internal/value-formatters.js';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import { resolveAppMode } from '$lib/app-mode';
	import { formatDate } from '$lib/i18n/format.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, type Locale } from '$lib/paraglide/runtime';

	type Props = {
		layerMeta?: readonly LayerMetadata[];
		lang?: Locale;
		variant?: 'panel' | 'sheet';
		mountId?: string;
	};

	let { layerMeta = [], lang, variant = 'panel', mountId = crypto.randomUUID() }: Props = $props();

	// i18n Block B3b: Inspector-Locale aus `getLocale()` statt festem DE-Default.
	const locale = $derived(lang ?? getLocale());
	const localeOpts = $derived({ locale });

	const ui = getUiState();

	// Story 8.1: globaler Spatial-Level-Context (Composition-Root des Inspectors).
	const level = createInspectorLevelState();

	// Kiez/Bezirk-Kontext der Adresse still auflösen (Story 8.2b-Pivot: dient der Kiez-Anreicherung).
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

	// Story 14.11: Sprung von einem Datensatz zur zugehörigen Score-Dimension (scrollt + klappt auf).
	function jumpToDimension(dimension: string): void {
		const row = document.querySelector<HTMLElement>(`[data-testid="kiez-score-dim-${dimension}"]`);
		if (!row) return;
		row.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
		const toggle = row.querySelector<HTMLButtonElement>(
			`[data-testid="kiez-score-toggle-sources-${dimension}"]`
		);
		if (toggle && toggle.getAttribute('aria-expanded') === 'false') toggle.click();
	}

	const regionKeys = $derived({ kiezSlug: level.kiezSlug, bezirkSlug: level.bezirkSlug });

	function numericAgg(slug: string, scope: AggregateScope) {
		return numericAggregateFor(layerAggregates, slug, scope, regionKeys);
	}

	function contextRowsFor(slug: string) {
		return buildContextRows(
			slug,
			{
				...regionKeys,
				aggregates: layerAggregates,
				kiezName: level.kiezName,
				bezirkName: level.bezirkName,
				laermDb: ui.kiezLaermDb
			},
			localeOpts
		);
	}

	const enrichedHits = $derived(applyApplicabilityReasons(ui.selectedLayerHits));
	const sections = $derived(groupHitsBySection(enrichedHits, layerMeta, localeOpts));

	const addressName = $derived(ui.selectedAddress?.displayName ?? '');
	const addressPrimary = $derived(ui.selectedAddress ? extractStreetName(ui.selectedAddress) : '');
	const addressSubline = $derived(
		ui.selectedAddress ? formatAddressSubline(ui.selectedAddress) : ''
	);

	const ogImageInput = $derived.by(() => {
		const addr = ui.selectedAddress;
		if (!addr) return null;
		const topLayers: string[] = [];
		for (const hit of enrichedHits) {
			if (topLayers.length >= 3) break;
			const formatted = formatLayerValue(hit.layer, hit.value);
			if (formatted.isMissing) continue;
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

	function buildLlmMarkdown(permalinkUrl: string): string {
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
			permalinkUrl,
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
	}

	let panelEl: HTMLElement | undefined = $state();
	// #150: Leseposition beim Adresswechsel halten. Der Inspector merkt sich bei
	// jedem Scrollen den obersten sichtbaren Block der aktuellen Adresse. Nach dem
	// Wechsel rückt er diesen Block wieder an dieselbe Stelle und führt ihn nach,
	// während Score, Wahl und Klima nachladen. Gemerkt wird beim Scrollen und nicht
	// beim Wechsel, weil die Score- und Wahl-Blöcke schon im selben Takt leer werden.
	let lastAnchor: { id: string; container: HTMLElement; anchor: ScrollAnchor } | null = null;
	let anchorKeeper: AnchorKeeper | null = null;
	let anchorFrame = 0;
	// Pin-Klick bei schon offenem Inspector: Ziel bis zum Adresswechsel aufheben.
	let pinTarget: { slug: string; fromId: string | null; at: number } | null = null;
	const PIN_TARGET_TTL_MS = 15000;
	let panelReady = false;

	$effect(() => {
		if (!panelEl) return;
		const frame = requestAnimationFrame(() => (panelReady = true));
		return () => {
			cancelAnimationFrame(frame);
			panelReady = false;
		};
	});

	$effect(() => {
		if (!panelEl) return;
		const onScroll = (event: Event) => {
			const target = event.target;
			if (!(target instanceof HTMLElement) || !panelEl) return;
			if (target !== panelEl && !target.contains(panelEl)) return;
			cancelAnimationFrame(anchorFrame);
			anchorFrame = requestAnimationFrame(() => {
				const id = ui.selectedAddress?.id;
				if (!id) return;
				const anchor = captureScrollAnchor(target);
				lastAnchor = anchor ? { id, container: target, anchor } : null;
			});
		};
		document.addEventListener('scroll', onScroll, { capture: true, passive: true });
		return () => {
			document.removeEventListener('scroll', onScroll, { capture: true });
			cancelAnimationFrame(anchorFrame);
		};
	});

	$effect(() => {
		const id = ui.selectedAddress?.id;
		untrack(() => {
			anchorKeeper?.stop();
			anchorKeeper = null;
			// Ein Klick auf einen Pin-Layer bei offenem Inspector: nach dem Wechsel gezielt
			// zu dessen Zeile scrollen (Story 1.15) statt die alte Position zu halten.
			const pin = pinTarget;
			if (pin && Date.now() - pin.at > PIN_TARGET_TTL_MS) pinTarget = null;
			else if (id && pin && pin.fromId !== id) {
				pinTarget = null;
				lastAnchor = null;
				const reduced = prefersReducedMotion();
				requestAnimationFrame(() =>
					scrollToLayerHitRow(panelEl ?? null, pin.slug, { reducedMotion: reduced })
				);
				return;
			}
			const saved = lastAnchor;
			if (!id || !saved || saved.id === id) return;
			lastAnchor = null;
			if (!saved.container.isConnected) return;
			anchorKeeper = createAnchorKeeper(saved.container, saved.anchor, {
				observe: panelEl?.querySelector('.lc-inspector-body') ?? null,
				maxMs: 6000
			});
		});
	});

	$effect(() => () => anchorKeeper?.stop());

	$effect(() => {
		const target = ui.scrollToLayerSlug;
		if (!target || !panelEl) return;
		const reduced = prefersReducedMotion();
		untrack(() => {
			anchorKeeper?.stop();
			anchorKeeper = null;
			lastAnchor = null;
			pinTarget = panelReady
				? { slug: target, fromId: ui.selectedAddress?.id ?? null, at: Date.now() }
				: null;
		});
		queueMicrotask(() => {
			scrollToLayerHitRow(panelEl ?? null, target, { reducedMotion: reduced });
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

	// Story 15.3-15.5: Kühle-Orte-Card rendert auf Section-Ebene (wie NearestStopsCard), nicht per-Hit.
	const hasKuehleOrte = $derived(
		ui.activeLayerSlugs.includes('kuehle-orte') &&
			nearestAddressPoint !== null &&
			ui.kuehleOrteIndex !== null
	);

	// Hitze-Subdomain oder ?mode=hitze: nur die Kühle-Orte-Section, kein Score/Wahl/Demografie.
	const hitzeMode = $derived(
		resolveAppMode(browser ? page.url.host : '', page.url.searchParams.get('mode')) === 'hitze'
	);

	// Kälte-Host oder ?mode=kaelte: nur die Warme-Orte-Card.
	const kaelteMode = $derived(
		resolveAppMode(browser ? page.url.host : '', page.url.searchParams.get('mode')) === 'kaelte'
	);
	const hasWaermeOrte = $derived(kaelteMode && nearestAddressPoint !== null);
	const reducedMode = $derived(hitzeMode || kaelteMode);
</script>

{#if ui.inspectorOpen && ui.selectedAddress}
	<section
		bind:this={panelEl}
		aria-live="polite"
		aria-atomic="false"
		aria-label={m.inspector_panel_aria_label({ name: addressName }, localeOpts)}
		data-testid="inspector-panel"
		data-mount-id={mountId}
		data-variant={variant}
		class="flex h-full flex-col overflow-x-hidden overflow-y-auto bg-bg-elevated text-ink [overflow-anchor:none]"
	>
		<InspectorHeader
			{addressName}
			{addressPrimary}
			{addressSubline}
			{variant}
			lang={locale}
			{ogImageInput}
			{buildLlmMarkdown}
		/>

		{#key ui.selectedAddress?.id}
			<div class="lc-inspector-body flex-1 space-y-4 px-6 py-4">
				{#if !reducedMode}
					<KiezScoreSection
						score={ui.kiezScore}
						lang={locale}
						activeLayerSlugs={ui.activeLayerSlugs}
						onToggleLayer={(slug: string) => toggleLayer(ui, slug)}
					/>
					<InspectorProfileLinks
						kiezSlug={level.kiezSlug}
						kiezName={level.kiezName}
						{kiezComposite}
						bezirkSlug={level.bezirkSlug}
						bezirkName={level.bezirkName}
						{bezirkComposite}
						lang={locale}
					/>
					<div
						class="border-t border-rule pt-4"
						data-testid="weitere-daten-header"
						data-scroll-anchor="block:weitere-daten"
					>
						<h3 class="font-sans text-xs font-semibold text-ink-muted">
							{m.inspector_weitere_daten_heading(undefined, localeOpts)}
						</h3>
						<p class="mt-1 text-dense-meta leading-snug text-ink-muted">
							{m.inspector_weitere_daten_hint(undefined, localeOpts)}
						</p>
					</div>
					<WahlSection results={ui.wahlResults} lang={locale} />
					<DemografieBlock
						data={activeDemografie}
						isActive={ui.activeLayerSlugs.includes('einwohner-dichte-2024')}
						onToggleLayer={(slug: string) => toggleLayer(ui, slug)}
						scope={ui.demografieScope}
						scopeName={demografieScopeName}
						kiezAvailable={!!demografieByScope?.kiez}
						bezirkAvailable={!!demografieByScope?.bezirk}
						onScopeChange={changeDemografieScope}
						lang={locale}
					/>
				{/if}
				<InspectorSections
					{sections}
					lang={locale}
					{hitzeMode}
					{kaelteMode}
					{hasKuehleOrte}
					{hasWaermeOrte}
					{hasNearestStops}
					{isResidential}
					addressPoint={nearestAddressPoint}
					kiezName={level.kiezName}
					bezirkName={level.bezirkName}
					{contextRowsFor}
					{numericAgg}
					onJump={jumpToDimension}
				/>
			</div>
		{/key}

		<div data-testid="inspector-print-meta">
			<p>{addressName}</p>
			<p>
				{m.inspector_print_footer(
					{ date: formatDate(new Date().toISOString(), localeOpts) },
					localeOpts
				)}
			</p>
			<p>{page.url.toString()}</p>
		</div>
	</section>
{/if}
