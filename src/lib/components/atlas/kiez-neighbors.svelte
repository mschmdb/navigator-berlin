<script lang="ts">
	import type { NeighborEntry } from '$lib/data/kiez-neighbors.js';
	import { m } from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { trackLanding, type LandingAction } from '$lib/utils/plausible.js';

	interface Props {
		readonly neighbors: readonly NeighborEntry[];
		readonly similar: readonly NeighborEntry[];
	}

	const { neighbors, similar }: Props = $props();

	// Die Testids `kiez-siblings-list`/`kiez-sibling-link` stammen von der entfernten
	// Geschwister-Liste und bleiben auf der Nachbar-Liste, damit bestehende E2E-Tests
	// und Verweise gelten (Spec L6). Die Ähnlich-Liste nutzt eigene Testids.

	function linkLabel(entry: NeighborEntry): string {
		return entry.composite === null
			? m.kiez_neighbors_link_label_no_score({ name: entry.name, bezirk: entry.bezirkName })
			: m.kiez_neighbors_link_label({
					name: entry.name,
					bezirk: entry.bezirkName,
					score: entry.composite
				});
	}
</script>

{#snippet list(
	entries: readonly NeighborEntry[],
	testid: string,
	linkTestid: string,
	action: LandingAction,
	headingId: string,
	title: string
)}
	<section
		data-testid={testid}
		aria-labelledby={headingId}
		class="flex flex-col gap-3 border-t border-rule pt-6"
	>
		<h2 id={headingId} class="font-serif text-2xl text-ink">{title}</h2>
		<ul class="flex flex-col gap-2 font-sans text-base">
			{#each entries as entry (entry.slug)}
				<li class="flex flex-wrap items-baseline justify-between gap-x-4">
					<a
						href={localizedHref(`/kiez/${entry.slug}`)}
						class="hover:text-accent-strong text-accent underline underline-offset-2"
						onclick={() => trackLanding(action, 'kiez')}
						data-testid={linkTestid}
						aria-label={linkLabel(entry)}
					>
						{entry.name}
					</a>
					<span class="text-sm text-ink-muted" aria-hidden="true">
						{entry.bezirkName}{#if entry.composite !== null}
							· {m.kiez_neighbors_score({ score: entry.composite })}{/if}
					</span>
				</li>
			{/each}
		</ul>
	</section>
{/snippet}

{#if neighbors.length > 0 || similar.length > 0}
	<div class="flex flex-col gap-8">
		{#if neighbors.length > 0}
			{@render list(
				neighbors,
				'kiez-siblings-list',
				'kiez-sibling-link',
				'neighbor',
				'kiez-neighbors-adjacent-h',
				m.kiez_neighbors_adjacent_heading()
			)}
		{/if}
		{#if similar.length > 0}
			{@render list(
				similar,
				'kiez-similar-list',
				'kiez-similar-link',
				'similar',
				'kiez-neighbors-similar-h',
				m.kiez_neighbors_similar_heading()
			)}
		{/if}
	</div>
{/if}
