<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import RichText from '$lib/components/rich-text.svelte';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { richSegments } from '$lib/i18n/rich-text.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { buildBreadcrumbList, buildDataCatalog, localeToBcp47 } from '$lib/seo/index.js';
	import { localizedPathname } from '$lib/seo/canonical.js';
	import { getLayerDisplayName } from '$lib/components/atlas/internal/layer-palette-filter.js';
	import {
		getLicenseInfo,
		getRuntimeSoftware,
		getSections,
		groupByLicense
	} from './lizenzen-content.js';

	type Props = { data: import('./$types').PageData };
	let { data }: Props = $props();

	const manifest = $derived(data.manifest);
	const locale = $derived(getLocale());
	const sections = $derived(getSections());
	const licenseGroups = $derived(groupByLicense(manifest.layers, locale));
	const runtimeSoftware = $derived(getRuntimeSoftware());
	const datenIntro = $derived.by(() => {
		const count = manifest.layers.length;
		const licenseCount = licenseGroups.size;
		if (count === 1) return m.lizenzen_daten_p1_single();
		if (licenseCount === 1) return m.lizenzen_daten_p1_one_license({ count });
		return m.lizenzen_daten_p1({ count, licenseCount });
	});

	const codeSegments = (render: (open: string, close: string) => string) =>
		richSegments((t) => render(t('code').start, t('code').end));
	const bwlDescSegments = $derived(
		codeSegments((code_start, code_end) => m.lizenzen_wahl_bwl_desc({ code_start, code_end }))
	);
	const entitaetenSegments = $derived(
		codeSegments((code_start, code_end) => m.lizenzen_entitaeten_p1({ code_start, code_end }))
	);
	const wikidataSegments = $derived(
		codeSegments((code_start, code_end) =>
			m.lizenzen_entitaeten_wikidata_desc({ code_start, code_end })
		)
	);
	const wikipediaSegments = $derived(
		codeSegments((code_start, code_end) =>
			m.lizenzen_entitaeten_wikipedia_desc({ code_start, code_end })
		)
	);
	const softwareSegments = $derived(
		codeSegments((code_start, code_end) => m.lizenzen_software_p1({ code_start, code_end }))
	);
	const osmSegments = $derived(
		richSegments((t) => m.lizenzen_osm_p2({ link_start: t('link').start, link_end: t('link').end }))
	);

	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin: page.url.origin,
			items: [
				{ name: 'Berlin', path: localizedHref('/') },
				{ name: m.lizenzen_breadcrumb_lizenzen(), path: localizedHref('/lizenzen') }
			]
		})
	);

	// i18n Block D1: DataCatalog folgt der Seiten-Locale (Datasets zeigen auf /en/layer/...).
	const dataCatalogJsonLd = $derived(
		buildDataCatalog({
			origin: page.url.origin,
			name: m.lizenzen_datacatalog_name(undefined, { locale }),
			description: m.lizenzen_datacatalog_description(undefined, { locale }),
			urlPath: localizedPathname('/lizenzen', locale),
			publisherName: 'Matze Schmidbauer',
			datasets: data.catalogDatasets,
			inLanguage: localeToBcp47(locale)
		})
	);
</script>

{#snippet codeXs(text: string)}<code class="font-mono text-xs">{text}</code>{/snippet}
{#snippet codeSm(text: string)}<code class="font-mono text-sm">{text}</code>{/snippet}

<SeoHead
	title={m.lizenzen_meta_title()}
	description={m.lizenzen_meta_description()}
	pathname={page.url.pathname}
	origin={page.url.origin}
	ogImage={`${page.url.origin}/og/page/lizenzen.png`}
	ogImageAlt={m.lizenzen_og_image_alt()}
/>
<JsonLd data={breadcrumbJsonLd} testid="lizenzen-breadcrumb-jsonld" />
<JsonLd data={dataCatalogJsonLd} testid="lizenzen-datacatalog-jsonld" />

<article data-testid="lizenzen-page" class="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
	<header class="flex flex-col gap-2">
		<h1 data-testid="lizenzen-page-title" class="font-serif text-3xl text-ink">
			{m.lizenzen_h1_title()}
		</h1>
		<p class="font-serif text-lg leading-relaxed text-ink-muted">
			{m.lizenzen_intro_p1()}
		</p>
	</header>

	<nav
		data-testid="lizenzen-toc"
		aria-label={m.lizenzen_toc_aria_label()}
		class="border border-rule bg-bg p-4"
	>
		<p class="mb-2 font-mono text-xs tracking-wide text-ink-subtle uppercase">
			{m.lizenzen_toc_heading()}
		</p>
		<ol class="grid gap-1.5 font-sans text-sm sm:grid-cols-2">
			{#each sections as sec (sec.id)}
				<li>
					<a
						href={`#${sec.id}`}
						class="hover:text-accent-strong text-accent underline underline-offset-2"
					>
						{sec.label}
					</a>
				</li>
			{/each}
		</ol>
	</nav>

	<section id="daten-lizenzen" aria-labelledby="daten-lizenzen-h" class="flex flex-col gap-4">
		<h2 id="daten-lizenzen-h" class="font-serif text-2xl text-ink">
			{m.lizenzen_section_daten_lizenzen()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			{datenIntro}
		</p>

		{#each [...licenseGroups.entries()] as [license, layers] (license)}
			{@const info = getLicenseInfo(license)}
			<div class="flex flex-col gap-2 border border-rule p-4">
				<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
					<h3 class="font-sans text-base font-semibold text-ink">{info.label}</h3>
					<a
						href={info.url}
						target="_blank"
						rel="noopener noreferrer"
						class="hover:text-accent-strong font-mono text-xs text-accent underline underline-offset-2"
					>
						{info.key}
					</a>
				</div>
				<p class="font-serif text-sm text-ink-muted">{info.summary}</p>
				<ul class="flex flex-wrap gap-x-3 gap-y-1 font-sans text-sm">
					{#each layers as layer (layer.slug)}
						<li>
							<a
								href={localizedHref(`/layer/${layer.slug}`)}
								class="hover:text-accent-strong text-accent underline underline-offset-2"
							>
								{getLayerDisplayName(layer.slug, { locale })}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/each}

		<p class="font-serif text-sm text-ink-muted">
			{m.lizenzen_daten_laerm()}
		</p>
	</section>

	<section id="wahldaten" aria-labelledby="wahldaten-h" class="flex flex-col gap-3">
		<h2 id="wahldaten-h" class="font-serif text-2xl text-ink">{m.lizenzen_section_wahldaten()}</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			{m.lizenzen_wahl_p1()}
		</p>
		<dl class="flex flex-col gap-3">
			<div class="border border-rule p-4">
				<dt class="font-sans text-base font-semibold text-ink">{m.lizenzen_wahl_bwl_name()}</dt>
				<dd class="mt-1 font-serif text-sm text-ink-muted">
					<RichText segments={bwlDescSegments}>
						{#snippet tag(text)}{@render codeXs(text)}{/snippet}
					</RichText>
				</dd>
				<dd class="mt-2 font-mono text-xs">
					<a
						href="https://bundeswahlleiterin.de"
						target="_blank"
						rel="noopener noreferrer"
						class="hover:text-accent-strong text-accent underline underline-offset-2"
					>
						bundeswahlleiterin.de
					</a>
				</dd>
			</div>
			<div class="border border-rule p-4">
				<dt class="font-sans text-base font-semibold text-ink">
					{m.lizenzen_wahl_statistik_name()}
				</dt>
				<dd class="mt-1 font-serif text-sm text-ink-muted">
					{m.lizenzen_wahl_statistik_desc()}
				</dd>
				<dd class="mt-2 font-mono text-xs">
					<a
						href="https://statistik-berlin-brandenburg.de"
						target="_blank"
						rel="noopener noreferrer"
						class="hover:text-accent-strong text-accent underline underline-offset-2"
					>
						statistik-berlin-brandenburg.de
					</a>
				</dd>
			</div>
			<div class="border border-rule p-4">
				<dt class="font-sans text-base font-semibold text-ink">
					{m.lizenzen_wahl_landeswahl_name()}
				</dt>
				<dd class="mt-1 font-serif text-sm text-ink-muted">
					{m.lizenzen_wahl_landeswahl_desc()}
				</dd>
				<dd class="mt-2 font-mono text-xs">
					<a
						href="https://www.wahlen-berlin.de"
						target="_blank"
						rel="noopener noreferrer"
						class="hover:text-accent-strong text-accent underline underline-offset-2"
					>
						wahlen-berlin.de
					</a>
				</dd>
			</div>
		</dl>
		<p class="font-mono text-xs text-ink-muted">
			{m.lizenzen_wahl_methodik_label()}
			<a
				href={localizedHref('/methodik/wahldaten')}
				class="hover:text-accent-strong text-accent underline underline-offset-2"
			>
				{m.lizenzen_wahl_methodik_link()}
			</a>
		</p>
	</section>

	<section id="demografie" aria-labelledby="demografie-h" class="flex flex-col gap-3">
		<h2 id="demografie-h" class="font-serif text-2xl text-ink">
			{m.lizenzen_section_demografie()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			{m.lizenzen_demografie_p1()}
		</p>
		<dl class="flex flex-col gap-3">
			<div class="border border-rule p-4">
				<dt class="font-sans text-base font-semibold text-ink">
					{m.lizenzen_demografie_name()}
				</dt>
				<dd class="mt-1 font-serif text-sm text-ink-muted">
					{m.lizenzen_demografie_desc()}
				</dd>
				<dd class="mt-2 font-mono text-xs">
					<a
						href="https://daten.berlin.de/datensaetze/einwohnerinnen-und-einwohner-in-berlin-in-lor-planungsraumen-am-31-12-2024"
						target="_blank"
						rel="noopener noreferrer"
						class="hover:text-accent-strong text-accent underline underline-offset-2"
					>
						daten.berlin.de
					</a>
				</dd>
			</div>
		</dl>
	</section>

	<section
		id="kriminalitaetsatlas"
		aria-labelledby="kriminalitaetsatlas-h"
		class="flex flex-col gap-3"
	>
		<h2 id="kriminalitaetsatlas-h" class="font-serif text-2xl text-ink">
			{m.lizenzen_section_kriminalitaet()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			{m.lizenzen_krim_p1()}
		</p>
		<dl class="flex flex-col gap-3">
			<div class="border border-rule p-4">
				<dt class="font-sans text-base font-semibold text-ink">{m.lizenzen_krim_name()}</dt>
				<dd class="mt-1 font-serif text-sm text-ink-muted">
					{m.lizenzen_krim_desc()}
				</dd>
				<dd class="mt-2 font-mono text-xs">
					<a
						href="https://www.kriminalitaetsatlas.berlin.de/"
						target="_blank"
						rel="noopener noreferrer"
						class="hover:text-accent-strong text-accent underline underline-offset-2"
					>
						kriminalitaetsatlas.berlin.de
					</a>
				</dd>
			</div>
		</dl>
		<p class="font-mono text-xs text-ink-muted">
			{m.lizenzen_krim_methodik_label()}
			<a
				href={localizedHref('/methodik/kiez-score')}
				class="hover:text-accent-strong text-accent underline underline-offset-2"
			>
				{m.lizenzen_krim_methodik_link()}
			</a>
		</p>
	</section>

	<section id="klimadaten-dwd" aria-labelledby="klimadaten-dwd-h" class="flex flex-col gap-3">
		<h2 id="klimadaten-dwd-h" class="font-serif text-2xl text-ink">
			{m.lizenzen_section_klimadaten()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			{m.lizenzen_klima_p1()}
		</p>
		<dl class="flex flex-col gap-3">
			<div class="border border-rule p-4">
				<dt class="font-sans text-base font-semibold text-ink">
					{m.lizenzen_klima_name()}
				</dt>
				<dd class="mt-1 font-serif text-sm text-ink-muted">
					{m.lizenzen_klima_desc()}
				</dd>
				<dd class="mt-2 font-mono text-xs">
					<a
						href="https://opendata.dwd.de/climate_environment/CDC/"
						target="_blank"
						rel="noopener noreferrer"
						class="hover:text-accent-strong text-accent underline underline-offset-2"
					>
						opendata.dwd.de/climate_environment/CDC
					</a>
				</dd>
			</div>
		</dl>
	</section>

	<section
		id="entitaets-verweise"
		aria-labelledby="entitaets-verweise-h"
		class="flex flex-col gap-3"
	>
		<h2 id="entitaets-verweise-h" class="font-serif text-2xl text-ink">
			{m.lizenzen_section_entitaeten()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			<RichText segments={entitaetenSegments}>
				{#snippet tag(text)}{@render codeSm(text)}{/snippet}
			</RichText>
		</p>
		<dl class="flex flex-col gap-3">
			<div class="border border-rule p-4">
				<dt class="font-sans text-base font-semibold text-ink">Wikidata</dt>
				<dd class="mt-1 font-serif text-sm text-ink-muted">
					<RichText segments={wikidataSegments}>
						{#snippet tag(text)}{@render codeXs(text)}{/snippet}
					</RichText>
				</dd>
				<dd class="mt-2 font-mono text-xs">
					<a
						href="https://www.wikidata.org"
						target="_blank"
						rel="noopener noreferrer"
						class="hover:text-accent-strong text-accent underline underline-offset-2"
					>
						wikidata.org
					</a>
				</dd>
			</div>
			<div class="border border-rule p-4">
				<dt class="font-sans text-base font-semibold text-ink">
					{m.lizenzen_entitaeten_wikipedia_name()}
				</dt>
				<dd class="mt-1 font-serif text-sm text-ink-muted">
					<RichText segments={wikipediaSegments}>
						{#snippet tag(text)}{@render codeXs(text)}{/snippet}
					</RichText>
				</dd>
				<dd class="mt-2 font-mono text-xs">
					<a
						href="https://de.wikipedia.org"
						target="_blank"
						rel="noopener noreferrer"
						class="hover:text-accent-strong text-accent underline underline-offset-2"
					>
						de.wikipedia.org
					</a>
				</dd>
			</div>
		</dl>
	</section>

	<section id="software" aria-labelledby="software-h" class="flex flex-col gap-3">
		<h2 id="software-h" class="font-serif text-2xl text-ink">{m.lizenzen_section_software()}</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			<RichText segments={softwareSegments}>
				{#snippet tag(text)}{@render codeSm(text)}{/snippet}
			</RichText>
		</p>
		<div class="overflow-auto border border-rule">
			<table class="w-full border-collapse text-sm">
				<thead class="bg-bg">
					<tr>
						<th scope="col" class="border-b border-rule px-3 py-2 text-left font-sans font-medium">
							{m.lizenzen_software_th_library()}
						</th>
						<th scope="col" class="border-b border-rule px-3 py-2 text-left font-sans font-medium">
							{m.lizenzen_software_th_license()}
						</th>
					</tr>
				</thead>
				<tbody>
					{#each runtimeSoftware as sw (sw.name)}
						<tr class="border-b border-rule/60">
							<td class="px-3 py-2">
								<a
									href={sw.url}
									target="_blank"
									rel="noopener noreferrer"
									class="hover:text-accent-strong text-accent underline underline-offset-2"
								>
									{sw.name}
								</a>
							</td>
							<td class="px-3 py-2 font-mono text-xs text-ink">{sw.license}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section id="schriften" aria-labelledby="schriften-h" class="flex flex-col gap-3">
		<h2 id="schriften-h" class="font-serif text-2xl text-ink">{m.lizenzen_section_schriften()}</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			{m.lizenzen_schriften_p1()}
		</p>
		<p class="font-mono text-xs text-ink-muted">
			<a
				href="https://github.com/IBM/plex"
				target="_blank"
				rel="noopener noreferrer"
				class="hover:text-accent-strong text-accent underline underline-offset-2"
			>
				github.com/IBM/plex
			</a>
			·
			<a
				href="https://openfontlicense.org/"
				target="_blank"
				rel="noopener noreferrer"
				class="hover:text-accent-strong text-accent underline underline-offset-2"
			>
				OFL 1.1
			</a>
		</p>
	</section>

	<section id="osm-namensnennung" aria-labelledby="osm-namensnennung-h" class="flex flex-col gap-3">
		<h2 id="osm-namensnennung-h" class="font-serif text-2xl text-ink">
			{m.lizenzen_section_osm()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			{m.lizenzen_osm_p1()}
		</p>
		<p class="font-serif text-base leading-relaxed text-ink">
			<RichText segments={osmSegments}>
				{#snippet tag(text)}
					<a
						href="https://www.openstreetmap.org/copyright"
						target="_blank"
						rel="noopener noreferrer"
						class="hover:text-accent-strong text-accent underline underline-offset-2"
					>
						{text}
					</a>
				{/snippet}
			</RichText>
		</p>
	</section>
</article>
