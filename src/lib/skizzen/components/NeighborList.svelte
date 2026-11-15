<script lang="ts">
	import { getLocale } from '$lib/paraglide/runtime';
	import { localHref } from '../locale';
	import { m } from '$lib/paraglide/messages.js';

	interface Entry {
		readonly slug: string;
		readonly name: string;
		readonly note?: string;
	}
	interface Props {
		groups: readonly { title: string; hint: string; entries: readonly Entry[] }[];
		/** Route der Skizze für den Link. */
		route: '/demo/kiez-skizze/[slug]' | '/demo/bezirk-skizze/[slug]';
		oncompare: (slug: string) => void;
	}
	let { groups, route, oncompare }: Props = $props();
</script>

<!-- Links tragen den Sprachpräfix selbst (localHref), resolve() kennt ihn nicht. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<div class="grid gap-8 sm:grid-cols-2">
	{#each groups as g (g.title)}
		{#if g.entries.length > 0}
			<div>
				<h3 class="text-base font-semibold text-ink">{g.title}</h3>
				<p class="text-sm text-ink-subtle">{g.hint}</p>
				<ul class="mt-2 flex flex-col">
					{#each g.entries as e (e.slug)}
						<li
							class="flex items-center justify-between gap-3 border-b border-rule py-1.5 last:border-b-0"
						>
							<a
								href={localHref(route.replace('[slug]', e.slug), { locale: getLocale() })}
								class="flex min-h-6 min-w-0 items-center truncate text-sm text-ink underline underline-offset-2 hover:text-accent"
								>{e.name}</a
							>
							<button
								type="button"
								class="min-h-7 shrink-0 rounded-full border border-rule-strong px-3 text-sm text-ink hover:border-accent focus-visible:outline-2 focus-visible:outline-focus"
								onclick={() => oncompare(e.slug)}
								>{m.skizze_neighbor_compare()}<span class="sr-only">
									{m.skizze_neighbor_compare_with({ name: e.name })}</span
								></button
							>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	{/each}
</div>
