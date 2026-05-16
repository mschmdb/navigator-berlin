<script lang="ts">
	import { buildCanonical } from '$lib/seo/canonical.js';
	import { buildHreflangCluster, type SupportedLocale } from '$lib/seo/hreflang.js';

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
		 * Optional explicit canonical override. If not provided, built from `origin + pathname`
		 * via {@link buildCanonical} (strips query/hash/trailing-slashes).
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
		/**
		 * Active locales for the hreflang cluster. Phase 1 default: `['de']` only
		 * (memory `project_i18n_phase_1_de_only`). When EN coverage lands (story 3.1/3.2),
		 * pass `['de', 'en']`.
		 */
		locales?: readonly SupportedLocale[];
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
		locales = ['de']
	}: Props = $props();

	const canonicalUrl = $derived(canonical ?? buildCanonical(origin, pathname));
	const hreflangCluster = $derived(buildHreflangCluster({ origin, pathname, locales }));
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonicalUrl} />
	{#each hreflangCluster as link (link.hreflang)}
		<link rel="alternate" hreflang={link.hreflang} href={link.href} />
	{/each}
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:type" content="website" />
	{#if ogImage}
		<meta property="og:image" content={ogImage} />
		<meta property="og:image:width" content={String(ogImageWidth)} />
		<meta property="og:image:height" content={String(ogImageHeight)} />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content={title} />
		<meta name="twitter:description" content={description} />
		<meta name="twitter:image" content={ogImage} />
	{/if}
</svelte:head>
