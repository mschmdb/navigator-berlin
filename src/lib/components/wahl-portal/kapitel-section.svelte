<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		id: string;
		title: string;
		testid: string;
		/** Story 12: 1-2 kurze Sätze direkt unter der Überschrift -- was zeigt
		 * das Kapitel, wie liest man es. Statischer String, kein Snippet (im
		 * Unterschied zu `takeaway`, das eine Kennzahl/einen Kurzbefund
		 * ausweist). */
		subtext?: string;
		takeaway?: Snippet;
		children?: Snippet;
		/** Review-Fund: die 5.5rem-Zusatzmarge gilt nur auf der Portal-Hauptseite
		 * (ReihenLeiste 2.5rem + Kapitel-Nav sitzen dort sticky über den
		 * Abschnitten). Seiten ohne dieses Sticky-Chrome -- z.B. die
		 * Wahl-Detailseite, die `KapitelSection` nur für den Portal-Look
		 * wiederverwendet -- geben `false`, sonst springen Anker-Ziele zu weit
		 * unter den Site-Header. */
		withPortalChrome?: boolean;
	};

	let {
		id,
		title,
		testid,
		subtext,
		takeaway,
		children,
		withPortalChrome = true
	}: Props = $props();
</script>

<!-- Story 10: Puffer wuchs von 3rem auf 5.5rem -- über der Kapitel-Nav sitzt
     jetzt zusätzlich die sticky Reihen-Leiste (2.5rem), Anker-Sprünge dürfen
     also nicht mehr unter der alten (niedrigeren) Sticky-Zone landen. -->
<section
	{id}
	aria-labelledby={`${id}-h`}
	data-testid={testid}
	class={`flex flex-col gap-4 border-t border-rule py-10 ${
		withPortalChrome
			? 'scroll-mt-[calc(var(--header-height,72px)+5.5rem)]'
			: 'scroll-mt-[var(--header-height,72px)]'
	}`}
>
	<h2 id={`${id}-h`} class="font-serif text-2xl text-ink">{title}</h2>
	{#if subtext}
		<p data-testid={`${testid}-subtext`} class="max-w-prose font-serif text-base text-ink-muted">
			{subtext}
		</p>
	{/if}
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
