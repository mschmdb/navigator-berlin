<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import { FEEDBACK_EMAIL } from '$lib/utils/contact.js';
</script>

<SeoHead
	title="Impressum - Berlin in Daten - navigator.berlin"
	description="Impressum nach § 5 TMG für navigator.berlin."
	pathname={page.url.pathname}
	origin={page.url.origin}
	ogImage={`${page.url.origin}/og/page/impressum.png`}
	ogImageAlt="navigator.berlin Impressum"
/>

<main class="mx-auto max-w-2xl px-4 py-12">
	<h1 class="font-serif text-2xl break-words hyphens-auto sm:text-3xl" lang="de">Impressum</h1>

	<section class="mt-8">
		<h2 class="font-serif text-xl">Angaben gemäß § 5 TMG</h2>
		<address class="not-italic mt-3 leading-relaxed">
			Matze Schmidbauer<br />
			Arndtstraße 34<br />
			10965 Berlin<br />
			Deutschland
		</address>
	</section>

	<section class="mt-8">
		<h2 class="font-serif text-xl">Kontakt</h2>
		<p class="mt-3 leading-relaxed">
			E-Mail: <a class="text-accent underline" href={`mailto:${FEEDBACK_EMAIL}`}>{FEEDBACK_EMAIL}</a>
		</p>
	</section>

	<section class="mt-8">
		<h2 class="font-serif text-xl">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
		<address class="not-italic mt-3 leading-relaxed">
			Matze Schmidbauer<br />
			Arndtstraße 34<br />
			10965 Berlin
		</address>
	</section>

	<section class="mt-8">
		<h2 class="font-serif text-xl">Haftungsausschluss</h2>
		<p class="mt-3 leading-relaxed">
			Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für Richtigkeit,
			Vollständigkeit und Aktualität der Inhalte kann jedoch keine Gewähr übernommen werden.
		</p>
		<p class="mt-3 leading-relaxed">
			Die Daten stammen aus offenen Quellen (ODIS Berlin, FIS-Broker, Statistisches Landesamt
			Berlin-Brandenburg, DWD, OpenStreetMap). Bei Abweichungen zwischen Darstellung hier und
			Original-Datenquelle gilt die jeweilige Original-Quelle. Datenstände sind pro Layer in der
			<a class="text-accent underline" href="/methodik">Methodik-Seite</a> dokumentiert.
		</p>
	</section>

	<section class="mt-8">
		<h2 class="font-serif text-xl">Haftung für Links</h2>
		<p class="mt-3 leading-relaxed">
			Diese Website enthält Verlinkungen auf externe Webseiten Dritter, auf deren Inhalte kein
			Einfluss besteht. Für die Inhalte verlinkter Seiten ist stets der jeweilige Anbieter
			verantwortlich. Verlinkte Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche
			Rechtsverstöße überprüft, rechtswidrige Inhalte waren nicht erkennbar.
		</p>
	</section>

	<section class="mt-8">
		<h2 class="font-serif text-xl">Urheberrecht</h2>
		<p class="mt-3 leading-relaxed">
			Code und redaktionelle Inhalte unterliegen dem deutschen Urheberrecht. Daten-Layer
			unterliegen den auf der <a class="text-accent underline" href="/lizenzen">Lizenzen-Seite</a>
			ausgewiesenen Open-Data-Lizenzen (überwiegend dl-de/zero-2-0, dl-de/by-2-0, ODbL).
		</p>
	</section>
</main>
