<!--
	Story 2.11 Featured-Bezirke. 4 editorial-fixed Slugs mit jeweils einer
	kurzen Sub-Line damit die Cards Substanz statt nur Name haben. Story 2.12
	ersetzt Liste durch src/lib/content/home-featured-bezirke.ts inkl.
	Rationale-Kommentar pro Auswahl.
-->
<script lang="ts">
	import { ArrowUpRight } from '@lucide/svelte';
	import { HOME_FEATURED_BEZIRKE } from '$lib/content/home-featured-bezirke.js';
</script>

<section data-testid="home-featured-bezirke" class="space-y-6">
	<header class="space-y-2">
		<h2 class="font-serif text-2xl text-ink md:text-3xl">12 Bezirke</h2>
		<p class="font-serif text-base text-ink-muted">
			Pro Bezirk: Steckbrief, Kiez-Score und Antworten auf die häufigsten Fragen.
			Vier Einstiege hier, alle zwölf über die Suche erreichbar.
		</p>
	</header>
	<ul class="grid gap-4 md:grid-cols-2">
		{#each HOME_FEATURED_BEZIRKE as b (b.slug)}
			<li class="flex">
				<a
					href={`/bezirk/${b.slug}`}
					class="group flex h-full w-full flex-col gap-2 rounded border border-rule p-5 hover:border-accent"
				>
					<span class="flex items-center justify-between gap-2">
						<span class="font-serif text-xl text-ink group-hover:text-accent">{b.displayName}</span>
						<ArrowUpRight
							size={18}
							class="text-ink-subtle group-hover:text-accent"
							aria-hidden="true"
						/>
					</span>
					<span class="font-serif text-sm leading-snug text-ink-muted">{b.teaser}</span>
				</a>
			</li>
		{/each}
	</ul>
	<a
		href="/umwelt-infrastruktur-score?view=bezirke"
		class="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-accent hover:text-ink"
	>
		Alle 12 im Vergleich
		<ArrowUpRight size={14} aria-hidden="true" />
	</a>
</section>
