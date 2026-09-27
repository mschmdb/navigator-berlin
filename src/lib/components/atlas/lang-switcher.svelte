<!--
	Sprachumschalter (i18n Block A, Dropdown-Variante: spec-lang-switcher-dropdown.md).

	Führt auf dieselbe Seite in der jeweils anderen Sprache, per vollem
	Reload (`data-sveltekit-reload`, kein Client-Side-Rerender mit stale
	Paraglide-Messages/Locale-Context). Barrierefrei: Linktext steht in der
	Zielsprache selbst (`Intl.DisplayNames`, sprachneutral erweiterbar auf
	weitere Locales), jedes Item trägt `lang`, die aktuell aktive Sprache ist
	kein Link sondern ein `aria-current="true"`-Element mit sr-only-Zusatz
	("Aktuelle Sprache"/"Current language" als Paraglide-Message).

	Zwei Varianten (Prop `variant`, Default `list`):
	- `list`: die ursprüngliche Linkliste (Footer, Mobile-Drawer).
	- `dropdown`: Knopf mit `Languages`-Icon + Locale-Kürzel ("DE"/"EN"),
	  öffnet ein `ui/dropdown-menu.svelte` (bits-ui DropdownMenu) mit denselben
	  Einträgen. Gilt im Header (Desktop). Rendert erst nach `onMount`
	  (`mounted`-State) -- ohne JS bliebe sonst ein toter Knopf neben dem
	  `<noscript>`-Fallback stehen, der ohne Hydration nichts tut. Ohne JS
	  bleibt dadurch NUR die `<noscript>`-Linkliste sichtbar.

	Konsumenten: `+layout.svelte` (Footer, `landmark={false}`, `list`),
	`(with-header)/+layout.svelte` (Header-Slot `dropdown` + Mobile-Drawer
	`list`, via die `langSwitcher`/`langSwitcherDrawer`-Snippet-Props von
	`site-header.svelte`). Header und Drawer sind über CSS (`display:none`)
	je nach Viewport gegenseitig ausgeschlossen, dürfen also beide ein
	`<nav>`-Landmark sein -- die Footer-Instanz ist aber IMMER zusätzlich
	sichtbar, würde also ein zweites, gleichnamiges "Sprache"/"Language"-
	Landmark erzeugen. `landmark={false}` rendert dort ein `<div>` ohne
	Landmark-Semantik statt `<nav>` (WCAG code review, 2026-09-26).

	`currentPath` kommt als Prop vom Layout (das `page.url` bereits kennt),
	statt selbst `$app/state` zu importieren -- hält die Komponente pure-prop-
	testbar wie die übrigen `atlas/`-Komponenten.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { DropdownMenu as BitsDropdownMenu } from 'bits-ui';
	import { Languages, Check } from '@lucide/svelte';
	import { locales, getLocale, type Locale } from '$lib/paraglide/runtime';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { DropdownMenu } from '$lib/components/ui';

	/** Snippet-Prop-Typ, den bits-ui für `DropdownMenu.Item`/`.Trigger`s `child`
	 *  Render-Prop exportiert -- direkt von bits-ui abgeleitet statt von Hand
	 *  nachgebaut, damit ein Typ-Wechsel dort hier auffällt. */
	type MenuChildSnippetProps = Parameters<NonNullable<BitsDropdownMenu.ItemProps['child']>>[0];

	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});

	interface Props {
		/** Aktueller Pfad, z. B. `page.url.pathname`. */
		currentPath: string;
		/**
		 * Ob diese Instanz ein eigenes `<nav>`-Landmark ist. Default `true`.
		 * Auf `false` setzen, wenn im selben sichtbaren View bereits eine
		 * andere Instanz das Landmark stellt (siehe Datei-Kommentar).
		 */
		landmark?: boolean;
		/** `list` (Default) oder `dropdown` (Header, Desktop). */
		variant?: 'list' | 'dropdown';
	}

	const { currentPath, landmark = true, variant = 'list' }: Props = $props();

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

{#snippet dropdownTrigger()}
	<Languages size={18} aria-hidden="true" />
	<span aria-hidden="true" class="font-mono text-xs">{currentLocale.toUpperCase()}</span>
{/snippet}

{#snippet dropdownItems()}
	{#each locales as locale (locale)}
		{#if locale === currentLocale}
			<!--
				Code-review fix: ein nackter `<div aria-current>` war ein ungültiges
				Kind von `role="menu"` (kein `role="menuitem"`) und für Pfeiltasten
				unerreichbar/unübersprungen. `DropdownMenu.Item disabled` liefert
				`role="menuitem"` + `aria-disabled`/`data-disabled` von bits-ui selbst
				und wird von dessen eigener Pfeiltasten-Navigation automatisch
				übersprungen (siehe `menu.svelte.js`, Kandidaten-Query schließt
				`[data-disabled]` aus) -- genau das WCAG/ARIA-Menu-Verhalten für eine
				nicht-aktivierbare aktuelle Auswahl.
			-->
			<BitsDropdownMenu.Item disabled>
				{#snippet child({ props }: MenuChildSnippetProps)}
					<div
						{...props}
						aria-current="true"
						lang={locale}
						data-testid="lang-switcher-current"
						data-locale={locale}
						class="flex items-center gap-2 px-2 py-1.5 font-sans text-sm text-ink"
					>
						<Check size={14} aria-hidden="true" />
						{displayName(locale)}
						<span class="sr-only">({m.lang_switcher_current()})</span>
					</div>
				{/snippet}
			</BitsDropdownMenu.Item>
		{:else}
			<BitsDropdownMenu.Item>
				{#snippet child({ props }: MenuChildSnippetProps)}
					<a
						{...props}
						href={localizedHref(currentPath, locale)}
						data-sveltekit-reload
						lang={locale}
						hreflang={locale}
						data-testid="lang-switcher-link"
						data-locale={locale}
						class="flex items-center gap-2 px-2 py-1.5 font-sans text-sm text-ink hover:bg-bg hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent data-[highlighted]:bg-bg data-[highlighted]:text-accent"
					>
						{displayName(locale)}
					</a>
				{/snippet}
			</BitsDropdownMenu.Item>
		{/if}
	{/each}
{/snippet}

{#snippet dropdown()}
	{#if mounted}
		<!--
			Code-review fix: das Dropdown selbst braucht JS zum Öffnen (bits-ui).
			Ohne den `mounted`-Gate stünde der Trigger-Knopf schon im SSR-Markup,
			tot und ohne Funktion, direkt neben dem `<noscript>`-Fallback. Erst
			nach `onMount` (garantiert nur mit JS) erscheint der echte Trigger --
			ohne JS bleibt NUR die `<noscript>`-Liste unten sichtbar.
		-->
		<DropdownMenu
			trigger={dropdownTrigger}
			triggerProps={{
				type: 'button',
				'data-testid': 'lang-switcher-trigger',
				// WCAG 2.5.3 (Label in Name): der sichtbare Text ("DE"/"EN") steht
				// am Anfang des zugänglichen Namens, nicht nur der ausgeschriebene
				// Sprachname.
				'aria-label': m.lang_switcher_trigger_label({
					code: currentLocale.toUpperCase(),
					name: displayName(currentLocale)
				}),
				class:
					'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-sm border border-rule px-2 text-ink hover:bg-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
			}}
		>
			{@render dropdownItems()}
		</DropdownMenu>
	{/if}
	<!--
		No-JS-Fallback (I/O-Matrix "Ohne JS"): `<noscript>` liefert dieselbe
		Linkliste wie die `list`-Variante, damit ein Sprachwechsel auch ohne
		Hydration möglich bleibt -- Browser mit aktiviertem JS parsen den Inhalt
		nie als echte Elemente (HTML-Spec, "noscript content model"), er ist
		inert.
	-->
	<noscript>
		<div class="flex items-center gap-3">
			{@render items()}
		</div>
	</noscript>
{/snippet}

{#if variant === 'dropdown'}
	{#if landmark}
		<nav aria-label={m.lang_switcher_label()} data-testid="lang-switcher" class="flex items-center">
			{@render dropdown()}
		</nav>
	{:else}
		<div data-testid="lang-switcher" class="flex items-center">
			{@render dropdown()}
		</div>
	{/if}
{:else if landmark}
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
