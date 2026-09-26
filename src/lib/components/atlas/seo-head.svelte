<script lang="ts">
	import { buildCanonical, localizedPathname } from '$lib/seo/canonical.js';
	import { buildHreflangCluster } from '$lib/seo/hreflang.js';
	import { localeToOgLocale } from '$lib/seo/locale-meta.js';
	import {
		isRouteTranslated,
		translatedLocalesFor,
		TRANSLATION_REGISTER,
		type TranslationRegisterEntry
	} from '$lib/seo/translation-register.js';
	import { resolveEffectiveLocale } from '$lib/seo/effective-locale.js';
	import {
		baseLocale,
		getLocale,
		locales as siteLocales,
		type Locale
	} from '$lib/paraglide/runtime';

	interface Props {
		/** Page title rendered in `<title>` and `og:title`. */
		title: string;
		/** Meta description rendered in `<meta name="description">` and og/twitter description. */
		description: string;
		/** Current pathname (use `page.url.pathname` from `$app/state`). Query/hash get stripped. */
		pathname: string;
		/** Current origin (use `page.url.origin`). */
		origin: string;
		/**
		 * Optional explicit canonical override. If not provided, built from the
		 * EFFECTIVE-locale path via {@link buildCanonical} (strips query/hash/
		 * trailing-slashes) -- see `canonical` derivation below.
		 */
		canonical?: string;
		/**
		 * Optional absolute OG image URL. When set, the component renders the full OG + twitter
		 * card cluster. When omitted, only `og:type` + `og:title` + `og:description` + `og:url`
		 * are rendered (image-less preview).
		 */
		ogImage?: string;
		/** Optional OG image dimensions for richer previews. */
		ogImageWidth?: number;
		ogImageHeight?: number;
		/** Optional alt-text für og:image (a11y + LinkedIn-Preview-Tool). */
		ogImageAlt?: string;
		/**
		 * Locales to render into the hreflang cluster. Default (recommended):
		 * omit this and let SeoHead compute it from `translation-register.ts` --
		 * `[baseLocale, ...translatedLocalesFor(pathname, locales)]`. Block A:
		 * the register is empty, so this always reduces to `['de']` (DE +
		 * x-default, no `en` alternate) until a page gets marked translated.
		 * Pass explicitly only to override that derivation.
		 */
		locales?: readonly Locale[];
		/**
		 * Story 5.9 AC-9: wenn true, rendert `<meta name="robots" content="noindex,nofollow">`.
		 * API-Endpoints setzen den X-Robots-Tag-Header zusaetzlich serverseitig.
		 *
		 * i18n Block A: wird zusätzlich automatisch `true`, wenn die aktuelle
		 * Locale nicht die Basis-Locale ist UND der Pfad nicht im
		 * Übersetzungs-Register steht (Entscheidung Matze 26.09. 17:10, Variante A).
		 */
		noindex?: boolean;
		/**
		 * Übersetzungs-Register-Override. Default: das echte, in Block A leere
		 * `TRANSLATION_REGISTER`. Nur zum Testen gedacht (rendert SeoHead mit
		 * einem injizierten Eintrag, ohne Modul-Mock) -- Produktionscode lässt
		 * dieses Prop weg.
		 */
		registerEntries?: readonly TranslationRegisterEntry[];
	}

	const {
		title,
		description,
		pathname,
		origin,
		canonical,
		ogImage,
		ogImageWidth = 1200,
		ogImageHeight = 630,
		ogImageAlt,
		locales,
		noindex = false,
		registerEntries = TRANSLATION_REGISTER
	}: Props = $props();

	const pageLocale = $derived(getLocale());
	/**
	 * The locale whose CONTENT is actually shown, not the URL locale -- an
	 * `/en/...` page without a register entry still shows DE content, so its
	 * `og:locale`/canonical must say so too (code review, 2026-09-26).
	 */
	const effectiveLocale = $derived(resolveEffectiveLocale(pathname, pageLocale, registerEntries));
	/**
	 * Canonical target: a translated page (effectiveLocale === pageLocale) is
	 * self-canonical; an untranslated non-base page points at the DE URL --
	 * its content is byte-identical DE content, so self-canonical would tell
	 * crawlers two different URLs both DE + EN carry duplicate content.
	 */
	const canonicalUrl = $derived(
		canonical ?? buildCanonical(origin, localizedPathname(pathname, effectiveLocale))
	);
	const effectiveLocales = $derived(
		locales ??
			([
				baseLocale,
				...translatedLocalesFor(pathname, siteLocales, registerEntries)
			] as readonly Locale[])
	);
	const hreflangCluster = $derived(
		buildHreflangCluster({ origin, pathname, locales: effectiveLocales })
	);
	const autoNoindex = $derived(
		pageLocale !== baseLocale && !isRouteTranslated(pathname, pageLocale, registerEntries)
	);
	const effectiveNoindex = $derived(noindex || autoNoindex);
	const ogLocale = $derived(localeToOgLocale(effectiveLocale));
	const ogLocaleAlternates = $derived(
		effectiveLocales.filter((l) => l !== effectiveLocale).map(localeToOgLocale)
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	{#if effectiveNoindex}
		<meta name="robots" content="noindex,nofollow" />
	{/if}
	<link rel="canonical" href={canonicalUrl} />
	{#each hreflangCluster as link (link.hreflang)}
		<link rel="alternate" hreflang={link.hreflang} href={link.href} />
	{/each}
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="navigator.berlin" />
	<meta property="og:locale" content={ogLocale} />
	{#each ogLocaleAlternates as alt (alt)}
		<meta property="og:locale:alternate" content={alt} />
	{/each}
	{#if ogImage}
		<meta property="og:image" content={ogImage} />
		<meta property="og:image:width" content={String(ogImageWidth)} />
		<meta property="og:image:height" content={String(ogImageHeight)} />
		{#if ogImageAlt}
			<meta property="og:image:alt" content={ogImageAlt} />
		{/if}
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content={title} />
		<meta name="twitter:description" content={description} />
		<meta name="twitter:image" content={ogImage} />
		{#if ogImageAlt}
			<meta name="twitter:image:alt" content={ogImageAlt} />
		{/if}
	{/if}
</svelte:head>
