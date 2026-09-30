<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import RichText from '$lib/components/rich-text.svelte';
	import { formatCount } from '$lib/i18n/format.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { richSegments } from '$lib/i18n/rich-text.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { buildBreadcrumbList } from '$lib/seo/index.js';
	import { localeToBcp47 } from '$lib/seo/locale-meta.js';
	import { FEEDBACK_EMAIL } from '$lib/utils/contact.js';
	import {
		getAggregationLevels,
		getCoverageReasons,
		getMethodikSections,
		getOmissions
	} from './methodik-content.js';
	import MethodikDatenTabelle from './methodik-daten-tabelle.svelte';
	import MethodikPipelineDiagram from './methodik-pipeline-diagram.svelte';

	type Props = { data: import('./$types').PageData };
	let { data }: Props = $props();

	const manifest = $derived(data.manifest);
	// Build-only-Layer (weder Karte noch Inspector, z.B. Heritage-Dichte-Signal) tauchen
	// nicht im Frontend auf, also auch nicht in der Methodik-Tabelle.
	const visibleLayers = $derived(
		manifest.layers.filter((l) => !(l.inspectorRelevant === false && l.mapRelevant === false))
	);
	const layerCount = $derived(visibleLayers.length);

	const sections = getMethodikSections();
	const aggregationLevels = getAggregationLevels();
	const coverageReasons = getCoverageReasons();
	const omissions = getOmissions();

	const pageTitle = m.methodik_meta_title();
	const pageDescription = m.methodik_meta_description();

	const linkClass = 'hover:text-accent-strong text-accent underline underline-offset-2';
	const feedbackHref = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(m.methodik_feedback_mail_subject())}`;

	const kiezScoreLinkSegments = richSegments((t) =>
		m.methodik_cross_layer_full_methodology({
			link_start: t('link').start,
			link_end: t('link').end
		})
	);
	const electionLinkSegments = richSegments((t) =>
		m.methodik_election_full_methodology({
			link1_start: t('link1').start,
			link1_end: t('link1').end,
			link2_start: t('link2').start,
			link2_end: t('link2').end
		})
	);
	const licencesLinkSegments = richSegments((t) =>
		m.methodik_licences_full_list({ link_start: t('link').start, link_end: t('link').end })
	);

	/**
	 * Story 2.2 AC-4: Methodik-Page bleibt bei `TechArticle`. Inline-Object,
	 * weil dieser Generator nicht in der Lib lebt (Methodik ist die einzige
	 * Konsumentin). Typed via JSON-LD-Object-Shape, NICHT via schema-dts-Union.
	 */
	const jsonLd = $derived({
		'@context': 'https://schema.org' as const,
		'@type': 'TechArticle',
		headline: m.methodik_jsonld_headline(),
		description: pageDescription,
		inLanguage: localeToBcp47(getLocale()),
		datePublished: '2026-05-15',
		dateModified: manifest.generatedAt,
		author: { '@type': 'Organization', name: 'navigator.berlin' }
	});

	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin: page.url.origin,
			items: [
				{ name: 'Berlin', path: '/' },
				{ name: m.methodik_breadcrumb_methodik(), path: localizedHref('/methodik') }
			]
		})
	);
</script>

<SeoHead
	title={pageTitle}
	description={pageDescription}
	pathname={page.url.pathname}
	origin={page.url.origin}
	ogImage={`${page.url.origin}/og/page/methodik.png`}
	ogImageAlt={m.methodik_og_image_alt()}
/>

<JsonLd data={jsonLd} testid="methodik-jsonld" />
<JsonLd data={breadcrumbJsonLd} testid="methodik-breadcrumb-jsonld" />

<article data-testid="methodik-page" class="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
	<header class="flex flex-col gap-2">
		<h1 data-testid="methodik-page-title" class="font-serif text-3xl text-ink">
			{m.methodik_h1_title()}
		</h1>
		<p class="font-serif text-lg leading-relaxed text-ink-muted">
			{pageDescription}
		</p>
	</header>

	<nav
		data-testid="methodik-toc"
		aria-label={m.methodik_toc_aria_label()}
		class="border border-rule bg-bg p-4"
	>
		<p class="mb-2 font-mono text-xs tracking-wide text-ink-subtle uppercase">
			{m.methodik_toc_heading()}
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

	<section id="mission" aria-labelledby="mission-h" class="flex flex-col gap-3">
		<h2 id="mission-h" class="font-serif text-2xl text-ink">
			{m.methodik_section_mission_heading()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			{m.methodik_mission_p1({ layerCount: formatCount(layerCount) })}
		</p>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_mission_p2()}</p>
	</section>

	<section id="datenarchitektur" aria-labelledby="datenarchitektur-h" class="flex flex-col gap-3">
		<h2 id="datenarchitektur-h" class="font-serif text-2xl text-ink">
			{m.methodik_section_architecture_heading()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_architecture_p1()}</p>
		<MethodikPipelineDiagram />
	</section>

	<section
		id="aggregations-ebenen"
		aria-labelledby="aggregations-ebenen-h"
		class="flex flex-col gap-3"
	>
		<h2 id="aggregations-ebenen-h" class="font-serif text-2xl text-ink">
			{m.methodik_section_aggregation_heading()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_aggregation_p1()}</p>
		<dl class="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-sm">
			{#each aggregationLevels as agg (agg.level)}
				<dt class="font-mono text-xs text-ink-muted">{agg.level}</dt>
				<dd class="text-ink">{agg.detail}</dd>
			{/each}
		</dl>
	</section>

	<section
		id="karten-darstellung"
		aria-labelledby="karten-darstellung-h"
		class="flex flex-col gap-3"
	>
		<h2 id="karten-darstellung-h" class="font-serif text-2xl text-ink">
			{m.methodik_section_map_heading()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_map_p1()}</p>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_map_p2()}</p>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_map_p3()}</p>
	</section>

	<section id="was-ist-kiez" aria-labelledby="was-ist-kiez-h" class="flex flex-col gap-3">
		<h2 id="was-ist-kiez-h" class="font-serif text-2xl text-ink">
			{m.methodik_section_kiez_heading()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_kiez_p1()}</p>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_kiez_p2()}</p>
	</section>

	<section id="cross-layer" aria-labelledby="cross-layer-h" class="flex flex-col gap-3">
		<h2 id="cross-layer-h" class="font-serif text-2xl text-ink">
			{m.methodik_section_cross_layer_heading()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_cross_layer_p1()}</p>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_cross_layer_p2()}</p>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_cross_layer_p3()}</p>
		<p class="font-mono text-xs text-ink-muted">
			<RichText segments={kiezScoreLinkSegments}>
				{#snippet tag(text)}
					<a
						href={localizedHref('/methodik/kiez-score')}
						data-testid="methodik-kiez-score-link"
						class={linkClass}>{text}</a
					>
				{/snippet}
			</RichText>
		</p>
		<h3 class="mt-2 font-serif text-xl text-ink">{m.methodik_mss_heading()}</h3>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_mss_p1()}</p>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_mss_p2()}</p>
	</section>

	<section id="wahldaten-section" aria-labelledby="wahldaten-section-h" class="flex flex-col gap-3">
		<h2 id="wahldaten-section-h" class="font-serif text-2xl text-ink">
			{m.methodik_section_election_heading()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_election_p1()}</p>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_election_p2()}</p>
		<p class="font-mono text-xs text-ink-muted">
			<RichText segments={electionLinkSegments}>
				{#snippet tag(text, name)}
					{#if name === 'link1'}
						<a
							href={localizedHref('/methodik/wahldaten')}
							data-testid="methodik-wahldaten-link"
							class={linkClass}>{text}</a
						>
					{:else}
						<a href={`${localizedHref('/berlin-wahlen')}#alle-wahlen`} class={linkClass}>{text}</a>
					{/if}
				{/snippet}
			</RichText>
		</p>
	</section>

	<section id="kuehle-orte" aria-labelledby="kuehle-orte-h" class="flex flex-col gap-3">
		<h2 id="kuehle-orte-h" class="font-serif text-2xl text-ink">
			{m.methodik_section_cool_places_heading()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_cool_places_p1()}</p>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_cool_places_p2()}</p>
		<p class="font-serif text-sm text-ink-muted">
			<a href={localizedHref('/lizenzen')} data-testid="methodik-kuehle-orte-link" class={linkClass}
				>{m.methodik_cool_places_sources_link()}</a
			>
		</p>
	</section>

	<section
		id="coverage-strategie"
		aria-labelledby="coverage-strategie-h"
		class="flex flex-col gap-3"
	>
		<h2 id="coverage-strategie-h" class="font-serif text-2xl text-ink">
			{m.methodik_section_coverage_heading()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_coverage_p1()}</p>
		<dl class="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-sm">
			{#each coverageReasons as reason (reason.key)}
				<dt class="font-mono text-xs text-ink-muted">{reason.key}</dt>
				<dd class="text-ink">{reason.text}</dd>
			{/each}
		</dl>
	</section>

	<section id="omissions" aria-labelledby="omissions-h" class="flex flex-col gap-3">
		<h2 id="omissions-h" class="font-serif text-2xl text-ink">
			{m.methodik_section_omissions_heading()}
		</h2>
		<ul class="flex flex-col gap-3">
			{#each omissions as o (o.label)}
				<li class="border-l-2 border-rule pl-3">
					<p class="font-sans text-base font-semibold text-ink">{o.label}</p>
					<p class="font-serif text-sm text-ink-muted">{o.reason}</p>
				</li>
			{/each}
		</ul>
	</section>

	<section id="editorial" aria-labelledby="editorial-h" class="flex flex-col gap-3">
		<h2 id="editorial-h" class="font-serif text-2xl text-ink">
			{m.methodik_section_editorial_heading()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_editorial_p1()}</p>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_editorial_p2()}</p>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_editorial_p3()}</p>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_editorial_p4()}</p>
	</section>

	<section id="daten-stand" aria-labelledby="daten-stand-h" class="flex flex-col gap-3">
		<h2 id="daten-stand-h" class="font-serif text-2xl text-ink">
			{m.methodik_section_data_status_heading()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink-muted">
			{m.methodik_data_status_intro()}
		</p>
		<MethodikDatenTabelle layers={visibleLayers} />
	</section>

	<section id="lizenzen" aria-labelledby="lizenzen-h" class="flex flex-col gap-3">
		<h2 id="lizenzen-h" class="font-serif text-2xl text-ink">
			{m.methodik_section_licences_heading()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_licences_p1()}</p>
		<p class="font-mono text-xs text-ink-muted">
			<RichText segments={licencesLinkSegments}>
				{#snippet tag(text)}
					<a href={localizedHref('/lizenzen')} class={linkClass}>{text}</a>
				{/snippet}
			</RichText>
		</p>
	</section>

	<section id="feedback" aria-labelledby="feedback-h" class="flex flex-col gap-3">
		<h2 id="feedback-h" class="font-serif text-2xl text-ink">
			{m.methodik_section_feedback_heading()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_feedback_p1()}</p>
		<p class="font-mono text-sm">
			<a href={feedbackHref} class={linkClass}>
				{FEEDBACK_EMAIL}
			</a>
		</p>
	</section>
</article>
