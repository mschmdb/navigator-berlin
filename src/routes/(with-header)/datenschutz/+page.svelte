<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import { FEEDBACK_EMAIL } from '$lib/utils/contact.js';
</script>

<SeoHead
	title="Datenschutz · navigator.berlin"
	description="Datenschutzerklärung für navigator.berlin. Kein Tracking, keine Cookies, keine personenbezogenen Daten."
	pathname={page.url.pathname}
	origin={page.url.origin}
/>

<main class="mx-auto max-w-2xl px-4 py-12">
	<h1 class="font-serif text-3xl">Datenschutzerklärung</h1>

	<p class="text-fg-muted mt-4 text-sm">Stand: 2026-05-17</p>

	<section class="mt-8">
		<h2 class="font-serif text-xl">1. Verantwortlich</h2>
		<address class="not-italic mt-3 leading-relaxed">
			Matze Schmidbauer<br />
			Arndtstraße 34<br />
			10965 Berlin<br />
			Deutschland<br />
			E-Mail: <a class="text-accent underline" href={`mailto:${FEEDBACK_EMAIL}`}>{FEEDBACK_EMAIL}</a>
		</address>
	</section>

	<section class="mt-8">
		<h2 class="font-serif text-xl">2. Datenerhebung im Überblick</h2>
		<p class="mt-3 leading-relaxed">
			Diese Website erhebt keine personenbezogenen Daten, es sei denn, Sie stellen diese
			freiwillig zur Verfügung (z.&nbsp;B. wenn Sie per E-Mail Kontakt aufnehmen). Es gibt
			keine Registrierung, keine Benutzerkonten, keine Zahlungs- oder Bestellabwicklung.
		</p>
	</section>

	<section class="mt-8">
		<h2 class="font-serif text-xl">3. Cookies und Tracking</h2>
		<p class="mt-3 leading-relaxed">
			Diese Website setzt <strong>keine Tracking-Cookies</strong> und <strong>keine
			Werbe-Cookies</strong>. Es werden keine personenbezogenen Daten an Dritte weitergegeben.
		</p>
		<p class="mt-3 leading-relaxed">
			Optional kann die Website im Browser-LocalStorage einzelne nicht-personenbezogene
			Präferenzen speichern (z.&nbsp;B. zuletzt geöffnete Adresse, gemerkte Adressen, Stand der
			Layer-Sichtbarkeit). Details siehe <a class="text-accent underline" href="#bookmarks"
				>Abschnitt 5</a
			>.
		</p>
	</section>

	<section class="mt-8">
		<h2 class="font-serif text-xl">4. Server-Logs</h2>
		<p class="mt-3 leading-relaxed">
			Beim Aufruf der Website werden technisch notwendige Verbindungsdaten temporär durch den
			Reverse-Proxy (Traefik) verarbeitet (IP-Adresse, Zeitstempel, abgerufene URL,
			User-Agent). Diese Logs werden nur für Stabilitäts- und Sicherheits-Diagnose im
			Fehlerfall ausgewertet, automatisch nach maximal 30 Tagen überschrieben und nicht mit
			anderen Datenquellen zusammengeführt. Rechtsgrundlage: berechtigtes Interesse am
			sicheren Betrieb (Art. 6 Abs. 1 lit. f DSGVO).
		</p>
		<p class="mt-3 leading-relaxed">
			Hosting in Deutschland (Hetzner Online GmbH, Falkenstein). Es findet keine
			Datenübermittlung außerhalb des EU-Raums statt.
		</p>
	</section>

	<section class="mt-8">
		<h2 id="bookmarks" class="font-serif text-xl">5. Browser-LocalStorage (Bookmarks, Präferenzen)</h2>
		<p class="mt-3 leading-relaxed">
			Wenn Sie die Bookmark-Funktion oder Sicht-Einstellungen nutzen, werden diese ausschließlich
			lokal in Ihrem Browser-LocalStorage gespeichert. Es findet <strong>keine
			Server-Übertragung</strong> statt. Die Daten verbleiben auf Ihrem Gerät, sind nicht für
			Dritte einsehbar und können jederzeit über die Browser-Einstellungen oder durch Klick
			auf „Bookmark entfernen" gelöscht werden.
		</p>
	</section>

	<section class="mt-8">
		<h2 class="font-serif text-xl">6. Karten-Tiles und externe Datenquellen</h2>
		<p class="mt-3 leading-relaxed">
			Die Karten-Darstellung verwendet Vector-Tiles von <a
				class="text-accent underline"
				href="https://openfreemap.org/"
				rel="noopener noreferrer"
				target="_blank">OpenFreeMap</a
			>
			(EU-FOSS, basiert auf OpenStreetMap-Daten). Beim Laden der Karte werden die für die jeweilige
			Region notwendigen Tiles vom OpenFreeMap-Server abgerufen. Die IP-Adresse wird hierbei kurzzeitig
			übermittelt, ist aber für die technische Auslieferung erforderlich und wird laut Betreiber
			nicht für Tracking-Zwecke ausgewertet.
		</p>
		<p class="mt-3 leading-relaxed">
			Geocoding (Adresssuche) erfolgt über
			<a class="text-accent underline" href="https://nominatim.openstreetmap.org/" rel="noopener noreferrer" target="_blank"
				>Nominatim</a
			>
			(OpenStreetMap-Foundation, EU). Anfragen werden ausschließlich für die unmittelbare Adresssuche
			verwendet.
		</p>
	</section>

	<section class="mt-8">
		<h2 class="font-serif text-xl">7. Kontaktaufnahme per E-Mail</h2>
		<p class="mt-3 leading-relaxed">
			Wenn Sie per E-Mail Kontakt aufnehmen, werden Ihre Angaben (Absender-Adresse, Inhalt) zur
			Bearbeitung Ihrer Anfrage gespeichert. Diese Daten werden nicht ohne Ihre Einwilligung
			weitergegeben. Rechtsgrundlage: berechtigtes Interesse an der Beantwortung Ihrer Anfrage
			(Art. 6 Abs. 1 lit. f DSGVO) bzw. Vertragsanbahnung (Art. 6 Abs. 1 lit. b DSGVO).
		</p>
	</section>

	<section class="mt-8">
		<h2 class="font-serif text-xl">8. Ihre Rechte</h2>
		<p class="mt-3 leading-relaxed">
			Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der
			Verarbeitung der Sie betreffenden personenbezogenen Daten sowie ein
			Beschwerderecht bei der zuständigen Aufsichtsbehörde. Anfragen bitte an
			<a class="text-accent underline" href={`mailto:${FEEDBACK_EMAIL}`}>{FEEDBACK_EMAIL}</a>.
		</p>
	</section>

	<section class="mt-8">
		<h2 class="font-serif text-xl">9. Änderungen dieser Erklärung</h2>
		<p class="mt-3 leading-relaxed">
			Diese Erklärung kann angepasst werden, falls sich technische oder rechtliche
			Rahmenbedingungen ändern. Der jeweils aktuelle Stand ist oben rechts ausgewiesen.
		</p>
	</section>
</main>
