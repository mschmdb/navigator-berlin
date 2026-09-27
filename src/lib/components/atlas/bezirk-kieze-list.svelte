<script lang="ts">
	import type { KiezRef } from '$lib/data/get-kieze-in-bezirk.js';
	import { m } from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';

	interface Props {
		readonly kieze: readonly KiezRef[];
		readonly bezirkName: string;
	}

	const { kieze, bezirkName }: Props = $props();

	const hasScores = $derived(kieze.some((k) => typeof k.composite === 'number'));
</script>

{#if kieze.length > 0}
	<section
		data-testid="bezirk-kieze-list"
		aria-labelledby="kieze-im-bezirk-h"
		class="flex flex-col gap-3 border-t border-rule pt-6"
	>
		<header class="flex flex-col gap-1">
			<h2 id="kieze-im-bezirk-h" class="font-serif text-2xl text-ink">
				{m.bezirk_kieze_heading({ bezirk: bezirkName })}
			</h2>
			{#if hasScores}
				<p class="font-mono text-xs tracking-wide text-ink-subtle uppercase">
					{m.bezirk_kieze_top5_label()}
				</p>
			{/if}
		</header>
		<ol class="flex flex-col font-sans text-base">
			{#each kieze as kiez, idx (kiez.slug)}
				<li class="flex items-baseline gap-3 border-b border-rule/40 py-2 last:border-b-0">
					<span class="w-6 shrink-0 font-mono text-xs text-ink-subtle" aria-hidden="true">
						{idx + 1}.
					</span>
					<a
						href={localizedHref(`/kiez/${kiez.slug}`)}
						class="hover:text-accent-strong grow text-accent underline underline-offset-2"
						data-testid="bezirk-kieze-link"
					>
						{kiez.name}
					</a>
					{#if typeof kiez.composite === 'number'}
						<span
							class="shrink-0 font-mono text-sm text-ink-muted tabular-nums"
							aria-label={m.bezirk_kieze_score_aria({ score: kiez.composite })}
						>
							{kiez.composite}
						</span>
					{/if}
				</li>
			{/each}
		</ol>
	</section>
{/if}
