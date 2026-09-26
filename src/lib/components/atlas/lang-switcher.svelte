<!--
	Sprachumschalter (i18n Block A).

	Führt auf dieselbe Seite in der jeweils anderen Sprache, per vollem
	Reload (`data-sveltekit-reload`, kein Client-Side-Rerender mit stale
	Paraglide-Messages/Locale-Context). Barrierefrei: Linktext steht in der
	Zielsprache selbst (`Intl.DisplayNames`, sprachneutral erweiterbar auf
	weitere Locales), jedes Item trägt `lang`, die aktuell aktive Sprache ist
	kein Link sondern ein `aria-current="true"`-Element mit sr-only-Zusatz
	("Aktuelle Sprache"/"Current language" als Paraglide-Message).

	Konsumenten: `+layout.svelte` (Footer, `landmark={false}`),
	`(with-header)/+layout.svelte` (Header-Slot + Mobile-Drawer, via das
	bereits existierende `langSwitcher`-Snippet-Prop von
	`site-header.svelte`/`meta-footer.svelte`). Header und Drawer sind über
	CSS (`display:none`) je nach Viewport gegenseitig ausgeschlossen, dürfen
	also beide ein `<nav>`-Landmark sein -- die Footer-Instanz ist aber IMMER
	zusätzlich sichtbar, würde also ein zweites, gleichnamiges "Sprache"/
	"Language"-Landmark erzeugen. `landmark={false}` rendert dort ein `<div>`
	ohne Landmark-Semantik statt `<nav>` (WCAG code review, 2026-09-26).

	`currentPath` kommt als Prop vom Layout (das `page.url` bereits kennt),
	statt selbst `$app/state` zu importieren -- hält die Komponente pure-prop-
	testbar wie die übrigen `atlas/`-Komponenten.
-->
<script lang="ts">
	import { locales, getLocale, type Locale } from '$lib/paraglide/runtime';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';

	interface Props {
		/** Aktueller Pfad, z. B. `page.url.pathname`. */
		currentPath: string;
		/**
		 * Ob diese Instanz ein eigenes `<nav>`-Landmark ist. Default `true`.
		 * Auf `false` setzen, wenn im selben sichtbaren View bereits eine
		 * andere Instanz das Landmark stellt (siehe Datei-Kommentar).
		 */
		landmark?: boolean;
	}

	const { currentPath, landmark = true }: Props = $props();

	function displayName(locale: Locale): string {
		try {
			return new Intl.DisplayNames([locale], { type: 'language' }).of(locale) ?? locale;
		} catch {
			return locale;
		}
	}

	const currentLocale = $derived(getLocale());
</script>

{#snippet items()}
	{#each locales as locale (locale)}
		{#if locale === currentLocale}
			<span aria-current="true" lang={locale} data-testid="lang-switcher-current">
				{displayName(locale)}
				<span class="sr-only">({m.lang_switcher_current()})</span>
			</span>
		{:else}
			<a
				href={localizedHref(currentPath, locale)}
				data-sveltekit-reload
				lang={locale}
				data-testid="lang-switcher-link"
				data-locale={locale}
				class="underline underline-offset-2 hover:text-accent"
			>
				{displayName(locale)}
			</a>
		{/if}
	{/each}
{/snippet}

{#if landmark}
	<nav
		aria-label={m.lang_switcher_label()}
		data-testid="lang-switcher"
		class="flex items-center gap-3"
	>
		{@render items()}
	</nav>
{:else}
	<div data-testid="lang-switcher" class="flex items-center gap-3">
		{@render items()}
	</div>
{/if}
