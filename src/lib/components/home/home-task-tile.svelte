<!--
	Kachel einer Startseiten-Aufgabe (#171). Text steht im DOM vor dem Bild. Ab `md`
	steht das Bild rechts (breite Kachel) oder unter dem Text (halbe Kachel), mobil
	immer darunter. Der erste Link ist die Primäraktion, die übrigen sind sekundär.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HomePreview } from '$lib/content/home-previews.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { trackLanding } from '$lib/utils/plausible.js';
	import HomePreviewLink from './home-preview-link.svelte';
	import { ctaPrimary, ctaSecondary } from './internal/cta.js';

	interface TaskLink {
		readonly href: string;
		readonly label: string;
	}

	interface Props {
		readonly id: string;
		readonly title: string;
		readonly text: string;
		readonly links: readonly TaskLink[];
		readonly preview?: { readonly data: HomePreview; readonly alt: string };
		/** `wide`: volle Breite, Text 4/12 und Bild 8/12. `half`: halbe Breite, Bild unter dem Text. */
		readonly layout: 'wide' | 'half';
		/** Rechte Spalte der breiten Kachel, wenn sie kein Bild hat. */
		readonly aside?: Snippet;
	}

	const { id, title, text, links, preview, layout, aside }: Props = $props();

	const wide = $derived(layout === 'wide');
	const hasRight = $derived(wide && (preview !== undefined || aside !== undefined));
</script>

<section
	data-testid={`home-task-${id}`}
	class="grid overflow-hidden rounded border border-rule bg-bg-elevated {wide
		? 'md:col-span-12 md:grid-cols-12'
		: 'md:col-span-6 md:grid-rows-[auto_1fr]'}"
>
	<div
		class="space-y-3 p-6 {hasRight
			? aside
				? 'md:col-span-5'
				: 'md:col-span-4'
			: wide
				? 'md:col-span-12'
				: ''}"
	>
		<h2 class="text-2xl font-bold text-ink">{title}</h2>
		<p class="max-w-(--measure) text-base text-ink-muted">{text}</p>
		<ul data-testid="home-task-links" class="flex flex-wrap gap-3">
			{#each links as link, i (link.href)}
				<li>
					<a
						href={localizedHref(link.href)}
						onclick={() => trackLanding('task_link', 'home')}
						class={i === 0 ? ctaPrimary : ctaSecondary}
					>
						{link.label}
					</a>
				</li>
			{/each}
		</ul>
	</div>
	{#if preview}
		<div class={wide ? 'md:col-span-8' : 'self-end'}>
			<HomePreviewLink
				preview={preview.data}
				alt={preview.alt}
				decorative
				frame="none"
				class="block"
			/>
		</div>
	{:else if aside}
		<div class="p-6 pt-0 md:col-span-7 md:pt-6">
			{@render aside()}
		</div>
	{/if}
</section>
