<script lang="ts">
	import { page } from '$app/state';
	import { Snowflake, ArrowRight } from '@lucide/svelte';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import MapEmbed from '$lib/components/atlas/map-embed.svelte';
	import { BERLIN_OUTLINE } from '$lib/data/berlin-outline.js';
	import { buildExplorerDeepLink } from '$lib/utils/url-state.js';

	const origin = $derived(page.url.origin);
	const pathname = $derived(page.url.pathname);

	const explorerLink = buildExplorerDeepLink(['kuehle-orte']);
	const pageTitle = 'Kühle Orte in Berlin - navigator.berlin';
	const pageDescription =
		'Wo du dich in Berlin bei Hitze abkühlen kannst: Kinos, Bibliotheken, Schwimmhallen und mehr, jeweils mit Adresse und Weg dorthin. Ein Angebot auf offenen Daten.';
	const ogImagePath = '/og/page/kuehle-orte.png';
	const ogImageAbsolute = $derived(`${origin}${ogImagePath}`);
</script>

<SeoHead
	title={pageTitle}
	description={pageDescription}
	{pathname}
	{origin}
	ogImage={ogImageAbsolute}
	locales={['de']}
/>

<article
	data-testid="kuehle-orte-landing"
	class="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8"
>
	<header class="flex flex-col gap-3">
		<h1 class="flex items-center gap-2 font-sans text-3xl font-semibold text-ink">
			<Snowflake size={28} aria-hidden="true" class="shrink-0 text-[#0277BD]" />
			Kühle Orte in Berlin
		</h1>
		<p class="font-serif text-lg leading-relaxed text-ink-muted">
			Bei Hitze hilft keine lange Suche, sondern eine schnelle Antwort: Wohin zum Abkühlen? Diese
			Seite zeigt Orte in Berlin, an denen du der Hitze entkommst. Kinos, Bibliotheken,
			Schwimmhallen, Malls und mehr, jeweils mit Adresse und Weg dorthin. Ein Angebot auf offenen
			Daten, kein Ersatz für die Hinweise der Stadt.
		</p>
	</header>

	<section aria-labelledby="karte-h" class="flex flex-col gap-2">
		<h2 id="karte-h" class="sr-only">Kartenvorschau</h2>
		<MapEmbed geometry={BERLIN_OUTLINE} label="Kühle Orte in Berlin" heightClass="h-[50vh]" />
		<p class="font-sans text-sm text-ink-subtle">
			Die Vorschau zeigt Berlin. Die interaktive Karte mit allen kühlen Orten, Live-Status und
			Filtern öffnet sich im Explorer.
		</p>
	</section>

	<section aria-labelledby="cta-h" class="flex flex-col gap-2">
		<h2 id="cta-h" class="sr-only">Zur interaktiven Karte</h2>
		<a
			href={explorerLink}
			data-testid="explorer-cta"
			class="bg-accent hover:bg-accent-strong focus-visible:ring-accent inline-flex min-h-11 w-fit items-center gap-2 rounded px-5 py-3 font-sans text-base font-semibold text-bg-elevated focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
		>
			Karte erkunden
			<ArrowRight size={18} aria-hidden="true" />
		</a>
		<p class="font-sans text-sm text-ink-subtle">
			Öffnet den Atlas mit bereits aktivem Kühle-Orte-Layer.
		</p>
	</section>
</article>
