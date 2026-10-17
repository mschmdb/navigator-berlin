<!--
	Kiez-Finder-Feature-Block auf der Home (Spec 2a): der interaktivste
	Einstieg ins Produkt, direkt nach dem Hero. Beispiel-Wünsche als echter
	Text (crawl- und vorlesbar), CTA öffnet den Finder auf der Karte.
-->
<script lang="ts">
	import { SlidersHorizontal } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { HOME_SCREENSHOTS, homeScreenshotAlt } from '$lib/content/screenshot-manifest.js';

	const SCREENSHOT = HOME_SCREENSHOTS.kiezFinder;

	const BEISPIELE = [
		m.home_finder_beispiel_ruhig,
		m.home_finder_beispiel_sbahn,
		m.home_finder_beispiel_gruen,
		m.home_finder_beispiel_versorgung
	];
</script>

<section data-testid="home-finder-teaser" class="grid items-center gap-8 md:grid-cols-[1fr_1.2fr]">
	<div class="space-y-6">
		<header class="space-y-2">
			<h2 class="text-2xl font-bold text-ink md:text-3xl">{m.home_finder_heading()}</h2>
			<p class="max-w-prose text-base text-ink-muted">
				{m.home_finder_lead()}
			</p>
		</header>

		<ul class="flex flex-wrap gap-2" aria-label={m.home_finder_aria_label()}>
			{#each BEISPIELE as beispiel (beispiel)}
				<li
					data-testid="home-finder-beispiel"
					class="rounded-full border border-rule px-3 py-1 text-sm text-ink-muted"
				>
					„{beispiel()}"
				</li>
			{/each}
		</ul>

		<div class="flex flex-wrap items-center gap-x-6 gap-y-2">
			<a
				href={localizedHref('/explore?finder=1')}
				data-testid="home-finder-teaser-cta"
				class="inline-flex items-center gap-2 rounded border border-accent bg-accent px-4 py-2 text-sm font-medium text-bg hover:border-ink hover:bg-ink"
			>
				<SlidersHorizontal size={16} aria-hidden="true" />
				{m.home_finder_cta()}
			</a>
		</div>

		<p class="max-w-prose text-xs text-ink-subtle">
			{m.home_finder_footnote()}
		</p>
	</div>

	<a
		href={localizedHref('/explore?finder=1')}
		aria-label={m.home_finder_cta()}
		class="group block overflow-hidden rounded border border-rule bg-bg-muted transition-colors hover:border-ink-muted"
	>
		<figure>
			<img
				src={SCREENSHOT.path}
				alt={homeScreenshotAlt('kiezFinder')}
				class="block h-full w-full object-cover transition-opacity group-hover:opacity-90"
				loading="lazy"
				width={SCREENSHOT.width}
				height={SCREENSHOT.height}
			/>
			<figcaption class="sr-only">
				{m.home_finder_figcaption()}
			</figcaption>
		</figure>
	</a>
</section>
