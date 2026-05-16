<!--
	Story 2.11 T3: Featured-Bezirke-Grid auf der Landing.

	4 editorial-fixed Bezirks-Slugs als Schnell-Einstieg. Story 2.12 ersetzt
	hardcoded Liste durch `src/lib/content/home-featured-bezirke.ts` mit
	Rationale-Kommentar pro Slug; bis dahin Default-Auswahl Mitte / FHK /
	Pankow / Neukölln.
-->
<script lang="ts">
	interface Featured {
		readonly slug: string;
		readonly displayName: string;
	}

	const FEATURED: readonly Featured[] = [
		{ slug: 'mitte', displayName: 'Mitte' },
		{ slug: 'friedrichshain-kreuzberg', displayName: 'Friedrichshain-Kreuzberg' },
		{ slug: 'pankow', displayName: 'Pankow' },
		{ slug: 'neukoelln', displayName: 'Neukölln' }
	];
</script>

<section data-testid="home-featured-bezirke" class="space-y-6">
	<header class="space-y-2">
		<h2 class="font-serif text-2xl text-ink">Bezirke im Detail</h2>
		<p class="font-serif text-base text-ink-muted">
			Pro Bezirk: Steckbrief, Kiez-Score, FAQ. 12 prerenderte Pages, alle 12 sind verfügbar.
		</p>
	</header>
	<ul class="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
		{#each FEATURED as b (b.slug)}
			<li>
				<a
					href={`/bezirk/${b.slug}`}
					class="block rounded border border-rule px-4 py-3 font-serif text-lg text-ink hover:border-accent hover:text-accent"
				>
					{b.displayName}
				</a>
			</li>
		{/each}
	</ul>
</section>
