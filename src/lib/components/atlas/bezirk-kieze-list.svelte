<script lang="ts">
	import type { KiezRef } from '$lib/data/get-kieze-in-bezirk.js';

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
				Kieze im Bezirk {bezirkName}
			</h2>
			{#if hasScores}
				<p class="font-mono text-xs uppercase tracking-wide text-ink-subtle">
					Top 5 nach Kiez-Score
				</p>
			{/if}
		</header>
		<ol class="flex flex-col font-sans text-base">
			{#each kieze as kiez, idx (kiez.slug)}
				<li
					class="flex items-baseline gap-3 border-b border-rule/40 py-2 last:border-b-0"
				>
					<span
						class="w-6 shrink-0 font-mono text-xs text-ink-subtle"
						aria-hidden="true"
					>
						{idx + 1}.
					</span>
					<a
						href={`/kiez/${kiez.slug}`}
						class="grow text-accent underline underline-offset-2 hover:text-accent-strong"
						data-testid="bezirk-kieze-link"
					>
						{kiez.name}
					</a>
					{#if typeof kiez.composite === 'number'}
						<span
							class="shrink-0 font-mono text-sm tabular-nums text-ink-muted"
							aria-label={`Kiez-Score ${kiez.composite} von 100`}
						>
							{kiez.composite}
						</span>
					{/if}
				</li>
			{/each}
		</ol>
	</section>
{/if}
