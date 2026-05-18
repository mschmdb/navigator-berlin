<script lang="ts">
	import type { KiezRef } from '$lib/data/get-kieze-in-bezirk.js';

	interface Props {
		readonly siblings: readonly KiezRef[];
		readonly parentBezirkName: string;
	}

	const { siblings, parentBezirkName }: Props = $props();
</script>

{#if siblings.length > 0}
	<section
		data-testid="kiez-siblings-list"
		aria-labelledby="kiez-geschwister-h"
		class="flex flex-col gap-3 border-t border-rule pt-6"
	>
		<h2 id="kiez-geschwister-h" class="font-serif text-2xl text-ink">
			Andere Kieze in {parentBezirkName}
		</h2>
		<ul class="flex flex-wrap gap-x-4 gap-y-2 font-sans text-base">
			{#each siblings as kiez (kiez.slug)}
				<li>
					<a
						href={`/kiez/${kiez.slug}`}
						class="text-accent underline underline-offset-2 hover:text-accent-strong"
						data-testid="kiez-sibling-link"
					>
						{kiez.name}
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}
