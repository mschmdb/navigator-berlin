<script lang="ts">
	import { page } from '$app/state';
	import SiteHeader from '$lib/components/atlas/site-header.svelte';
	import BookmarkDialog from '$lib/components/atlas/bookmark-dialog.svelte';
	import LangSwitcher from '$lib/components/atlas/lang-switcher.svelte';
	import TranslationDisclaimer from '$lib/components/atlas/translation-disclaimer.svelte';
	import { geocodeAddress } from '$lib/data/geocode.remote.js';
	import type { GeocodeSuggestion } from '$lib/data';
	import { provideAddressSelection } from '$lib/state/address-selection.svelte.js';
	import {
		getUiState,
		setComparisonAddress,
		openPalette,
		openBookmarksDialog
	} from '$lib/state/ui-context.svelte.js';
	import { isBookmarked, bookmarkToSuggestion } from '$lib/state/bookmark-store.js';
	import type { Bookmark } from '$lib/state/bookmark-schema.js';
	import { getLocale, baseLocale } from '$lib/paraglide/runtime';
	import { resolveEffectiveLocale } from '$lib/seo/effective-locale.js';
	import { isRoutePartiallyTranslated } from '$lib/seo/translation-register.js';
	import { basePathname } from '$lib/i18n/base-path.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';

	let { children } = $props();

	/**
	 * GH-Issue #8: Atlas-Aktionen (Such-Bar, Layer-Palette, Bookmark) sind
	 * nur im Karten-Kontext (`/explore`) sinnvoll. Auf allen anderen Routen
	 * (Hero-Landing, /methodik, /lizenzen, /updates, /bezirk, /kiez,
	 * /layer/[slug], /umwelt-infrastruktur-score) zeigt der Header statt Such-Bar
	 * einen Atlas-CTA, und Layer/Bookmark-Trigger werden ausgeblendet.
	 *
	 * Code-review fix (i18n Block A): `page.url.pathname` trägt auf `/en/...`
	 * den Locale-Präfix, ein nackter `startsWith` hätte `/en/explore` in den
	 * falschen Zweig gesteckt. `basePathname()` normalisiert zuerst; das
	 * CTA-Ziel selbst geht über `localizedHref`, damit es auf `/en/...`-Seiten
	 * auf `/en/explore` zeigt statt auf die DE-URL.
	 */
	const offAtlas = $derived(!basePathname(page.url).startsWith('/explore'));
	const atlasCtaHref = $derived(offAtlas ? localizedHref('/explore') : undefined);

	const geocode = async (q: string): Promise<GeocodeSuggestion[]> => await geocodeAddress({ q });

	const selection = provideAddressSelection();
	const ui = getUiState();

	function onSelect(s: GeocodeSuggestion) {
		selection.set(s);
	}

	function openLayerPalette(): void {
		openPalette(ui);
	}

	function openBookmarks(): void {
		openBookmarksDialog(ui);
	}

	const currentAddressBookmarked = $derived(
		ui.selectedAddress
			? isBookmarked(
					{ schemaVersion: 1, bookmarks: ui.bookmarks },
					ui.selectedAddress.lat,
					ui.selectedAddress.lng
				)
			: false
	);

	const inComparePickMode = $derived(ui.compareMode && !ui.comparisonAddress);

	function handleCompareSelect(bookmark: Bookmark): void {
		setComparisonAddress(ui, bookmarkToSuggestion(bookmark));
	}

	// i18n Block A: Disclaimer + Switcher gelten für alle Kern-Routen dieser
	// Route-Group (Statik-Seiten, /explore, kiez/bezirk/layer, Wahlportal).
	const pageLocale = $derived(getLocale());
	const effectiveLocale = $derived(resolveEffectiveLocale(page.url.pathname, pageLocale));
	// spec-i18n-teiluebersetzung-banner.md: `/en/explore`, `/en/kiez/…`,
	// `/en/bezirk/…`, `/en/layer/…` haben einen übersetzten Rahmen, obwohl
	// ihr Content (noch) nicht im Übersetzungs-Register steht -- die
	// Rahmen-Locale (`<main lang>`, Banner-Variante) folgt deshalb NICHT
	// `effectiveLocale` (das bleibt die reine SEO-/Content-Locale).
	// Review-Fund: `isRoutePartiallyTranslated` einmal berechnen statt
	// zusätzlich nochmal implizit in `resolveFrameLocale` -- `frameLocale`
	// leitet sich direkt aus `partial` ab (siehe `resolveFrameLocale` in
	// `effective-locale.ts` für dieselbe Logik als reine, eigenständig
	// getestete Funktion).
	const partial = $derived(isRoutePartiallyTranslated(page.url.pathname, pageLocale));
	const frameLocale = $derived(partial ? pageLocale : effectiveLocale);
	const deAlternateHref = $derived(localizedHref(page.url.pathname, baseLocale));
</script>

{#snippet langSwitcher()}
	<LangSwitcher currentPath={page.url.pathname} />
{/snippet}

<SiteHeader
	{geocode}
	{onSelect}
	activeLayerCount={ui.activeLayerSlugs.length}
	onOpenLayerPalette={offAtlas ? undefined : openLayerPalette}
	bookmarkCount={ui.bookmarks.length}
	{currentAddressBookmarked}
	onOpenBookmarks={offAtlas ? undefined : openBookmarks}
	searchCollapsed={ui.inspectorOpen || ui.compareMode || ui.finderOpen}
	{atlasCtaHref}
	{langSwitcher}
/>

<!--
	Code-review fix: `lang` auf `<main>` folgt der RAHMEN-Locale
	(`resolveFrameLocale`), nicht mehr direkt der Content-Locale
	(`effectiveLocale`) -- eine nicht-übersetzte `/en/...`-Seite zeigt 1:1
	DE-Text; `<html lang="en">` (URL-Locale, bleibt laut I/O-Matrix so) über
	deutschem Fließtext ohne Gegenkorrektur verletzt WCAG 3.1.1 "Language of
	Page". Für die vier teilweise übersetzten Routen (`/explore`,
	`/kiez/…`, `/bezirk/…`, `/layer/…`) ist der RAHMEN aber tatsächlich
	englisch, auch wenn `effectiveLocale` (SEO-/Content-Locale, unverändert)
	weiter DE bleibt -- `resolveFrameLocale` liefert dort `pageLocale`, siehe
	spec-i18n-teiluebersetzung-banner.md. `<html lang>` bleibt weiterhin die
	URL-Locale (Switcher/Disclaimer/Chrome bleiben ja tatsächlich in der
	URL-Locale).
-->
<main id="main" lang={frameLocale}>
	<TranslationDisclaimer
		{pageLocale}
		{effectiveLocale}
		{partial}
		alternateLocaleHref={pageLocale === baseLocale ? undefined : deAlternateHref}
	/>
	{@render children()}
</main>

<BookmarkDialog showCompareAction={inComparePickMode} onCompareSelect={handleCompareSelect} />
