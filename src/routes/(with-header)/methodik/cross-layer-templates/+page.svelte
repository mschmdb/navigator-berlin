<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import CrossLayerStoryBlock from '$lib/components/atlas/cross-layer-story-block.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const origin = $derived(page.url.origin);
	const pathname = $derived(page.url.pathname);
</script>

<SeoHead
	title="Cross-Layer-Templates · Co-Design-Preview · navigator.berlin"
	description="Render-Vorschau der Cross-Layer-Story-Templates (Story 6.7). Co-Design-Review-Stage."
	{origin}
	{pathname}
	noindex
	locales={['de']}
/>

<article class="mx-auto max-w-3xl space-y-8 px-4 py-8" data-testid="cross-layer-templates-preview">
	<header class="space-y-3">
		<p class="font-mono text-xs tracking-wide text-ink-muted uppercase">
			<a href="/methodik" class="underline-offset-2 hover:text-ink hover:underline">Methodik</a>
			· Co-Design-Stage
		</p>
		<h1
			class="font-sans text-2xl font-bold break-words hyphens-auto text-ink sm:text-3xl"
			lang="de"
		>
			Cross-Layer-Templates · Preview
		</h1>
		<p class="font-serif text-base leading-relaxed text-ink-muted">
			Render-Vorschau der {data.totalTemplates} Templates aus Story 6.7. Daten sind Fixtures, kein Live-Wiring
			auf Produktiv-Pages. Feature-Flag
			<code class="font-mono text-xs">crossLayerStoryBlock</code> bleibt OFF bis Co-Design-Sign-off.
		</p>
		<p class="border-l-2 border-rule pl-2 font-serif text-sm text-ink-muted italic">
			Vor Roll-out auf 143 Kieze: Style-Guide in <code class="font-mono text-xs"
				>docs/cross-layer-templates-style-guide.md</code
			>
			abarbeiten und <code class="font-mono text-xs">pnpm lint:cross-layer-templates</code>
			grün halten.
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
						{tag}
					</span>
				{/each}
			</header>

			<CrossLayerStoryBlock
				rendered={preview.rendered}
				sources={[
					{ label: 'Wahlbezirksstatistik', license: 'dl-de/by-2-0' },
					{ label: 'Mietspiegel Wohnlagen 2024', license: 'dl-de/by-2-0' },
					{ label: 'Lärmkartierung 2023', license: 'dl-de/by-2-0' }
				]}
				methodikHref="/methodik"
				testid={`block-${preview.id}-${preview.scope}`}
			/>

			{#if preview.rendered.missingVars.length > 0}
				<p
					class="border-warning border-l-2 pl-2 font-mono text-xs text-ink"
					data-testid={`missing-${preview.id}`}
				>
					Render-Skip wegen fehlender Variablen: {preview.rendered.missingVars.join(', ')}
				</p>
			{/if}

			{#if preview.editorialNote}
				<details class="font-serif text-sm text-ink-muted">
					<summary class="cursor-pointer font-sans font-medium text-ink"> Editorial-Note </summary>
					<p class="pt-2 leading-relaxed">{preview.editorialNote}</p>
				</details>
			{/if}

			<details class="font-mono text-xs text-ink-muted">
				<summary class="cursor-pointer font-sans font-medium text-ink"> Schema-Details </summary>
				<dl class="space-y-1 pt-2">
					<dt class="text-[10px] tracking-wide text-ink-muted uppercase">Requires</dt>
					<dd>
						<ul class="space-y-0.5">
							{#each preview.requires as r (r)}
								<li>{r}</li>
							{/each}
						</ul>
					</dd>
					<dt class="pt-2 text-[10px] tracking-wide text-ink-muted uppercase">Render-Context</dt>
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
			Style-Guide:
			<a
				href="https://github.com/navigatorberlin/navigator.berlin/blob/main/docs/cross-layer-templates-style-guide.md"
				class="hover:text-accent-strong text-accent underline underline-offset-2"
			>
				docs/cross-layer-templates-style-guide.md
			</a>
		</p>
	</footer>
</article>
