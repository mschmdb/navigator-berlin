<script lang="ts">
	import { buildPageTitle } from '$lib/seo/page-title.js';
	import { page } from '$app/state';
	import {
		Search,
		MapPin,
		Navigation,
		Film,
		BookOpen,
		Waves,
		Landmark,
		ShoppingBag,
		Droplet,
		ExternalLink
	} from '@lucide/svelte';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import FaqSection from '$lib/components/atlas/faq-section.svelte';
	import DwdHitzewarnBanner from '$lib/components/kuehle-orte/dwd-hitzewarn-banner.svelte';
	import InDeinerNaehe from '$lib/components/kuehle-orte/in-deiner-naehe.svelte';
	import KuehleOrteTransparenz from '$lib/components/kuehle-orte/kuehle-orte-transparenz.svelte';
	import { buildDataset } from '$lib/seo/jsonld-dataset.js';
	import { originOfUrl, stableDownloadPath } from '$lib/seo/dataset-helpers.js';
	import { buildBreadcrumbList } from '$lib/seo/jsonld-breadcrumb.js';
	import { getHitzeFaq } from '$lib/content/hitze-faq.js';
	import { buildCanonical, canonicalOrigin, localizedPathname } from '$lib/seo/canonical.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { BEZIRKE_BBOX } from '$lib/data/berlin-bbox.generated.js';
	import { getLayerMethodology } from '$lib/data/layer-methodology.js';
	import { buildExplorerDeepLink } from '$lib/utils/url-state.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const origin = $derived(page.url.origin);
	// Diese Route entspricht IMMER dem LOGISCHEN Pfad `/hitze` -- unabhängig
	// davon, ob sie über `/hitze` direkt oder über den Host-Reroute auf der
	// Hitze-Subdomain-Wurzel erreicht wird (dort bleibt `page.url.pathname`
	// bewusst `/`, siehe `hitzeReroute` in `$lib/app-mode.ts`). Fix (i18n
	// Block B2 Review): SeoHead braucht diesen LOGISCHEN Pfad für
	// Register-Lookup/hreflang -- mit dem rohen `page.url.pathname` würde die
	// Subdomain-Wurzel fälschlich die Home-Registrierung übernehmen (`/` ist
	// seit i18n Block B2 für `en` registriert), obwohl diese inhaltlich
	// andere Seite selbst nicht übersetzt ist.
	const pathname = '/hitze';
	const effectiveLocale = $derived(getLocale());

	// Dieselbe Seite ist über zwei Hosts erreichbar: navigator.berlin/hitze und
	// hitze.navigator.berlin/ (Reroute). Canonical konsolidiert auf die Haupt-Domain,
	// damit kein Duplicate-Content entsteht. `hitze.`-Subdomain wird gestrippt, lokal bleibt lokal.
	const primaryOrigin = $derived(canonicalOrigin(origin));
	const canonical = $derived(
		buildCanonical(primaryOrigin, localizedPathname(pathname, effectiveLocale))
	);

	// mode=hitze erzwingt den reduzierten Explorer auch ohne Hitze-Host (lokal + Main-Domain).
	const explorerLink = `${buildExplorerDeepLink(['kuehle-orte'])}&mode=hitze`;
	const pageTitle = $derived(buildPageTitle(m.hitze_meta_title()));
	const pageDescription = $derived(m.hitze_meta_description());
	const faqItems = $derived(getHitzeFaq());
	const ogImagePath = '/og/page/hitze.png';
	const ogImageAbsolute = $derived(`${primaryOrigin}${ogImagePath}`);

	// Distribution = stabile Download-URL des Kühle-Orte-Layers. Ohne MANIFEST-Daten
	// entfällt das Dataset-JSON-LD, statt Werte zu raten.
	const datasetSource = $derived(data.datasetSource ?? null);
	const datasetJsonLd = $derived(
		datasetSource &&
			buildDataset({
				origin: primaryOrigin,
				name: m.hitze_jsonld_name(),
				url: canonical,
				bbox: BEZIRKE_BBOX,
				description: pageDescription,
				license: 'ODbL 1.0',
				dateModified: datasetSource.dateModified,
				// Gleiche Herausgeber-Angabe wie die Layer-Seite (Methodik-Authority).
				creatorName: getLayerMethodology(datasetSource.slug)?.authority,
				creatorUrl: originOfUrl(datasetSource.sourceUrl),
				contentUrl: `${primaryOrigin}${stableDownloadPath(datasetSource.slug, datasetSource.format)}`,
				encodingFormat:
					datasetSource.format === 'pmtiles' ? 'application/vnd.pmtiles' : 'application/geo+json',
				keywords: m
					.hitze_jsonld_keywords()
					.split(',')
					.map((k) => k.trim())
					.filter(Boolean)
			})
	);

	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin: primaryOrigin,
			items: [
				{ name: m.hitze_breadcrumb_start(), path: localizedPathname('/', getLocale()) },
				{ name: m.hitze_breadcrumb_hitze(), path: localizedPathname('/hitze', getLocale()) }
			]
		})
	);

	const categories = $derived([
		{ icon: Film, name: m.hitze_cat_kinos_name(), note: m.hitze_cat_kinos_note() },
		{
			icon: BookOpen,
			name: m.hitze_cat_bibliotheken_name(),
			note: m.hitze_cat_bibliotheken_note()
		},
		{
			icon: Waves,
			name: m.hitze_cat_schwimmhallen_name(),
			note: m.hitze_cat_schwimmhallen_note()
		},
		{ icon: Landmark, name: m.hitze_cat_museen_name(), note: m.hitze_cat_museen_note() },
		{ icon: ShoppingBag, name: m.hitze_cat_malls_name(), note: m.hitze_cat_malls_note() },
		{
			icon: Droplet,
			name: m.hitze_cat_trinkbrunnen_name(),
			note: m.hitze_cat_trinkbrunnen_note()
		}
	]);

	const steps = $derived([
		{ icon: Search, title: m.hitze_step1_title(), text: m.hitze_step1_text() },
		{ icon: MapPin, title: m.hitze_step2_title(), text: m.hitze_step2_text() },
		{ icon: Navigation, title: m.hitze_step3_title(), text: m.hitze_step3_text() }
	]);

	const offiziell = $derived([
		{
			href: 'https://www.berlin.de/hitzeschutz/',
			title: m.hitze_offiziell_hitzeschutz_title(),
			text: m.hitze_offiziell_hitzeschutz_text()
		},
		{
			href: 'https://kuehle-orte.berlin.de/hsp/',
			title: m.hitze_offiziell_karte_title(),
			text: m.hitze_offiziell_karte_text()
		},
		{
			href: 'https://www.berlin.de/hitzeschutz/hitzeaktionsplan/',
			title: m.hitze_offiziell_aktionsplan_title(),
			text: m.hitze_offiziell_aktionsplan_text()
		}
	]);
</script>

<SeoHead
	title={pageTitle}
	description={pageDescription}
	{pathname}
	{origin}
	ogImage={ogImageAbsolute}
/>
{#if datasetJsonLd}
	<JsonLd data={datasetJsonLd} testid="hitze-dataset-jsonld" />
{/if}
<JsonLd data={breadcrumbJsonLd} testid="hitze-breadcrumb-jsonld" />

<div data-testid="hitze-landing" class="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-12">
	<DwdHitzewarnBanner warning={data.warning} />
	<header class="flex flex-col gap-6">
		<h1 class="text-4xl font-bold text-ink md:text-5xl lg:text-6xl">{m.hitze_h1_title()}</h1>
		<p class="max-w-prose text-lg leading-body text-ink-muted">
			{m.hitze_intro_p1()}
		</p>
		<div class="flex flex-col gap-2 pt-1">
			<a
				href={localizedHref(explorerLink)}
				data-testid="hitze-cta"
				class="inline-flex w-fit items-center gap-2 rounded border border-accent bg-accent px-4 py-2 text-sm text-bg hover:border-ink hover:bg-ink"
			>
				{m.hitze_cta_map()}
			</a>
			<p class="font-sans text-sm text-ink-subtle">
				{m.hitze_cta_map_hint()}
			</p>
			<a
				href={localizedHref('/layer/kuehle-orte')}
				data-testid="hitze-methodik-link"
				class="inline-flex min-h-(--target-min) w-fit items-center text-sm text-ink-muted hover:text-ink"
			>
				{m.hitze_methodik_link()}
			</a>
		</div>
	</header>

	<InDeinerNaehe explorerHref={localizedHref(explorerLink)} />

	<section aria-labelledby="orte-h" class="flex flex-col gap-4">
		<h2 id="orte-h" class="font-sans text-2xl font-semibold text-ink">
			{m.hitze_orte_heading()}
		</h2>
		<ul class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			{#each categories as cat (cat.name)}
				{@const Icon = cat.icon}
				<li class="flex items-start gap-3 rounded border border-rule bg-bg-elevated px-3 py-2.5">
					<Icon size={20} aria-hidden="true" class="mt-0.5 shrink-0 text-umwelt-kuehle-orte" />
					<span class="flex flex-col">
						<span class="font-sans text-sm font-medium text-ink">{cat.name}</span>
						<span class="text-sm text-ink-muted">{cat.note}</span>
					</span>
				</li>
			{/each}
		</ul>
	</section>

	<section aria-labelledby="schritte-h" class="flex flex-col gap-4">
		<h2 id="schritte-h" class="font-sans text-2xl font-semibold text-ink">
			{m.hitze_schritte_heading()}
		</h2>
		<ol class="flex flex-col gap-3">
			{#each steps as step, i (step.title)}
				{@const Icon = step.icon}
				<li class="flex items-start gap-3">
					<span
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 font-sans text-sm font-semibold text-accent"
						aria-hidden="true">{i + 1}</span
					>
					<span class="flex flex-col">
						<span class="flex items-center gap-1.5 font-sans text-sm font-medium text-ink">
							<Icon size={15} aria-hidden="true" class="text-ink-muted" />
							{step.title}
						</span>
						<span class="text-sm text-ink-muted">{step.text}</span>
					</span>
				</li>
			{/each}
		</ol>
	</section>

	<section aria-labelledby="offiziell-h" class="flex flex-col gap-4">
		<h2 id="offiziell-h" class="font-sans text-2xl font-semibold text-ink">
			{m.hitze_offiziell_heading()}
		</h2>
		<p class="text-base text-ink-muted">
			{m.hitze_offiziell_intro()}
		</p>
		<ul class="flex flex-col gap-3">
			{#each offiziell as link (link.href)}
				<li>
					<a
						href={link.href}
						target="_blank"
						rel="noopener noreferrer"
						class="group flex items-start gap-2 rounded border border-rule px-3 py-2.5 hover:border-ink-subtle"
					>
						<ExternalLink
							size={16}
							aria-hidden="true"
							class="mt-0.5 shrink-0 text-ink-subtle group-hover:text-ink"
						/>
						<span class="flex flex-col">
							<span class="font-sans text-sm font-medium text-accent">{link.title}</span>
							<span class="text-sm text-ink-muted">{link.text}</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>

	<FaqSection items={faqItems} pageType="landing" />

	<KuehleOrteTransparenz />
</div>
