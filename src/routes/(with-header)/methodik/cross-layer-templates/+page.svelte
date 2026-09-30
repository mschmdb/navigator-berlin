<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import CrossLayerStoryBlock from '$lib/components/atlas/cross-layer-story-block.svelte';
	import RichText from '$lib/components/rich-text.svelte';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { richSegments } from '$lib/i18n/rich-text.js';
	import { m } from '$lib/paraglide/messages.js';
	import { baseLocale, getLocale } from '$lib/paraglide/runtime.js';
	import { previewSources, previewTagLabel } from './preview-fixtures.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const origin = $derived(page.url.origin);
	const pathname = $derived(page.url.pathname);
	const locale = getLocale();
	const sources = previewSources(locale);
	// `editorialNote` hat kein EN-Feld und bleibt deutsch (WCAG 3.1.2).
	const editorialNoteLang = locale === baseLocale ? undefined : baseLocale;

	const introSegments = $derived(
		richSegments((t) =>
			m.methodik_clt_intro_p1({
				totalTemplates: data.totalTemplates,
				code_start: t('code').start,
				code_end: t('code').end
			})
		)
	);
	const styleGuideSegments = richSegments((t) =>
		m.methodik_clt_intro_p2({ code_start: t('code').start, code_end: t('code').end })
	);
</script>

<SeoHead
	title={m.methodik_clt_meta_title()}
	description={m.methodik_clt_meta_description()}
	{origin}
	{pathname}
	noindex
/>

<article class="mx-auto max-w-3xl space-y-8 px-4 py-8" data-testid="cross-layer-templates-preview">
	<header class="space-y-3">
		<p class="font-mono text-xs tracking-wide text-ink-muted uppercase">
			<a href={localizedHref('/methodik')} class="underline-offset-2 hover:text-ink hover:underline"
				>{m.methodik_clt_breadcrumb_methodik()}</a
			>
			{m.methodik_clt_breadcrumb_stage()}
		</p>
		<h1 class="font-sans text-2xl font-bold break-words hyphens-auto text-ink sm:text-3xl">
			{m.methodik_clt_h1_title()}
		</h1>
		<p class="font-serif text-base leading-relaxed text-ink-muted">
			<RichText segments={introSegments}>
				{#snippet tag(text)}
					<code class="font-mono text-xs">{text}</code>
				{/snippet}
			</RichText>
		</p>
		<p class="border-l-2 border-rule pl-2 font-serif text-sm text-ink-muted italic">
			<RichText segments={styleGuideSegments}>
				{#snippet tag(text)}
					<code class="font-mono text-xs">{text}</code>
				{/snippet}
			</RichText>
		</p>
	</header>

	{#each data.previews as preview (preview.id + preview.scope)}
		<section
			class="space-y-4 rounded border border-rule p-4"
			data-testid={`preview-${preview.id}-${preview.scope}`}
		>
			<header class="flex flex-wrap items-baseline gap-2 border-b border-rule/40 pb-3">
				<h2 class="font-sans text-lg font-semibold text-ink">{preview.id}</h2>
				<span
					class="rounded-sm border border-rule px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-ink uppercase"
				>
					Scope {preview.scope}
				</span>
				<span class="font-mono text-[10px] tracking-wide text-ink-muted uppercase">
					Fixture: {preview.contextLabel}
				</span>
				{#each preview.tags as tag (tag)}
					<span
						class="bg-bg-muted rounded-sm px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-ink-muted uppercase"
					>
						{previewTagLabel(tag, locale)}
					</span>
				{/each}
			</header>

			<CrossLayerStoryBlock
				rendered={preview.rendered}
				{sources}
				methodikHref={localizedHref('/methodik')}
				testid={`block-${preview.id}-${preview.scope}`}
			/>

			{#if preview.rendered.missingVars.length > 0}
				<p
					class="border-warning border-l-2 pl-2 font-mono text-xs text-ink"
					data-testid={`missing-${preview.id}`}
				>
					{m.methodik_clt_render_skip({ missingVars: preview.rendered.missingVars.join(', ') })}
				</p>
			{/if}

			{#if preview.editorialNote}
				<details class="font-serif text-sm text-ink-muted">
					<summary class="cursor-pointer font-sans font-medium text-ink">
						{m.methodik_clt_editorial_note_summary()}
					</summary>
					<p class="pt-2 leading-relaxed" lang={editorialNoteLang}>{preview.editorialNote}</p>
				</details>
			{/if}

			<details class="font-mono text-xs text-ink-muted">
				<summary class="cursor-pointer font-sans font-medium text-ink">
					{m.methodik_clt_schema_details_summary()}
				</summary>
				<dl class="space-y-1 pt-2">
					<dt class="text-[10px] tracking-wide text-ink-muted uppercase">Requires</dt>
					<dd>
						<ul class="space-y-0.5">
							{#each preview.requires as r (r)}
								<li>{r}</li>
							{/each}
						</ul>
					</dd>
					<dt class="pt-2 text-[10px] tracking-wide text-ink-muted uppercase">
						{m.methodik_clt_render_context_term()}
					</dt>
					<dd>
						<pre
							class="bg-bg-muted overflow-x-auto rounded border border-rule p-2 text-[10px]">{preview.contextJson}</pre>
					</dd>
				</dl>
			</details>
		</section>
	{/each}

	<footer class="space-y-2 border-t border-rule pt-4">
		<p class="font-mono text-xs text-ink-muted">
			{m.methodik_clt_style_guide_label()}
			<a
				href="https://github.com/navigatorberlin/navigator.berlin/blob/main/docs/cross-layer-templates-style-guide.md"
				class="hover:text-accent-strong text-accent underline underline-offset-2"
			>
				docs/cross-layer-templates-style-guide.md
			</a>
		</p>
	</footer>
</article>
