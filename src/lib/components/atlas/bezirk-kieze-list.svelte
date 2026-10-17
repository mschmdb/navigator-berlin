<!--
	L5: Alle Kieze eines Bezirks als sortierbare Tabelle (Name, Kiez-Score, Rang
	in Berlin). Standard: Score absteigend, ohne Score am Ende. Ohne DB (keine
	Scores) startet die Liste nach Name. Sortier-Buttons tragen `aria-sort` am
	Spaltenkopf. Rang über `formatRank` (Anti-Stigma, ADR-015).
-->
<script lang="ts">
	import type { KiezListEntry } from '$lib/data/bezirk-kieze-view.js';
	import { formatRank } from '$lib/data/rank-format.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { announceGlobal } from '$lib/utils/aria-live.js';
	import { trackLanding } from '$lib/utils/plausible.js';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import {
		ariaSortFor,
		initialSortState,
		nextSortState,
		sortKiezEntries,
		type KiezSortKey,
		type KiezSortState
	} from './bezirk-kieze-sort.js';

	interface Props {
		readonly kieze: readonly KiezListEntry[];
		readonly bezirkName: string;
	}

	const { kieze, bezirkName }: Props = $props();

	const localeOpts = $derived({ locale: getLocale() });
	const hasScores = $derived(kieze.some((k) => typeof k.composite === 'number'));

	// Der Startzustand hängt von den Props ab, danach gehört er dem Nutzer.
	let override = $state<KiezSortState | null>(null);
	const sortState = $derived(override ?? initialSortState(hasScores));
	const sorted = $derived(sortKiezEntries(kieze, sortState));

	const hasRanks = $derived(kieze.some((k) => k.rang !== null));

	function sortBy(key: KiezSortKey): void {
		override = nextSortState(sortState, key);
		trackLanding('list_sort', 'bezirk');
		const column =
			key === 'name'
				? m.bezirk_kieze_col_name(undefined, localeOpts)
				: m.bezirk_kieze_col_score(undefined, localeOpts);
		const direction =
			override.direction === 'asc'
				? m.bezirk_kieze_dir_asc(undefined, localeOpts)
				: m.bezirk_kieze_dir_desc(undefined, localeOpts);
		announceGlobal(m.bezirk_kieze_sorted_announce({ column, direction }, localeOpts));
	}
</script>

{#snippet sortButton(key: KiezSortKey, label: string, actionLabel: string)}
	{@const active = sortState.key === key}
	<button
		type="button"
		onclick={() => sortBy(key)}
		class="inline-flex items-center gap-1 font-semibold text-ink hover:text-accent-strong"
		data-testid="bezirk-kieze-sort-{key}"
	>
		{label}
		<span class="sr-only">, {actionLabel}</span>
		{#if active && sortState.direction === 'asc'}
			<ArrowUp class="size-4" aria-hidden="true" />
		{:else if active}
			<ArrowDown class="size-4" aria-hidden="true" />
		{:else}
			<ArrowUpDown class="size-4 text-ink-subtle" aria-hidden="true" />
		{/if}
	</button>
{/snippet}

{#if kieze.length > 0}
	<section
		data-testid="bezirk-kieze-list"
		aria-labelledby="kieze-im-bezirk-h"
		class="flex flex-col gap-3 border-t border-rule pt-6"
	>
		<header class="flex flex-col gap-1">
			<h2 id="kieze-im-bezirk-h" class="font-serif text-2xl text-ink">
				{m.bezirk_kieze_heading({ bezirk: bezirkName }, localeOpts)}
			</h2>
			<p id="kieze-im-bezirk-intro" class="font-sans text-sm text-ink-muted">
				{m.bezirk_kieze_list_intro({ count: kieze.length }, localeOpts)}
			</p>
		</header>
		<table class="w-full font-sans text-base" aria-describedby="kieze-im-bezirk-intro">
			<thead>
				<tr class="border-b border-rule text-left">
					<th scope="col" class="py-2 pr-3" aria-sort={ariaSortFor(sortState, 'name')}>
						{@render sortButton(
							'name',
							m.bezirk_kieze_col_name(undefined, localeOpts),
							m.bezirk_kieze_sort_name(undefined, localeOpts)
						)}
					</th>
					<th scope="col" class="px-3 py-2 text-right" aria-sort={ariaSortFor(sortState, 'score')}>
						{@render sortButton(
							'score',
							m.bezirk_kieze_col_score(undefined, localeOpts),
							m.bezirk_kieze_sort_score(undefined, localeOpts)
						)}
					</th>
					{#if hasRanks}
						<th scope="col" class="py-2 pl-3 text-right font-semibold text-ink">
							{m.bezirk_kieze_col_rang(undefined, localeOpts)}
						</th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#each sorted as kiez (kiez.slug)}
					<tr class="border-b border-rule/40 last:border-b-0">
						<th scope="row" class="py-2 pr-3 text-left font-normal">
							<a
								href={localizedHref(`/kiez/${kiez.slug}`)}
								class="text-accent underline underline-offset-2 hover:text-accent-strong"
								onclick={() => trackLanding('list_link', 'bezirk')}
								data-testid="bezirk-kieze-link"
							>
								{kiez.name}
							</a>
						</th>
						<td class="px-3 py-2 text-right font-mono text-sm text-ink-muted tabular-nums">
							{#if typeof kiez.composite === 'number'}
								<span aria-hidden="true">{kiez.composite}</span>
								<span class="sr-only">
									{m.bezirk_kieze_score_aria({ score: kiez.composite }, localeOpts)}
								</span>
							{:else}
								<span aria-hidden="true">–</span>
								<span class="sr-only">{m.bezirk_kieze_no_score(undefined, localeOpts)}</span>
							{/if}
						</td>
						{#if hasRanks}
							<td class="py-2 pl-3 text-right text-sm text-ink-muted">
								{formatRank(kiez.rang, kiez.quartil, kiez.total, localeOpts)}
							</td>
						{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
{/if}
