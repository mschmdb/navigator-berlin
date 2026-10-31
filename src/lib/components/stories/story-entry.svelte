<!--
	Eintrag einer Story-Liste, geteilt von der Übersicht `/stories` und dem Startseiten-Teaser (#163).
	Links die statische Miniatur (dekorativ, ohne Tab-Stopp), rechts Datum, Titel-Link und Summary.
	Der Titel ist der einzige Link-Name, die Miniatur wiederholt ihn nicht.
-->
<script lang="ts">
	import { formatUpdateDate } from '$lib/components/updates/category-label.js';
	import { localizeStory } from '$lib/content/stories/localize-story.js';
	import type { StoryEntry } from '$lib/content/stories/types.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import type { BezirkItem } from '$lib/stories/punkt-linie-kiez/types.js';
	import PunktLinieKiez from './punkt-linie-kiez.svelte';

	interface Props {
		readonly entry: StoryEntry;
		/** Bezirk für die Miniatur. Sie erscheint nur, wenn der Beitrag `preview` setzt. */
		readonly preview: BezirkItem | null;
		/** Überschriftenebene: 2 auf der Übersicht, 3 unter einer Teaser-Überschrift. */
		readonly headingLevel?: 2 | 3;
	}

	const { entry, preview, headingLevel = 2 }: Props = $props();

	const locale = $derived(getLocale());
	const localized = $derived(localizeStory(entry, locale));
	const href = $derived(localizedHref(`/stories/${entry.slug}`));
	const dateLabel = $derived(formatUpdateDate(entry.frontmatter.date, locale));
</script>

<li
	class="flex flex-col gap-4 border-l-2 border-rule bg-bg px-4 py-4 sm:flex-row sm:items-start"
	data-testid="stories-entry"
	data-slug={entry.slug}
>
	{#if entry.frontmatter.preview && preview}
		<a
			{href}
			tabindex="-1"
			aria-hidden="true"
			class="block shrink-0"
			data-testid="stories-entry-preview"
		>
			<PunktLinieKiez
				name={preview.name}
				kennzahlen={preview.kennzahlen}
				thumbnail
				legend={false}
				bare
				size={112}
			/>
		</a>
	{/if}
	<div class="flex min-w-0 flex-col gap-3">
		<time class="font-sans text-sm text-ink-muted" datetime={entry.frontmatter.date}>
			{dateLabel}
		</time>
		<svelte:element
			this={`h${headingLevel}`}
			class="text-2xl font-bold text-ink"
			lang={localized.titleIsDeFallback ? 'de' : undefined}
		>
			<a
				{href}
				class="inline-flex min-h-6 items-center hover:text-accent focus-visible:text-accent"
				data-testid="stories-entry-link"
			>
				{localized.title}
			</a>
		</svelte:element>
		<p
			class="text-base leading-body text-ink-muted"
			lang={localized.summaryIsDeFallback ? 'de' : undefined}
		>
			{localized.summary}
		</p>
	</div>
</li>
