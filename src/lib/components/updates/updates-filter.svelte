<script lang="ts">
	import { ToggleGroup } from 'bits-ui';
	import {
		UPDATE_CATEGORIES,
		type UpdateCategory
	} from '$lib/content/updates/frontmatter-schema.js';
	import { CATEGORY_LABEL_DE } from './category-label.js';

	type Props = {
		/** Aktive Filter-Categories (bindable). Leerer Array = „Alle". */
		value?: UpdateCategory[];
	};
	let { value = $bindable([]) }: Props = $props();
</script>

<section
	aria-label="Update-Kategorien filtern"
	class="flex flex-col gap-2 border-t border-b border-rule py-3"
	data-testid="updates-filter"
>
	<p class="font-mono text-xs uppercase tracking-wide text-ink-subtle">Kategorien</p>
	<ToggleGroup.Root
		bind:value
		type="multiple"
		class="inline-flex flex-wrap gap-2"
		aria-label="Update-Kategorien filtern"
	>
		{#each UPDATE_CATEGORIES as cat (cat)}
			<ToggleGroup.Item
				value={cat}
				class="inline-flex items-center border border-rule bg-bg-elevated px-3 py-1 font-sans text-sm text-ink hover:border-accent data-[state=on]:border-accent data-[state=on]:bg-accent-soft data-[state=on]:text-accent-strong"
				data-testid="filter-toggle"
				data-category={cat}
			>
				{CATEGORY_LABEL_DE[cat]}
			</ToggleGroup.Item>
		{/each}
	</ToggleGroup.Root>
</section>
