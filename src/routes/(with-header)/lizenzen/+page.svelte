<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import { buildBreadcrumbList, buildDataCatalog } from '$lib/seo/index.js';
	import type { LayerMetadata, License } from '$lib/data';
	import { getLayerDisplayName } from '$lib/components/atlas/internal/layer-palette-filter.js';

	type Props = { data: import('./$types').PageData };
	let { data }: Props = $props();

	const manifest = $derived(data.manifest);

	const sections = [
		{ id: 'daten-lizenzen', label: 'Daten-Lizenzen' },
		{ id: 'software', label: 'Software' },
		{ id: 'schriften', label: 'Schriften' },
		{ id: 'osm-namensnennung', label: 'OpenStreetMap-Namensnennung' }
	];

	interface LicenseInfo {
		readonly key: License;
		readonly label: string;
		readonly summary: string;
		readonly url: string;
	}

	const LICENSE_INFO: Partial<Record<License, LicenseInfo>> = {
		'dl-de/zero-2-0': {
			key: 'dl-de/zero-2-0',
			label: 'Datenlizenz Deutschland Zero 2.0',
			summary: 'Freie Verwendung. Keine Namensnennung nötig.',
			url: 'https://www.govdata.de/dl-de/zero-2-0'
		},
		'dl-de/by-2-0': {
			key: 'dl-de/by-2-0',
			label: 'Datenlizenz Deutschland Namensnennung 2.0',
			summary: 'Freie Verwendung mit Namensnennung der Quelle.',
			url: 'https://www.govdata.de/dl-de/by-2-0'
		},
		'ODbL 1.0': {
			key: 'ODbL 1.0',
			label: 'Open Database License 1.0',
			summary:
				'Namensnennung „© OpenStreetMap-Contributors" plus Share-Alike bei abgeleiteten Datenbanken.',
			url: 'https://opendatacommons.org/licenses/odbl/1-0/'
		},
		'CC BY 4.0': {
			key: 'CC BY 4.0',
			label: 'Creative Commons Attribution 4.0',
			summary: 'Freie Verwendung mit Namensnennung der Quelle.',
			url: 'https://creativecommons.org/licenses/by/4.0/deed.de'
		},
		Geodatenzugangsgesetz: {
			key: 'Geodatenzugangsgesetz',
			label: 'Geodatenzugangsgesetz (GeoZG)',
			summary:
				'Geo-Daten der Verwaltung sind zur kommerziellen und nicht-kommerziellen Nachnutzung freigegeben.',
			url: 'https://www.gesetze-im-internet.de/geozg/'
		}
	};

	function infoFor(license: License): LicenseInfo {
		return (
			LICENSE_INFO[license] ?? {
				key: license,
				label: license,
				summary: 'Lizenz-Volltext siehe Quelle.',
				url: '#'
			}
		);
	}

	function groupByLicense(layers: readonly LayerMetadata[]): Map<License, LayerMetadata[]> {
		const map = new Map<License, LayerMetadata[]>();
		for (const layer of layers) {
			const list = map.get(layer.license) ?? [];
			list.push(layer);
			map.set(layer.license, list);
		}
		for (const list of map.values()) {
			list.sort((a, b) =>
				getLayerDisplayName(a.slug).localeCompare(getLayerDisplayName(b.slug), 'de')
			);
		}
		return map;
	}

	const licenseGroups = $derived(groupByLicense(manifest.layers));

	interface SoftwareEntry {
		readonly name: string;
		readonly license: string;
		readonly url: string;
	}

	const RUNTIME_SOFTWARE: SoftwareEntry[] = [
		{ name: 'SvelteKit', license: 'MIT', url: 'https://kit.svelte.dev/' },
		{ name: 'Svelte', license: 'MIT', url: 'https://svelte.dev/' },
		{ name: 'MapLibre GL JS', license: 'BSD-3-Clause', url: 'https://maplibre.org/' },
		{ name: 'PMTiles', license: 'BSD-3-Clause', url: 'https://protomaps.com/' },
		{ name: '@lucide/svelte', license: 'ISC', url: 'https://lucide.dev/' },
		{ name: 'Turf.js (turf-bbox, turf-distance, …)', license: 'MIT', url: 'https://turfjs.org/' },
		{ name: 'd3-array, d3-scale, d3-interpolate', license: 'ISC', url: 'https://d3js.org/' },
		{ name: 'bits-ui', license: 'MIT', url: 'https://bits-ui.com/' },
		{
			name: 'LayerChart',
			license: 'MIT',
			url: 'https://www.layerchart.com/'
		},
		{ name: 'valibot', license: 'MIT', url: 'https://valibot.dev/' },
		{ name: 'rbush', license: 'MIT', url: 'https://github.com/mourner/rbush' },
		{ name: 'lru-cache', license: 'ISC', url: 'https://github.com/isaacs/node-lru-cache' },
		{
			name: 'Paraglide JS (i18n)',
			license: 'Apache-2.0',
			url: 'https://inlang.com/m/gerre34r/library-inlang-paraglideJs'
		},
		{
			name: 'Tailwind CSS',
			license: 'MIT',
			url: 'https://tailwindcss.com/'
		},
		{
			name: 'Satori + @resvg/resvg-js (OG-Image-Generator)',
			license: 'MPL-2.0',
			url: 'https://github.com/vercel/satori'
		}
	];

	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin: page.url.origin,
			items: [
				{ name: 'Berlin', path: '/' },
				{ name: 'Lizenzen', path: '/lizenzen' }
			]
		})
	);

	const dataCatalogJsonLd = $derived(
		buildDataCatalog({
			origin: page.url.origin,
			name: 'navigator.berlin Daten-Katalog',
			description: `Geo-Daten-Katalog mit ${manifest.layers.length} offenen Berliner Datensätzen aus Senats-Verwaltung, ODIS und OpenStreetMap. Pro Schicht eigene Lizenz, Quelle und Datenstand dokumentiert.`,
			urlPath: '/lizenzen',
			publisherName: 'Matze Schmidbauer',
			datasets: manifest.layers.map((l) => ({
				name: getLayerDisplayName(l.slug),
				urlPath: `/layer/${l.slug}`,
				license: l.license
			}))
		})
	);
</script>

<SeoHead
	title="Lizenzen - Berlin in Daten - navigator.berlin"
	description="Lizenzen der Geo-Daten und der verwendeten Software."
	pathname={page.url.pathname}
	origin={page.url.origin}
	ogImage={`${page.url.origin}/og/page/lizenzen.png`}
	ogImageAlt="navigator.berlin Lizenzen"
/>
<JsonLd data={breadcrumbJsonLd} testid="lizenzen-breadcrumb-jsonld" />
<JsonLd data={dataCatalogJsonLd} testid="lizenzen-datacatalog-jsonld" />

<article
	data-testid="lizenzen-page"
	class="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8"
>
	<header class="flex flex-col gap-2">
		<h1 data-testid="lizenzen-page-title" class="font-serif text-3xl text-ink">
			Lizenzen
		</h1>
		<p class="font-serif text-lg leading-relaxed text-ink-muted">
			Welche Lizenz pro Geo-Datensatz gilt und welche Software wir nutzen.
		</p>
	</header>

	<nav
		data-testid="lizenzen-toc"
		aria-label="Inhalt"
		class="border border-rule bg-bg p-4"
	>
		<p class="mb-2 font-mono text-xs uppercase tracking-wide text-ink-subtle">Inhalt</p>
		<ol class="grid gap-1.5 font-sans text-sm sm:grid-cols-2">
			{#each sections as sec (sec.id)}
				<li>
					<a
						href={`#${sec.id}`}
						class="text-accent underline underline-offset-2 hover:text-accent-strong"
					>
						{sec.label}
					</a>
				</li>
			{/each}
		</ol>
	</nav>

	<section id="daten-lizenzen" aria-labelledby="daten-lizenzen-h" class="flex flex-col gap-4">
		<h2 id="daten-lizenzen-h" class="font-serif text-2xl text-ink">Daten-Lizenzen</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			Die {manifest.layers.length} aktiven Geo-Layer stehen unter drei verschiedenen Lizenzen.
			Jede gruppiert nach Lizenz, mit Link auf den jeweiligen Volltext.
		</p>

		{#each [...licenseGroups.entries()] as [license, layers] (license)}
			{@const info = infoFor(license)}
			<div class="flex flex-col gap-2 border border-rule p-4">
				<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
					<h3 class="font-sans text-base font-semibold text-ink">{info.label}</h3>
					<a
						href={info.url}
						target="_blank"
						rel="noopener noreferrer"
						class="font-mono text-xs text-accent underline underline-offset-2 hover:text-accent-strong"
					>
						{info.key}
					</a>
				</div>
				<p class="font-serif text-sm text-ink-muted">{info.summary}</p>
				<ul class="flex flex-wrap gap-x-3 gap-y-1 font-sans text-sm">
					{#each layers as layer (layer.slug)}
						<li>
							<a
								href={`/layer/${layer.slug}`}
								class="text-accent underline underline-offset-2 hover:text-accent-strong"
							>
								{getLayerDisplayName(layer.slug)}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</section>

	<section id="software" aria-labelledby="software-h" class="flex flex-col gap-3">
		<h2 id="software-h" class="font-serif text-2xl text-ink">Software</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			Wichtigste Runtime-Bibliotheken. Vollständige Auflistung im Repository unter
			<code class="font-mono text-sm">package.json</code>.
		</p>
		<div class="overflow-auto border border-rule">
			<table class="w-full border-collapse text-sm">
				<thead class="bg-bg">
					<tr>
						<th
							scope="col"
							class="border-b border-rule px-3 py-2 text-left font-sans font-medium"
						>
							Library
						</th>
						<th
							scope="col"
							class="border-b border-rule px-3 py-2 text-left font-sans font-medium"
						>
							Lizenz
						</th>
					</tr>
				</thead>
				<tbody>
					{#each RUNTIME_SOFTWARE as sw (sw.name)}
						<tr class="border-b border-rule/60">
							<td class="px-3 py-2">
								<a
									href={sw.url}
									target="_blank"
									rel="noopener noreferrer"
									class="text-accent underline underline-offset-2 hover:text-accent-strong"
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
		<h2 id="schriften-h" class="font-serif text-2xl text-ink">Schriften</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			IBM Plex Serif, Sans und Mono unter SIL Open Font License 1.1, geliefert via
			Fontsource.
		</p>
		<p class="font-mono text-xs text-ink-muted">
			<a
				href="https://github.com/IBM/plex"
				target="_blank"
				rel="noopener noreferrer"
				class="text-accent underline underline-offset-2 hover:text-accent-strong"
			>
				github.com/IBM/plex
			</a>
			·
			<a
				href="https://openfontlicense.org/"
				target="_blank"
				rel="noopener noreferrer"
				class="text-accent underline underline-offset-2 hover:text-accent-strong"
			>
				OFL 1.1
			</a>
		</p>
	</section>

	<section
		id="osm-namensnennung"
		aria-labelledby="osm-namensnennung-h"
		class="flex flex-col gap-3"
	>
		<h2 id="osm-namensnennung-h" class="font-serif text-2xl text-ink">
			OpenStreetMap-Namensnennung
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			Die ODbL-Layer (Stolpersteine, ÖPNV-Stationen, Trinkbrunnen, S-Bahn-Netz, U-Bahn-Netz,
			Tram-Netz, Radverkehrsnetz, Fahrradstraßen) basieren auf OpenStreetMap-Daten. Lizenz:
			Open Database License 1.0.
		</p>
		<p class="font-serif text-base leading-relaxed text-ink">
			© OpenStreetMap-Contributors. Daten verfügbar unter
			<a
				href="https://www.openstreetmap.org/copyright"
				target="_blank"
				rel="noopener noreferrer"
				class="text-accent underline underline-offset-2 hover:text-accent-strong"
			>
				openstreetmap.org/copyright
			</a>.
		</p>
	</section>
</article>
