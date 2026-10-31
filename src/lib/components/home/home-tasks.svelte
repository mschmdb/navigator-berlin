<!--
	Vier Aufgaben mit je zwei bis drei Direktlinks. Gleiches Zeilenmuster wie
	die übrigen Startseiten-Listen (`line-list`).
-->
<script lang="ts">
	import { featureFlags } from '$lib/data/feature-flags.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { trackLanding } from '$lib/utils/plausible.js';
	import { lineItem, lineList, lineRow } from './internal/line-list.js';

	interface TaskLink {
		readonly href: string;
		readonly label: string;
	}
	interface Task {
		readonly id: string;
		readonly title: string;
		readonly text: string;
		readonly links: readonly TaskLink[];
	}

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
			]
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
		},
		{
			id: 'klima',
			title: m.home_task_klima_title(),
			text: m.home_task_klima_text(),
			links: [
				{ href: '/hitze', label: m.home_task_klima_hitze() },
				{ href: '/kaelte', label: m.home_task_klima_kaelte() },
				{ href: '/daten', label: m.home_task_klima_ebenen() }
			]
		},
		{
			id: 'wahlen',
			title: m.home_task_wahlen_title(),
			text: m.home_task_wahlen_text(),
			links: [
				{ href: '/berlin-wahlen', label: m.home_task_wahlen_alle() },
				{ href: '/berlin-wahlen/2026-agh-zweitstimme', label: m.home_task_wahlen_agh() },
				{ href: '/berlin-wahlen/2025-btw-zweitstimme', label: m.home_task_wahlen_btw() }
			]
		}
	]);
</script>

<div class="space-y-10">
	{#each tasks as task (task.id)}
		<section data-testid={`home-task-${task.id}`} class="space-y-3">
			<h2 class="text-2xl font-bold text-ink">{task.title}</h2>
			<p class="max-w-(--measure) text-base text-ink-muted">{task.text}</p>
			<ul class="{lineList} sm:grid-cols-3">
				{#each task.links as link (link.href)}
					<li class={lineItem}>
						<a
							href={localizedHref(link.href)}
							onclick={() => trackLanding('task_link', 'home')}
							class="{lineRow} justify-center text-base font-medium"
						>
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>
