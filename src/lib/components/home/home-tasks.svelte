<!--
	Vier Aufgaben als Kachel-Raster (#171, Mockup R): Gegend breit mit Bild, Hitze und
	Wahlen halb mit Bild, Kieze breit mit Bezirksliste. Mobil einspaltig. Nach der Gegend-Kachel
	steht der Data-Stories-Teaser (#163), wenn die Startseite Beiträge übergibt.
-->
<script lang="ts">
	import { featureFlags } from '$lib/data/feature-flags.js';
	import { HOME_PREVIEWS, type HomePreview } from '$lib/content/home-previews.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { trackLanding } from '$lib/utils/plausible.js';
	import { HOME_BEZIRKE } from '$lib/content/home-bezirke.js';
	import type { StoryTeaserData } from '$lib/content/stories/story-teaser.server.js';
	import HomeStoriesTeaser from './home-stories-teaser.svelte';
	import HomeTaskTile from './home-task-tile.svelte';

	interface TaskLink {
		readonly href: string;
		readonly label: string;
	}
	interface Task {
		readonly id: string;
		readonly title: string;
		readonly text: string;
		readonly links: readonly TaskLink[];
		readonly preview?: { readonly data: HomePreview; readonly alt: string };
	}

	interface Props {
		/** Neueste Beiträge für den Data-Stories-Teaser. Ohne Angabe entfällt der Teaser. */
		readonly stories?: StoryTeaserData;
	}

	const { stories = { entries: [], preview: null } }: Props = $props();

	const tasks: readonly Task[] = $derived([
		{
			id: 'gegend',
			title: m.home_task_gegend_title(),
			text: m.home_task_gegend_text(),
			links: [
				{ href: '/explore', label: m.home_task_gegend_map() },
				...(featureFlags.kiezFinder
					? [{ href: '/explore?finder=1', label: m.home_task_gegend_finder() }]
					: [])
			],
			preview: featureFlags.kiezFinder
				? { data: HOME_PREVIEWS.finder, alt: m.home_preview_finder_alt() }
				: undefined
		},
		{
			id: 'klima',
			title: m.home_task_klima_title(),
			text: m.home_task_klima_text(),
			links: [
				{ href: '/hitze', label: m.home_task_klima_hitze() },
				{ href: '/kaelte', label: m.home_task_klima_kaelte() },
				{ href: '/daten', label: m.home_task_klima_ebenen() }
			],
			preview: { data: HOME_PREVIEWS.hitze, alt: m.home_preview_hitze_alt() }
		},
		{
			id: 'wahlen',
			title: m.home_task_wahlen_title(),
			text: m.home_task_wahlen_text(),
			links: [
				{ href: '/berlin-wahlen', label: m.home_task_wahlen_alle() },
				{ href: '/berlin-wahlen/2026-agh-zweitstimme', label: m.home_task_wahlen_agh() },
				{ href: '/berlin-wahlen/2025-btw-zweitstimme', label: m.home_task_wahlen_btw() }
			],
			preview: { data: HOME_PREVIEWS.wahlen, alt: m.home_preview_wahlen_alt() }
		},
		{
			id: 'kieze',
			title: m.home_task_kieze_title(),
			text: m.home_task_kieze_text(),
			links: [
				{ href: '/kieze', label: m.home_task_kieze_kieze() },
				{ href: '/bezirke', label: m.home_task_kieze_bezirke() },
				{ href: '/kiez-score', label: m.home_task_kieze_ranking() }
			]
		}
	]);
</script>

<div class="grid gap-6 md:grid-cols-12">
	{#each tasks as task (task.id)}
		{#if task.id === 'kieze'}
			<HomeTaskTile {...task} layout="wide">
				{#snippet aside()}
					<ul
						aria-label={m.home_task_kieze_bezirke_list_label()}
						class="grid grid-cols-1 gap-x-4 min-[30rem]:grid-cols-2"
					>
						{#each HOME_BEZIRKE as bezirk (bezirk.slug)}
							<li>
								<a
									href={localizedHref(`/bezirk/${bezirk.slug}`)}
									onclick={() => trackLanding('task_link', 'home')}
									class="inline-flex min-h-(--target-min) items-center text-base text-ink underline underline-offset-4 hover:text-accent"
								>
									{bezirk.name}
								</a>
							</li>
						{/each}
					</ul>
				{/snippet}
			</HomeTaskTile>
		{:else}
			<HomeTaskTile {...task} layout={task.id === 'gegend' ? 'wide' : 'half'} />
		{/if}
		{#if task.id === 'gegend'}
			<HomeStoriesTeaser {stories} />
		{/if}
	{/each}
</div>
