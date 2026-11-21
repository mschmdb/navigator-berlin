<script lang="ts">
	import { localizedHref } from '#lib/i18n/localized-href.js';
	import { m } from '#lib/paraglide/messages.js';
	import { trackLanding, type LandingAction } from '#lib/utils/plausible.js';

	interface Entry {
		readonly slug: string;
		readonly name: string;
		readonly note?: string;
	}
	interface Props {
		groups: readonly {
			title: string;
			hint: string;
			/** Plausible-Ereignis „Landing“ beim Klick auf einen Ort. */
			action: LandingAction;
			entries: readonly Entry[];
		}[];
		/** Route der Seite für den Link. */
		route: '/kiez/[slug]' | '/bezirk/[slug]';
		pageType: 'kiez' | 'bezirk';
		oncompare: (slug: string) => void;
	}
	let { groups, route, pageType, oncompare }: Props = $props();
</script>

<!-- Links tragen den Sprachpräfix selbst (localizedHref). -->
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
								href={localizedHref(route.replace('[slug]', e.slug))}
								data-testid="place-neighbor-link"
								onclick={() => trackLanding(g.action, pageType)}
								class="flex min-h-6 min-w-0 items-center truncate text-sm text-ink underline underline-offset-2 hover:text-accent"
								>{e.name}</a
							>
							<button
								type="button"
								class="min-h-7 shrink-0 rounded-full border border-rule-strong px-3 text-sm text-ink hover:border-accent focus-visible:outline-2 focus-visible:outline-focus"
								onclick={() => oncompare(e.slug)}
								>{m.place_neighbor_compare()}<span class="sr-only">
									{m.place_neighbor_compare_with({ name: e.name })}</span
								></button
							>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	{/each}
</div>
