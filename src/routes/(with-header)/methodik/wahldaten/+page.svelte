<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import RichText from '$lib/components/rich-text.svelte';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { richSegments, type TagMarkers } from '$lib/i18n/rich-text.js';
	import { m } from '$lib/paraglide/messages.js';
	import { buildBreadcrumbList } from '$lib/seo/jsonld-breadcrumb.js';

	const origin = $derived(page.url.origin);
	const pathname = $derived(page.url.pathname);

	const pageTitle = m.methodik_wahldaten_meta_title();
	const pageDescription = m.methodik_wahldaten_meta_description();

	const breadcrumbs = $derived(
		buildBreadcrumbList({
			origin,
			items: [
				{ name: 'Berlin', path: localizedHref('/') },
				{ name: m.methodik_wahldaten_breadcrumb_methodik(), path: localizedHref('/methodik') },
				{
					name: m.methodik_wahldaten_breadcrumb_wahldaten(),
					path: localizedHref('/methodik/wahldaten')
				}
			]
		})
	);

	const sections = [
		{ id: 'datenquellen', label: m.methodik_wahldaten_section_quellen_heading() },
		{ id: 'cutoff', label: m.methodik_wahldaten_section_cutoff_heading() },
		{ id: 'wahldaten-briefwahl', label: m.methodik_wahldaten_section_briefwahl_heading() },
		{ id: 'aggregation', label: m.methodik_wahldaten_section_aggregation_heading() },
		{ id: 'wiederholungswahl', label: m.methodik_wahldaten_section_wiederholung_heading() },
		{ id: 'geometrien', label: m.methodik_wahldaten_section_geometrien_heading() },
		{ id: 'update-cadence', label: m.methodik_wahldaten_section_cadence_heading() },
		{ id: 'parteien-alias', label: m.methodik_wahldaten_section_alias_heading() },
		{ id: 'cross-layer', label: m.methodik_wahldaten_section_cross_layer_heading() }
	];

	const anchorClass = 'underline-offset-2 hover:text-ink hover:underline';
	const linkClass = 'hover:text-accent-strong text-accent underline underline-offset-2';

	const EXTERNAL_LINKS: Readonly<Record<string, string>> = {
		bundeswahlleiterin: 'https://www.bundeswahlleiterin.de',
		statistik: 'https://www.statistik-berlin-brandenburg.de',
		wahlenBerlin: 'https://www.wahlen-berlin.de'
	};
	const ANCHOR_LINKS: Readonly<Record<string, string>> = {
		aggregation: '#aggregation',
		geometrien: '#geometrien'
	};
	const crossLayerHref = $derived(localizedHref('/methodik/cross-layer-templates'));

	const codeParams = (t: (name: string) => TagMarkers) =>
		({ code_start: t('code').start, code_end: t('code').end }) as const;
	const strongParams = (t: (name: string) => TagMarkers) =>
		({ strong_start: t('strong').start, strong_end: t('strong').end }) as const;

	const quellenBtw = richSegments((t) =>
		m.methodik_wahldaten_quellen_btw_desc({
			...codeParams(t),
			link_start: t('bundeswahlleiterin').start,
			link_end: t('bundeswahlleiterin').end
		})
	);
	const quellenAgh = richSegments((t) =>
		m.methodik_wahldaten_quellen_agh_desc({
			...codeParams(t),
			link1_start: t('statistik').start,
			link1_end: t('statistik').end,
			link2_start: t('wahlenBerlin').start,
			link2_end: t('wahlenBerlin').end
		})
	);
	const quellenGeometrien = richSegments((t) =>
		m.methodik_wahldaten_quellen_geometrien_desc(codeParams(t))
	);
	const cutoffLis = [
		richSegments((t) => m.methodik_wahldaten_cutoff_li_btw(strongParams(t))),
		richSegments((t) => m.methodik_wahldaten_cutoff_li_agh(strongParams(t))),
		richSegments((t) => m.methodik_wahldaten_cutoff_li_bvv(strongParams(t))),
		richSegments((t) => m.methodik_wahldaten_cutoff_li_europa(strongParams(t))),
		richSegments((t) => m.methodik_wahldaten_cutoff_li_volksentscheid(strongParams(t)))
	];
	const briefwahlP3 = richSegments((t) =>
		m.methodik_wahldaten_briefwahl_p3({
			link1_start: t('aggregation').start,
			link1_end: t('aggregation').end,
			link2_start: t('geometrien').start,
			link2_end: t('geometrien').end
		})
	);
	const aggregationP3 = richSegments((t) => m.methodik_wahldaten_aggregation_p3(codeParams(t)));
	const wiederholungP1 = richSegments((t) => m.methodik_wahldaten_wiederholung_p1(codeParams(t)));
	const wiederholungP2 = richSegments((t) => m.methodik_wahldaten_wiederholung_p2(codeParams(t)));
	const geometrienP2 = richSegments((t) => m.methodik_wahldaten_geometrien_p2(codeParams(t)));
	const aliasP1 = richSegments((t) => m.methodik_wahldaten_alias_p1(codeParams(t)));
	const crossLayerP1 = richSegments((t) =>
		m.methodik_wahldaten_cross_layer_p1({
			link_start: t('crossLayer').start,
			link_end: t('crossLayer').end
		})
	);
</script>

{#snippet tag(text: string, name: string)}
	{#if name === 'code'}
		<code class="font-mono text-xs">{text}</code>
	{:else if name === 'strong'}
		<strong>{text}</strong>
	{:else if name in EXTERNAL_LINKS}
		<a href={EXTERNAL_LINKS[name]} rel="noopener noreferrer" class={linkClass}>{text}</a>
	{:else if name in ANCHOR_LINKS}
		<a href={ANCHOR_LINKS[name]} class={anchorClass}>{text}</a>
	{:else if name === 'crossLayer'}
		<a href={crossLayerHref} class={linkClass}>{text}</a>
	{:else}
		{text}
	{/if}
{/snippet}

<SeoHead title={pageTitle} description={pageDescription} {origin} {pathname} />

<JsonLd data={breadcrumbs} testid="wahldaten-breadcrumb-jsonld" />

<article
	class="mx-auto prose max-w-3xl space-y-8 px-4 py-8 prose-stone"
	data-testid="wahl-methodik-page"
>
	<header class="space-y-2">
		<p class="font-mono text-xs tracking-wide text-ink-muted uppercase">
			<a href={localizedHref('/')} class={anchorClass}>Berlin</a>
			·
			<a href={localizedHref('/methodik')} class={anchorClass}
				>{m.methodik_wahldaten_breadcrumb_methodik()}</a
			>
		</p>
		<h1 class="font-sans text-2xl font-bold break-words hyphens-auto text-ink sm:text-3xl">
			{m.methodik_wahldaten_h1_title()}
		</h1>
		<p class="font-serif text-base leading-relaxed text-ink-muted">
			{m.methodik_wahldaten_intro_p1()}
		</p>
	</header>

	<nav
		aria-label={m.methodik_wahldaten_toc_aria_label()}
		class="space-y-1 font-mono text-xs text-ink-muted"
	>
		<p class="tracking-wide uppercase">{m.methodik_wahldaten_toc_heading()}</p>
		<ol class="space-y-0.5">
			{#each sections as sec (sec.id)}
				<li>
					<a href={`#${sec.id}`} class="inline-block py-1 {anchorClass}">{sec.label}</a>
				</li>
			{/each}
		</ol>
	</nav>

	<section id="datenquellen" class="space-y-3">
		<h2 class="font-sans text-xl font-semibold text-ink">
			{m.methodik_wahldaten_section_quellen_heading()}
		</h2>
		<dl class="space-y-3">
			<dt class="font-medium text-ink">{m.methodik_wahldaten_quellen_btw_term()}</dt>
			<dd class="text-ink-muted"><RichText segments={quellenBtw} {tag} /></dd>
			<dt class="font-medium text-ink">{m.methodik_wahldaten_quellen_agh_term()}</dt>
			<dd class="text-ink-muted"><RichText segments={quellenAgh} {tag} /></dd>
			<dt class="font-medium text-ink">{m.methodik_wahldaten_quellen_geometrien_term()}</dt>
			<dd class="text-ink-muted"><RichText segments={quellenGeometrien} {tag} /></dd>
		</dl>
	</section>

	<section id="cutoff" class="space-y-3">
		<h2 class="font-sans text-xl font-semibold text-ink">
			{m.methodik_wahldaten_section_cutoff_heading()}
		</h2>
		<p>{m.methodik_wahldaten_cutoff_p1()}</p>
		<ul class="space-y-1">
			{#each cutoffLis as segments, i (i)}
				<li><RichText {segments} {tag} /></li>
			{/each}
		</ul>
	</section>

	<section id="wahldaten-briefwahl" class="space-y-3">
		<h2 class="font-sans text-xl font-semibold text-ink">
			{m.methodik_wahldaten_section_briefwahl_heading()}
		</h2>
		<p>{m.methodik_wahldaten_briefwahl_p1()}</p>
		<p>{m.methodik_wahldaten_briefwahl_p2()}</p>
		<p><RichText segments={briefwahlP3} {tag} /></p>
	</section>

	<section id="aggregation" class="space-y-3">
		<h2 class="font-sans text-xl font-semibold text-ink">
			{m.methodik_wahldaten_section_aggregation_heading()}
		</h2>
		<p>{m.methodik_wahldaten_aggregation_p1()}</p>
		<p>{m.methodik_wahldaten_aggregation_p2()}</p>
		<p><RichText segments={aggregationP3} {tag} /></p>
	</section>

	<section id="wiederholungswahl" class="space-y-3">
		<h2 class="font-sans text-xl font-semibold text-ink">
			{m.methodik_wahldaten_section_wiederholung_heading()}
		</h2>
		<p><RichText segments={wiederholungP1} {tag} /></p>
		<p><RichText segments={wiederholungP2} {tag} /></p>
	</section>

	<section id="geometrien" class="space-y-3">
		<h2 class="font-sans text-xl font-semibold text-ink">
			{m.methodik_wahldaten_section_geometrien_heading()}
		</h2>
		<p>{m.methodik_wahldaten_geometrien_p1()}</p>
		<p><RichText segments={geometrienP2} {tag} /></p>
	</section>

	<section id="update-cadence" class="space-y-3">
		<h2 class="font-sans text-xl font-semibold text-ink">
			{m.methodik_wahldaten_section_cadence_heading()}
		</h2>
		<p>{m.methodik_wahldaten_cadence_p1()}</p>
		<p>{m.methodik_wahldaten_cadence_p2()}</p>
		<p>{m.methodik_wahldaten_cadence_p3()}</p>
	</section>

	<section id="parteien-alias" class="space-y-3">
		<h2 class="font-sans text-xl font-semibold text-ink">
			{m.methodik_wahldaten_section_alias_heading()}
		</h2>
		<p><RichText segments={aliasP1} {tag} /></p>
	</section>

	<section id="cross-layer" class="space-y-3">
		<h2 class="font-sans text-xl font-semibold text-ink">
			{m.methodik_wahldaten_section_cross_layer_heading()}
		</h2>
		<p><RichText segments={crossLayerP1} {tag} /></p>
	</section>

	<a
		href={localizedHref('/berlin-wahlen#alle-wahlen')}
		class="hover:text-accent-strong inline-block font-mono text-sm text-accent underline underline-offset-2"
	>
		{m.methodik_wahldaten_link_alle_wahlen()}
	</a>
</article>
