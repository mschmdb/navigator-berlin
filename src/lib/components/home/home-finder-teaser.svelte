<!--
	Kiez-Finder-Feature-Block auf der Home (Spec 2a): der interaktivste
	Einstieg ins Produkt, direkt nach dem Hero. Beispiel-Wünsche als echter
	Text (crawl- und vorlesbar), CTA öffnet den Finder auf der Karte.
-->
<script lang="ts">
	import { SlidersHorizontal } from '@lucide/svelte';
	import { HOME_SCREENSHOTS } from '$lib/content/screenshot-manifest.js';

	const SCREENSHOT = HOME_SCREENSHOTS.kiezFinder;

	const BEISPIELE = [
		'ruhig und gute Luft',
		'S-Bahn nicht weit',
		'viel Grün, wenig Trubel',
		'gute Versorgung im Kiez'
	];
</script>

<section data-testid="home-finder-teaser" class="grid items-center gap-8 md:grid-cols-[1fr_1.2fr]">
	<div class="space-y-6">
		<header class="space-y-2">
			<p class="font-mono text-xs tracking-wider text-accent uppercase">Neu · Kiez-Finder</p>
			<h2 class="font-serif text-2xl text-ink md:text-3xl">Sag der Karte, was du suchst</h2>
			<p class="max-w-prose font-serif text-base text-ink-muted">
				9 verschiedene Werte, mit denen du dir deinen idealen Bezirk oder Kiez raussuchen kannst.
			</p>
		</header>

		<ul class="flex flex-wrap gap-2" aria-label="Beispiel-Wünsche">
			{#each BEISPIELE as beispiel (beispiel)}
				<li
					data-testid="home-finder-beispiel"
					class="rounded-full border border-rule px-3 py-1 font-serif text-sm text-ink-muted"
				>
					„{beispiel}"
				</li>
			{/each}
		</ul>

		<div class="flex flex-wrap items-center gap-x-6 gap-y-2">
			<a
				href="/explore?finder=1"
				data-testid="home-finder-teaser-cta"
				class="inline-flex items-center gap-2 rounded border border-accent bg-accent px-4 py-2 font-mono text-sm tracking-wider text-bg uppercase hover:border-ink hover:bg-ink"
			>
				<SlidersHorizontal size={16} aria-hidden="true" />
				Kiez-Finder öffnen
			</a>
		</div>

		<p class="max-w-prose font-serif text-xs text-ink-subtle">
			Die Karte bewertet weder Nachbarschaften noch Menschen, sie zeigt nur, wie gut eine Gegend zu
			deinen Reglern passt.
		</p>
	</div>

	<a
		href="/explore?finder=1"
		aria-label="Kiez-Finder öffnen"
		class="group bg-bg-soft block overflow-hidden rounded border border-rule transition-colors hover:border-ink-muted"
	>
		<figure>
			<img
				src={SCREENSHOT.path}
				alt={SCREENSHOT.alt}
				class="block h-full w-full object-cover transition-opacity group-hover:opacity-90"
				loading="lazy"
				width={SCREENSHOT.width}
				height={SCREENSHOT.height}
			/>
			<figcaption class="sr-only">
				Vorschau des Kiez-Finders: Regler-Panel und live gefärbte Passungs-Karte.
			</figcaption>
		</figure>
	</a>
</section>
