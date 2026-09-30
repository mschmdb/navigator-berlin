<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import RichText from '$lib/components/rich-text.svelte';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { richSegments } from '$lib/i18n/rich-text.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { buildBreadcrumbList, buildSpeakableWebPage } from '$lib/seo/index.js';
	import { localeToBcp47 } from '$lib/seo/locale-meta.js';
	import { FEEDBACK_EMAIL } from '$lib/utils/contact.js';
	import {
		getKiezScoreDimensions,
		getKiezScoreOmissions,
		getKiezScoreSections,
		getKiezScoreWeightRows
	} from './kiez-score-content.js';

	const pageTitle = m.methodik_kiez_score_meta_title();
	const pageDescription = m.methodik_kiez_score_meta_description();

	const sections = getKiezScoreSections();
	const dimensions = getKiezScoreDimensions();
	const weightRows = getKiezScoreWeightRows();
	const omissions = getKiezScoreOmissions();

	const linkClass = 'hover:text-accent-strong text-accent underline underline-offset-2';
	const feedbackHref = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(m.methodik_kiez_score_feedback_mail_subject())}`;

	const pipelineSegments = richSegments((t) =>
		m.methodik_kiez_score_bezirk_score_pipeline({
			code_start: t('code').start,
			code_end: t('code').end
		})
	);
	const sourcesSegments = richSegments((t) =>
		m.methodik_kiez_score_sources_p1({ link_start: t('link').start, link_end: t('link').end })
	);

	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin: page.url.origin,
			items: [
				{ name: 'Berlin', path: '/' },
				{ name: m.methodik_kiez_score_breadcrumb_methodik(), path: localizedHref('/methodik') },
				{
					name: m.methodik_kiez_score_breadcrumb_kiez_score(),
					path: localizedHref('/methodik/kiez-score')
				}
			]
		})
	);

	const speakableJsonLd = $derived(
		buildSpeakableWebPage({
			origin: page.url.origin,
			urlPath: localizedHref('/methodik/kiez-score'),
			name: m.methodik_kiez_score_speakable_name(),
			inLanguage: localeToBcp47(getLocale()),
			cssSelectors: ['#worum', '#dimensionen', '#gewichte', '#normalisierung', '#fehlt']
		})
	);
</script>

<SeoHead
	title={pageTitle}
	description={pageDescription}
	pathname={page.url.pathname}
	origin={page.url.origin}
	ogImage={`${page.url.origin}/og/page/methodik-kiez-score.png`}
	ogImageAlt={m.methodik_kiez_score_og_image_alt()}
/>
<JsonLd data={breadcrumbJsonLd} testid="methodik-kiez-score-breadcrumb-jsonld" />
<JsonLd data={speakableJsonLd} testid="methodik-kiez-score-speakable-jsonld" />

<article
	data-testid="methodik-kiez-score-page"
	class="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8"
>
	<header class="flex flex-col gap-2">
		<nav
			aria-label={m.methodik_kiez_score_breadcrumb_aria_label()}
			data-testid="methodik-kiez-score-breadcrumb"
			class="font-mono text-xs text-ink-muted"
		>
			<a href={localizedHref('/methodik')} class={linkClass}
				>{m.methodik_kiez_score_breadcrumb_methodik()}</a
			>
			<span aria-hidden="true">·</span>
			<span>{m.methodik_kiez_score_breadcrumb_kiez_score()}</span>
		</nav>
		<h1 data-testid="methodik-kiez-score-h1" class="font-serif text-3xl text-ink">
			{m.methodik_kiez_score_h1_title()}
		</h1>
		<p class="font-serif text-lg leading-relaxed text-ink-muted">
			{m.methodik_kiez_score_lead()}
		</p>
	</header>

	<nav aria-label={m.methodik_kiez_score_toc_aria_label()} class="border border-rule bg-bg p-4">
		<p class="mb-2 font-mono text-xs tracking-wide text-ink-subtle uppercase">
			{m.methodik_kiez_score_toc_heading()}
		</p>
		<ol class="grid gap-1.5 font-sans text-sm sm:grid-cols-2">
			{#each sections as sec (sec.id)}
				<li>
					<a href={`#${sec.id}`} class={linkClass}>
						{sec.label}
					</a>
				</li>
			{/each}
		</ol>
	</nav>

	<section id="worum" aria-labelledby="worum-h" class="flex flex-col gap-3">
		<h2 id="worum-h" class="font-serif text-2xl text-ink">
			{m.methodik_kiez_score_section_worum_heading()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_kiez_score_worum_p1()}</p>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_kiez_score_worum_p2()}</p>
	</section>

	<section id="dimensionen" aria-labelledby="dimensionen-h" class="flex flex-col gap-3">
		<h2 id="dimensionen-h" class="font-serif text-2xl text-ink">
			{m.methodik_kiez_score_section_dimensions_heading()}
		</h2>
		<ul class="flex flex-col gap-4">
			{#each dimensions as dim (dim.id)}
				<li class="border-l-2 border-rule pl-3">
					<p class="font-sans text-base font-semibold text-ink">{dim.label}</p>
					<p class="font-mono text-xs text-ink-muted">{dim.layers}</p>
					<p class="mt-1 font-serif text-sm text-ink">{dim.detail}</p>
				</li>
			{/each}
		</ul>
	</section>

	<section id="gewichte" aria-labelledby="gewichte-h" class="flex flex-col gap-3">
		<h2 id="gewichte-h" class="font-serif text-2xl text-ink">
			{m.methodik_kiez_score_section_weights_heading()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			{m.methodik_kiez_score_weights_p1()}
		</p>
		<table class="border border-rule text-sm">
			<thead class="bg-bg">
				<tr>
					<th class="px-3 py-2 text-left font-mono text-xs text-ink-muted uppercase">
						{m.methodik_kiez_score_weights_th_dimension()}
					</th>
					<th class="px-3 py-2 text-left font-mono text-xs text-ink-muted uppercase">
						{m.methodik_kiez_score_weights_th_weight()}
					</th>
				</tr>
			</thead>
			<tbody>
				{#each weightRows as row (row.id)}
					<tr>
						<td class="px-3 py-2">
							{row.label}{#if row.note}<!-- eslint-disable-next-line svelte/no-useless-mustaches -->{' '}<span
									class="text-ink-subtle">{row.note}</span
								>{/if}
						</td>
						<td class="px-3 py-2 font-mono">{row.weight}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>

	<section id="normalisierung" aria-labelledby="normalisierung-h" class="flex flex-col gap-3">
		<h2 id="normalisierung-h" class="font-serif text-2xl text-ink">
			{m.methodik_kiez_score_section_normalisation_heading()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_kiez_score_norm_p1()}</p>
		<dl class="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-sm">
			<dt class="font-mono text-xs text-ink-muted">{m.methodik_kiez_score_norm_ordinal3_term()}</dt>
			<dd class="text-ink">{m.methodik_kiez_score_norm_ordinal3_def()}</dd>
			<dt class="font-mono text-xs text-ink-muted">{m.methodik_kiez_score_norm_ordinal4_term()}</dt>
			<dd class="text-ink">{m.methodik_kiez_score_norm_ordinal4_def()}</dd>
			<dt class="font-mono text-xs text-ink-muted">{m.methodik_kiez_score_norm_pet_term()}</dt>
			<dd class="text-ink">{m.methodik_kiez_score_norm_pet_def()}</dd>
			<dt class="font-mono text-xs text-ink-muted">{m.methodik_kiez_score_norm_distance_term()}</dt>
			<dd class="text-ink">{m.methodik_kiez_score_norm_distance_def()}</dd>
			<dt class="font-mono text-xs text-ink-muted">{m.methodik_kiez_score_norm_presence_term()}</dt>
			<dd class="text-ink">{m.methodik_kiez_score_norm_presence_def()}</dd>
		</dl>
		<p class="font-serif text-base leading-relaxed text-ink">{m.methodik_kiez_score_norm_p2()}</p>
	</section>

	<section id="kiez-score" aria-labelledby="kiez-score-h" class="flex flex-col gap-3">
		<h2 id="kiez-score-h" class="font-serif text-2xl text-ink">
			{m.methodik_kiez_score_section_kiez_score_heading()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			{m.methodik_kiez_score_kiez_score_p1()}
		</p>
		<p class="font-serif text-base leading-relaxed text-ink">
			{m.methodik_kiez_score_kiez_score_p2()}
		</p>
		<p class="font-serif text-base leading-relaxed text-ink">
			{m.methodik_kiez_score_kiez_score_p3()}
		</p>
	</section>

	<section id="bezirks-score" aria-labelledby="bezirks-score-h" class="flex flex-col gap-3">
		<h2 id="bezirks-score-h" class="font-serif text-2xl text-ink">
			{m.methodik_kiez_score_section_bezirk_score_heading()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			{m.methodik_kiez_score_bezirk_score_p1()}
		</p>
		<p class="font-serif text-base leading-relaxed text-ink">
			{m.methodik_kiez_score_bezirk_score_p2()}
		</p>
		<p class="font-serif text-base leading-relaxed text-ink">
			<RichText segments={pipelineSegments}>
				{#snippet tag(text)}
					<code class="font-mono text-sm">{text}</code>
				{/snippet}
			</RichText>
		</p>
	</section>

	<section id="fehlt" aria-labelledby="fehlt-h" class="flex flex-col gap-3">
		<h2 id="fehlt-h" class="font-serif text-2xl text-ink">
			{m.methodik_kiez_score_section_missing_heading()}
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

	<section id="quellen" aria-labelledby="quellen-h" class="flex flex-col gap-3">
		<h2 id="quellen-h" class="font-serif text-2xl text-ink">
			{m.methodik_kiez_score_section_sources_heading()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			<RichText segments={sourcesSegments}>
				{#snippet tag(text)}
					<a href={localizedHref('/lizenzen')} class={linkClass}>{text}</a>
				{/snippet}
			</RichText>
		</p>
	</section>

	<section id="editorial" aria-labelledby="editorial-h" class="flex flex-col gap-3">
		<h2 id="editorial-h" class="font-serif text-2xl text-ink">
			{m.methodik_kiez_score_section_editorial_heading()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			{m.methodik_kiez_score_editorial_p1()}
		</p>
		<p class="font-serif text-base leading-relaxed text-ink">
			{m.methodik_kiez_score_editorial_p2()}
		</p>
	</section>

	<section id="feedback" aria-labelledby="feedback-h" class="flex flex-col gap-3">
		<h2 id="feedback-h" class="font-serif text-2xl text-ink">
			{m.methodik_kiez_score_section_feedback_heading()}
		</h2>
		<p class="font-serif text-base leading-relaxed text-ink">
			{m.methodik_kiez_score_feedback_p1()}
		</p>
		<p class="font-mono text-sm">
			<a href={feedbackHref} class={linkClass}>{FEEDBACK_EMAIL}</a>
		</p>
	</section>

	<footer class="border-t border-rule pt-4">
		<a
			href={localizedHref('/methodik')}
			data-testid="methodik-kiez-score-back-link"
			class="hover:text-accent-strong font-mono text-sm text-accent underline underline-offset-2"
		>
			{m.methodik_kiez_score_back_link()}
		</a>
	</footer>
</article>
