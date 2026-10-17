<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import NotfallBlock from '$lib/components/kaelte/notfall-block.svelte';
	import WarmeOrteNaehe from '$lib/components/kaelte/warme-orte-naehe.svelte';
	import WarmeOrteTransparenz from '$lib/components/kaelte/warme-orte-transparenz.svelte';
	import DwdKaeltewarnBanner from '$lib/components/kaelte/dwd-kaeltewarn-banner.svelte';
	import type { PageData } from './$types';
	import { buildPageTitle } from '$lib/seo/page-title.js';
	import { buildBreadcrumbList } from '$lib/seo/jsonld-breadcrumb.js';
	import { canonicalOrigin, localizedPathname } from '$lib/seo/canonical.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages.js';
	import { ArrowRight } from '@lucide/svelte';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { buildExplorerDeepLink } from '$lib/utils/url-state.js';

	let { data }: { data: PageData } = $props();

	const origin = $derived(page.url.origin);
	// Logischer Pfad: auch über den Host-Reroute der Subdomain-Wurzel ist das /kaelte
	// (siehe `kaelteReroute` in `$lib/app-mode.ts`), page.url.pathname wäre dort `/`.
	const pathname = '/kaelte';
	const primaryOrigin = $derived(canonicalOrigin(origin));

	const explorerLink = buildExplorerDeepLink(['waerme-orte'], 'kaelte');
	const pageTitle = $derived(buildPageTitle(m.kaelte_meta_title()));
	const pageDescription = $derived(m.kaelte_meta_description());
	const ogImageAbsolute = $derived(`${primaryOrigin}/og/page/kaelte.png`);

	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin: primaryOrigin,
			items: [
				{ name: m.kaelte_breadcrumb_start(), path: localizedPathname('/', getLocale()) },
				{ name: m.kaelte_breadcrumb_kaelte(), path: localizedPathname('/kaelte', getLocale()) }
			]
		})
	);
</script>

<SeoHead
	title={pageTitle}
	description={pageDescription}
	{pathname}
	{origin}
	ogImage={ogImageAbsolute}
/>
<JsonLd data={breadcrumbJsonLd} testid="kaelte-breadcrumb-jsonld" />

<div
	data-testid="kaelte-landing"
	class="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 md:gap-10 md:py-12"
>
	<!-- Amtliche DWD-Kältewarnungen (#60), oberhalb des Notfall-Blocks. Ohne Warnung entfällt alles. -->
	<DwdKaeltewarnBanner warnings={data.warnings} />

	<header class="flex flex-col gap-4">
		<p class="font-mono text-xs tracking-wider text-accent uppercase">{m.kaelte_eyebrow()}</p>
		<h1 class="font-serif text-4xl text-ink md:text-5xl">{m.kaelte_h1()}</h1>
	</header>

	<!-- Notfall-Block vor dem Intro: 112 und erster Dienst sollen ohne Scrollen sichtbar sein. -->
	<NotfallBlock />

	<p class="max-w-prose font-serif text-lg leading-body text-ink-muted">
		{m.kaelte_intro()}
	</p>

	<!-- Warme Orte (#62): Liste in der Nähe, darunter der Transparenz-Block. Karten-Link (#71). -->
	<div data-testid="kaelte-platzhalter-orte" class="flex flex-col gap-8 md:gap-10">
		<WarmeOrteNaehe />
		<a
			href={localizedHref(explorerLink)}
			data-testid="kaelte-karte-link"
			class="inline-flex min-h-11 w-fit items-center gap-2 rounded border border-accent bg-accent px-4 py-2 font-mono text-sm tracking-wider text-bg uppercase hover:border-ink hover:bg-ink"
		>
			<ArrowRight size={16} aria-hidden="true" />
			{m.kaelte_orte_karte_link()}
		</a>
		<WarmeOrteTransparenz />
	</div>
</div>
