<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import RichText from '$lib/components/rich-text.svelte';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { richSegments } from '$lib/i18n/rich-text.js';
	import { m } from '$lib/paraglide/messages.js';
	import { buildBreadcrumbList } from '$lib/seo/index.js';
	import WebmcpDiagnose from '$lib/components/webmcp-diagnose.svelte';

	const linkClass = 'text-accent underline';

	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin: page.url.origin,
			items: [
				{ name: 'Berlin', path: localizedHref('/') },
				{ name: 'WebMCP', path: localizedHref('/webmcp') }
			]
		})
	);

	const noCanaryHrefs: Record<string, string> = {
		link1: '/.well-known/webmcp.json',
		link2: '/webmcp-manifest.json',
		link3: 'https://llmstxt.org',
		link4: '/llms.txt',
		link5: '/llms-full.txt'
	};

	const toolRows = $derived([
		{ name: 'address_lookup', desc: m.webmcp_tool_address_lookup_desc() },
		{ name: 'cross_layer_query', desc: m.webmcp_tool_cross_layer_query_desc() },
		{ name: 'list_layers_at_point', desc: m.webmcp_tool_list_layers_at_point_desc() },
		{ name: 'get_kiez_profile', desc: m.webmcp_tool_get_kiez_profile_desc() },
		{ name: 'get_layer_metadata', desc: m.webmcp_tool_get_layer_metadata_desc() },
		{ name: 'list_elections', desc: m.webmcp_tool_list_elections_desc() },
		{ name: 'get_election_result', desc: m.webmcp_tool_get_election_result_desc() },
		{ name: 'compare_elections', desc: m.webmcp_tool_compare_elections_desc() },
		{
			name: 'get_voting_district_geometry',
			desc: m.webmcp_tool_get_voting_district_geometry_desc()
		},
		{ name: 'set_finder_weights', desc: m.webmcp_tool_set_finder_weights_desc() },
		{ name: 'get_finder_state', desc: m.webmcp_tool_get_finder_state_desc() }
	]);

	const specP1Segments = $derived(
		richSegments((t) =>
			m.webmcp_spec_p1({
				link_start: t('link').start,
				link_end: t('link').end,
				code_start: t('code').start,
				code_end: t('code').end
			})
		)
	);

	const specP2Segments = $derived(
		richSegments((t) =>
			m.webmcp_spec_p2({
				link_start: t('link').start,
				link_end: t('link').end
			})
		)
	);

	const chromeSegments = $derived(
		richSegments((t) =>
			m.webmcp_support_chrome_desc({
				code_start: t('code').start,
				code_end: t('code').end
			})
		)
	);

	const chatgptSegments = $derived(
		richSegments((t) =>
			m.webmcp_support_chatgpt_desc({
				code_start: t('code').start,
				code_end: t('code').end
			})
		)
	);

	const polyfillSegments = $derived(
		richSegments((t) =>
			m.webmcp_support_polyfill_desc({
				code_start: t('code').start,
				code_end: t('code').end
			})
		)
	);

	const toolsP1Segments = $derived(
		richSegments((t) =>
			m.webmcp_tools_p1({
				link_start: t('link').start,
				link_end: t('link').end
			})
		)
	);

	const step1Segments = $derived(
		richSegments((t) =>
			m.webmcp_canary_step1({
				link_start: t('link').start,
				link_end: t('link').end
			})
		)
	);

	const step2Segments = $derived(
		richSegments((t) =>
			m.webmcp_canary_step2({
				code_start: t('code').start,
				code_end: t('code').end
			})
		)
	);

	const step3Segments = $derived(
		richSegments((t) =>
			m.webmcp_canary_step3({
				code_start: t('code').start,
				code_end: t('code').end
			})
		)
	);

	const step4Segments = $derived(
		richSegments((t) =>
			m.webmcp_canary_step4({
				link_start: t('link').start,
				link_end: t('link').end
			})
		)
	);

	const noCanaryP2Segments = $derived(
		richSegments((t) =>
			m.webmcp_no_canary_p2({
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
</script>

{#snippet code(text: string)}
	<code class="font-mono text-sm">{text}</code>
{/snippet}

{#snippet externalLink(href: string, text: string)}
	<a class={linkClass} {href} rel="noopener noreferrer" target="_blank">{text}</a>
{/snippet}

{#snippet codeOnly(segments: ReturnType<typeof richSegments>)}
	<RichText {segments}>
		{#snippet tag(text)}
			{@render code(text)}
		{/snippet}
	</RichText>
{/snippet}

<SeoHead
	title={m.webmcp_meta_title()}
	description={m.webmcp_meta_description()}
	pathname={page.url.pathname}
	origin={page.url.origin}
	ogImage={`${page.url.origin}/og/page/architektur.png`}
	ogImageAlt="navigator.berlin WebMCP"
/>
<JsonLd data={breadcrumbJsonLd} testid="webmcp-breadcrumb-jsonld" />

<main class="mx-auto max-w-2xl px-4 py-12" data-testid="webmcp-page">
	<h1 class="font-serif text-2xl break-words hyphens-auto sm:text-3xl">WebMCP</h1>

	<p class="text-fg-muted mt-6 leading-relaxed">{m.webmcp_intro_p1()}</p>

	<WebmcpDiagnose />

	<section class="mt-10">
		<h2 class="font-serif text-xl">{m.webmcp_spec_heading()}</h2>
		<p class="mt-3 leading-relaxed">
			<RichText segments={specP1Segments}>
				{#snippet tag(text, name)}
					{#if name === 'link'}
						{@render externalLink('https://webmachinelearning.github.io/webmcp/', text)}
					{:else}
						{@render code(text)}
					{/if}
				{/snippet}
			</RichText>
		</p>
		<p class="mt-3 leading-relaxed">
			<RichText segments={specP2Segments}>
				{#snippet tag(text)}
					{@render externalLink('https://github.com/webmachinelearning/webmcp', text)}
				{/snippet}
			</RichText>
		</p>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">{m.webmcp_support_heading()}</h2>
		<dl class="mt-3 space-y-3 leading-relaxed">
			<div>
				<dt class="font-medium">Chrome 149+</dt>
				<dd class="text-fg-muted">{@render codeOnly(chromeSegments)}</dd>
			</div>
			<div>
				<dt class="font-medium">{m.webmcp_support_chatgpt_term()}</dt>
				<dd class="text-fg-muted">{@render codeOnly(chatgptSegments)}</dd>
			</div>
			<div>
				<dt class="font-medium">Microsoft Edge 150+</dt>
				<dd class="text-fg-muted">{m.webmcp_support_edge_desc()}</dd>
			</div>
			<div>
				<dt class="font-medium">Firefox</dt>
				<dd class="text-fg-muted">{m.webmcp_support_firefox_desc()}</dd>
			</div>
			<div>
				<dt class="font-medium">Safari</dt>
				<dd class="text-fg-muted">{m.webmcp_support_safari_desc()}</dd>
			</div>
			<div>
				<dt class="font-medium">Polyfill</dt>
				<dd class="text-fg-muted">{@render codeOnly(polyfillSegments)}</dd>
			</div>
		</dl>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">{m.webmcp_rationale_heading()}</h2>
		<p class="mt-3 leading-relaxed">{m.webmcp_rationale_lead()}</p>
		<ul class="mt-3 ml-6 list-disc space-y-2 leading-relaxed">
			<li>{m.webmcp_rationale_li_discovery()}</li>
			<li>{m.webmcp_rationale_li_standards()}</li>
			<li>{m.webmcp_rationale_li_effort()}</li>
			<li>{m.webmcp_rationale_li_risk()}</li>
		</ul>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">{m.webmcp_tools_heading()}</h2>
		<p class="mt-3 leading-relaxed">
			<RichText segments={toolsP1Segments}>
				{#snippet tag(text)}
					<a class={linkClass} href="/webmcp-manifest.json">{text}</a>
				{/snippet}
			</RichText>
		</p>
		<dl class="mt-3 space-y-2 leading-relaxed">
			{#each toolRows as tool (tool.name)}
				<div>
					<dt class="font-mono text-sm">{tool.name}</dt>
					<dd class="text-fg-muted text-sm">{tool.desc}</dd>
				</div>
			{/each}
		</dl>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">{m.webmcp_canary_heading()}</h2>
		<ol class="mt-3 ml-6 list-decimal space-y-2 leading-relaxed">
			<li>
				<RichText segments={step1Segments}>
					{#snippet tag(text)}
						{@render externalLink('https://www.google.com/chrome/canary/', text)}
					{/snippet}
				</RichText>
			</li>
			<li>{@render codeOnly(step2Segments)}</li>
			<li>{@render codeOnly(step3Segments)}</li>
			<li>
				<RichText segments={step4Segments}>
					{#snippet tag(text)}
						{@render externalLink('https://chromewebstore.google.com/', text)}
					{/snippet}
				</RichText>
			</li>
		</ol>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">{m.webmcp_no_canary_heading()}</h2>
		<p class="mt-3 leading-relaxed">{m.webmcp_no_canary_p1()}</p>
		<p class="mt-3 leading-relaxed">
			<RichText segments={noCanaryP2Segments}>
				{#snippet tag(text, name)}
					{@const href = noCanaryHrefs[name]}
					{#if !href}{text}{:else if name === 'link3'}
						{@render externalLink(href, text)}
					{:else}
						<a class={linkClass} {href}>{text}</a>
					{/if}
				{/snippet}
			</RichText>
		</p>
	</section>

	<section class="mt-10">
		<h2 class="font-serif text-xl">{m.webmcp_sources_heading()}</h2>
		<ul class="mt-3 ml-6 list-disc space-y-2 leading-relaxed">
			<li>
				{@render externalLink(
					'https://webmachinelearning.github.io/webmcp/',
					"WebMCP Editor's Draft, Web Machine Learning CG"
				)}
			</li>
			<li>
				{@render externalLink(
					'https://github.com/webmachinelearning/webmcp',
					m.webmcp_sources_li_github()
				)}
			</li>
			<li>
				{@render externalLink(
					'https://patrickbrosset.com/articles/2026-02-23-webmcp-updates-clarifications-and-next-steps/',
					'Patrick Brosset: WebMCP updates, clarifications, and next steps (Feb 2026)'
				)}
			</li>
		</ul>
	</section>
</main>
