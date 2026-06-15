<script lang="ts">
	import { ChevronDown } from '@lucide/svelte';
	import { untrack, type Snippet } from 'svelte';

	type Props = {
		title: string;
		/** Hero default expanded, thematische Cards collapsed (ADR-014 Abschnitt 4). */
		defaultExpanded?: boolean;
		/** Pflicht: Visual-Summary, immer sichtbar (collapsed + expanded). Kein blindes Collapsible. */
		summary: Snippet;
		/** Schweres Detail, nur expanded im DOM (Lazy-Render, AC #4). */
		detail?: Snippet;
		testId?: string;
	};

	let {
		title,
		defaultExpanded = false,
		summary,
		detail,
		testId = 'inspector-card'
	}: Props = $props();

	// defaultExpanded nur als Initialwert lesen, danach lokal mutierbar (untrack = bewusst kein Re-Sync).
	let expanded = $state(untrack(() => defaultExpanded));
	const regionId = `inspector-card-region-${crypto.randomUUID()}`;

	function toggle(): void {
		expanded = !expanded;
	}
</script>

<section data-testid={testId} data-expanded={expanded} class="border-b border-rule py-3">
	<button
		type="button"
		data-testid="card-toggle"
		aria-expanded={expanded}
		aria-controls={regionId}
		onclick={toggle}
		class="flex w-full items-center justify-between gap-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
	>
		<span data-testid="card-title" class="font-mono text-xs tracking-wide text-ink-muted uppercase">
			{title}
		</span>
		<ChevronDown
			size={16}
			aria-hidden="true"
			class="shrink-0 text-ink-subtle transition-transform {expanded ? 'rotate-180' : ''}"
		/>
	</button>

	<div class="mt-2" data-testid="card-summary">
		{@render summary()}
	</div>

	{#if expanded && detail}
		<div id={regionId} class="mt-3" data-testid="card-detail">
			{@render detail()}
		</div>
	{/if}
</section>
