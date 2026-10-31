<!--
	Teaser für die Data Stories (#163): keine Kachel, nur Linien oben und unten.
	Zeigt die neuesten Beiträge im Markup der Übersicht `/stories` (geteilte Komponente),
	mit statischer Miniatur. Ein Link pro Eintrag, der Titel.
-->
<script lang="ts">
	import StoryEntryItem from '$lib/components/stories/story-entry.svelte';
	import type { StoryTeaserData } from '$lib/content/stories/story-teaser.server.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { ctaSecondary } from './internal/cta.js';

	interface Props {
		readonly stories: StoryTeaserData;
	}

	const { stories }: Props = $props();
</script>

{#if stories.entries.length > 0}
	<section
		data-testid="home-stories-teaser"
		class="grid gap-6 border-y border-rule py-8 md:col-span-12 md:grid-cols-12 md:items-start"
	>
		<div class="space-y-3 md:col-span-4">
			<h2 class="text-2xl font-bold text-ink">{m.home_stories_heading()}</h2>
			<p class="max-w-(--measure) text-base text-ink-muted">{m.home_stories_text()}</p>
			<a href={localizedHref('/stories')} class={ctaSecondary}>
				{m.home_stories_link()}
			</a>
		</div>
		<ul
			aria-label={m.home_stories_list_label()}
			class="m-0 flex list-none flex-col gap-4 p-0 md:col-span-8"
		>
			{#each stories.entries as entry (entry.slug)}
				<StoryEntryItem {entry} preview={stories.preview} headingLevel={3} />
			{/each}
		</ul>
	</section>
{/if}
