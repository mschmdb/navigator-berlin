<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import RichText from '$lib/components/rich-text.svelte';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { richSegments } from '$lib/i18n/rich-text.js';
	import { m } from '$lib/paraglide/messages.js';
	import { buildBreadcrumbList } from '$lib/seo/index.js';

	const linkClass = 'text-accent underline';

	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin: page.url.origin,
			items: [
				{ name: 'Berlin', path: localizedHref('/') },
				{ name: m.architektur_breadcrumb_architektur(), path: localizedHref('/architektur') }
			]
		})
	);

	const quellenPaths: Record<string, string> = { link1: '/methodik', link2: '/lizenzen' };
	const svelteHrefs: Record<string, string> = {
		link1: 'https://svelte.dev/',
		link2: 'https://kit.svelte.dev/'
	};
	const karteHrefs: Record<string, string> = {
		link1: 'https://maplibre.org/',
		link2: 'https://openfreemap.org/'
	};

	const svelteSegments = $derived(
		richSegments((t) =>
			m.architektur_anwendung_li_svelte({
				link1_start: t('link1').start,
				link1_end: t('link1').end,
				link2_start: t('link2').start,
				link2_end: t('link2').end
			})
		)
	);
	const karteSegments = $derived(
		richSegments((t) =>
			m.architektur_anwendung_li_karte({
				link1_start: t('link1').start,
				link1_end: t('link1').end,
				link2_start: t('link2').start,
				link2_end: t('link2').end
			})
		)
	);
	const bundeswahlleiterinSegments = $derived(
		richSegments((t) =>
			m.architektur_quellen_li_bundeswahlleiterin({
				link_start: t('link').start,
				link_end: t('link').end
			})
		)
	);
	const quellenSegments = $derived(
		richSegments((t) =>
			m.architektur_quellen_p1({
				link1_start: t('link1').start,
				link1_end: t('link1').end,
				link2_start: t('link2').start,
				link2_end: t('link2').end
			})
		)
	);
	const webmcpSegments = $derived(
		richSegments((t) =>
			m.architektur_ki_p2({ link_start: t('link').start, link_end: t('link').end })
		)
	);
	const manifestSegments = $derived(
		richSegments((t) =>
			m.architektur_ki_p4({
				link1_start: t('link1').start,
				link1_end: t('link1').end,
				link2_start: t('link2').start,
				link2_end: t('link2').end,
				link3_start: t('link3').start,
				link3_end: t('link3').end,
				link4_start: t('link4').start,
				link4_end: t('link4').end,
				link5_start: t('link5').start,
				link5_end: t('link5').end
			})
		)
	);
	const manifestHrefs: Record<string, string> = {
		link1: '/.well-known/webmcp.json',
		link2: '/webmcp-manifest.json',
		link3: '/llms.txt',
		link4: '/llms-full.txt',
		link5: 'https://llmstxt.org'
	};
	const specStatusSegments = $derived(
		richSegments((t) =>
			m.architektur_ki_p5({ link_start: t('link').start, link_end: t('link').end })
		)
	);
</script>

{#snippet externalLink(href: string, text: string)}
	<a class={linkClass} {href} rel="noopener noreferrer" target="_blank">{text}</a>
{/snippet}

<SeoHead
	title={m.architektur_meta_title()}
	description={m.architektur_meta_description()}
	pathname={page.url.pathname}
	origin={page.url.origin}
	ogImage={`${page.url.origin}/og/page/architektur.png`}
	ogImageAlt={m.architektur_og_image_alt()}
/>
<JsonLd data={breadcrumbJsonLd} testid="architektur-breadcrumb-jsonld" />

<main class="mx-auto max-w-2xl px-4 py-12">
	<h1 class="font-serif text-2xl break-words hyphens-auto sm:text-3xl">
		{m.architektur_h1_title()}
	</h1>

	<p class="text-fg-muted mt-6 leading-relaxed">{m.architektur_intro_p1()}</p>

	<section class="mt-10">
		<h2 class="font-serif text-xl">Hosting</h2>
		<p class="mt-3 leading-relaxed">{m.architektur_hosting_p1()}</p>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">{m.architektur_anwendung_heading()}</h2>
		<ul class="mt-3 ml-6 list-disc space-y-2 leading-relaxed">
			<li>
				<RichText segments={svelteSegments}>
					{#snippet tag(text, name)}
						{@const href = svelteHrefs[name]}
						{#if href}{@render externalLink(href, text)}{:else}{text}{/if}
					{/snippet}
				</RichText>
			</li>
			<li>
				<RichText segments={karteSegments}>
					{#snippet tag(text, name)}
						{@const href = karteHrefs[name]}
						{#if href}{@render externalLink(href, text)}{:else}{text}{/if}
					{/snippet}
				</RichText>
			</li>
			<li>
				Geocoding:
				<a
					class="text-accent underline"
					href="https://nominatim.openstreetmap.org/"
					rel="noopener noreferrer"
					target="_blank">Nominatim</a
				>
				(OpenStreetMap Foundation, EU)
			</li>
			<li>{m.architektur_anwendung_li_styling()}</li>
		</ul>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">{m.architektur_quellen_heading()}</h2>
		<ul class="mt-3 ml-6 list-disc space-y-2 leading-relaxed">
			<li>
				<a
					class="text-accent underline"
					href="https://daten.berlin.de/"
					rel="noopener noreferrer"
					target="_blank">ODIS Berlin</a
				>
			</li>
			<li>FIS-Broker (Geoportal Berlin)</li>
			<li>{m.architektur_quellen_li_statistik()}</li>
			<li>
				<RichText segments={bundeswahlleiterinSegments}>
					{#snippet tag(text)}
						{@render externalLink('https://bundeswahlleiterin.de', text)}
					{/snippet}
				</RichText>
			</li>
			<li>{m.architektur_quellen_li_dwd()}</li>
			<li>OpenStreetMap</li>
		</ul>
		<p class="mt-3 leading-relaxed">
			<RichText segments={quellenSegments}>
				{#snippet tag(text, name)}
					{@const path = quellenPaths[name]}
					{#if path}<a class={linkClass} href={localizedHref(path)}>{text}</a>{:else}{text}{/if}
				{/snippet}
			</RichText>
		</p>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">{m.architektur_ki_heading()}</h2>
		<p class="mt-3 leading-relaxed">{m.architektur_ki_p1()}</p>
		<p class="mt-3 leading-relaxed">
			<RichText segments={webmcpSegments}>
				{#snippet tag(text)}
					{@render externalLink('https://github.com/webmachinelearning/webmcp', text)}
				{/snippet}
			</RichText>
		</p>
		<p class="mt-3 leading-relaxed">{m.architektur_ki_p3()}</p>
		<p class="mt-3 leading-relaxed">
			<RichText segments={manifestSegments}>
				{#snippet tag(text, name)}
					{@const href = manifestHrefs[name]}
					{#if !href}{text}{:else if name === 'link5'}
						{@render externalLink(href, text)}
					{:else}
						<a class={linkClass} {href}>{text}</a>
					{/if}
				{/snippet}
			</RichText>
		</p>
		<p class="mt-3 leading-relaxed">
			<RichText segments={specStatusSegments}>
				{#snippet tag(text)}
					<a class={linkClass} href={localizedHref('/webmcp')}>{text}</a>
				{/snippet}
			</RichText>
		</p>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">{m.architektur_nicht_verwendet_heading()}</h2>
		<ul class="mt-3 ml-6 list-disc space-y-2 leading-relaxed">
			<li>Cloudflare, AWS, GCP, Azure</li>
			<li>{m.architektur_nicht_verwendet_li_tracker()}</li>
			<li>{m.architektur_nicht_verwendet_li_embeds()}</li>
			<li>{m.architektur_nicht_verwendet_li_cookies()}</li>
			<li>{m.architektur_nicht_verwendet_li_accounts()}</li>
		</ul>
	</section>
</main>
