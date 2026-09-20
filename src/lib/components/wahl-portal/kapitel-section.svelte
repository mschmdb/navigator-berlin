<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		id: string;
		title: string;
		testid: string;
		takeaway?: Snippet;
		children?: Snippet;
	};

	let { id, title, testid, takeaway, children }: Props = $props();
</script>

<!-- Story 10: Puffer wuchs von 3rem auf 5.5rem -- über der Kapitel-Nav sitzt
     jetzt zusätzlich die sticky Reihen-Leiste (2.5rem), Anker-Sprünge dürfen
     also nicht mehr unter der alten (niedrigeren) Sticky-Zone landen. -->
<section
	{id}
	aria-labelledby={`${id}-h`}
	data-testid={testid}
	class="flex scroll-mt-[calc(var(--header-height,72px)+5.5rem)] flex-col gap-4 border-t border-rule py-10"
>
	<h2 id={`${id}-h`} class="font-serif text-2xl text-ink">{title}</h2>
	{#if takeaway}
		<p
			data-testid={`${testid}-takeaway`}
			class="max-w-prose font-serif text-lg leading-relaxed text-ink"
		>
			{@render takeaway()}
		</p>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</section>
