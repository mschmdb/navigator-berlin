<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import { buildDataCatalog } from '$lib/seo/jsonld-datacatalog.js';
	import { buildBreadcrumbList } from '$lib/seo/jsonld-breadcrumb.js';
	import { featureFlags } from '$lib/data/feature-flags.js';
	import {
		parsePortalState,
		serializePortalState,
		DEFAULT_REIHE,
		DEFAULT_EBENE,
		REIHE_LABELS,
		EBENE_LABELS,
		type WahlPortalReihe,
		type WahlPortalEbene
	} from '$lib/utils/wahl-portal-url-state.js';
	import {
		createWahlPortalState,
		setReihe,
		setEbene,
		setJahr,
		currentJahr,
		jahreForReihe,
		loadWahlList
	} from '$lib/state/wahl-portal-context.svelte.js';
	import { deriveQuellen } from '$lib/utils/wahl-portal-quellen.js';
	import EditorialDisclaimer from '$lib/components/atlas/editorial-disclaimer.svelte';
	import ReihenLeiste from '$lib/components/wahl-portal/reihen-leiste.svelte';
	import KartenSteuerung from '$lib/components/wahl-portal/karten-steuerung.svelte';
	import KapitelKontextBadge from '$lib/components/wahl-portal/kapitel-kontext-badge.svelte';
	import KapitelNav from '$lib/components/wahl-portal/kapitel-nav.svelte';
	import KapitelSection from '$lib/components/wahl-portal/kapitel-section.svelte';
	import PortalDatenstand from '$lib/components/wahl-portal/portal-datenstand.svelte';
	import PortalQuellen from '$lib/components/wahl-portal/portal-quellen.svelte';
	import WinnerMap from '$lib/components/wahl-portal/winner-map.svelte';
	import WechselKapitel from '$lib/components/wahl-portal/wechsel-kapitel.svelte';
	import TrendsKapitel from '$lib/components/wahl-portal/trends-kapitel.svelte';
	import SankeyWahljahre from '$lib/components/wahl-portal/sankey-wahljahre.svelte';
	import SmallMultiples from '$lib/components/wahl-portal/small-multiples.svelte';

	const origin = $derived(page.url.origin);
	const pathname = $derived(page.url.pathname);

	// `page.url.searchParams` ist auf prerenderten Seiten NUR innerhalb von
	// `$effect`/`onMount` lesbar (SvelteKit-Guard, da Query-Params für eine
	// statische Datei nicht deterministisch sind). Deshalb startet der
	// Context immer mit den URL-unabhängigen Defaults; der Deep-Link-Zustand
	// zieht client-seitig im ersten Pull-Effect nach.
	const portal = createWahlPortalState({ reihe: DEFAULT_REIHE, ebene: DEFAULT_EBENE, jahr: null });

	// URL → State (Deep-Link, Browser-Back/Forward). Die Portal-Lesezugriffe
	// stehen in untrack(): sonst re-triggert jeder Steuerleisten-Klick diesen
	// Effect mit der noch alten URL und revertiert den State, bevor der
	// State→URL-Effect die Änderung persistiert (Zwei-Effect-Feedback-Loop).
	$effect(() => {
		const fromUrl = parsePortalState(page.url.searchParams);
		untrack(() => {
			if (fromUrl.reihe !== portal.reihe) setReihe(portal, fromUrl.reihe);
			if (fromUrl.ebene !== portal.ebene) setEbene(portal, fromUrl.ebene);
			if (fromUrl.jahr !== portal.jahrOverride) portal.jahrOverride = fromUrl.jahr;
		});
	});

	// State → URL (replaceState, keepFocus, noScroll). No-Op-Guard über den
	// kompletten Query-String, damit Kaltstart keinen Query-Müll schreibt.
	$effect(() => {
		const url = new URL(page.url);
		const before = url.search;
		url.searchParams.delete('reihe');
		url.searchParams.delete('jahr');
		url.searchParams.delete('ebene');
		const next = serializePortalState({
			reihe: portal.reihe,
			jahr: portal.jahrOverride,
			ebene: portal.ebene
		});
		for (const [key, value] of next) url.searchParams.set(key, value);
		if (url.search === before) return;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(url, { replaceState: true, keepFocus: true, noScroll: true });
	});

	onMount(() => {
		void loadWahlList(portal);
	});

	// Small Multiples laden 7 Partei-Requests parallel (eine Reihe); erst beim
	// Scrollen in die Nähe des Kapitels mounten (Muster `home-featured-score
	// .svelte`, IntersectionObserver) -- sonst würde jeder Seitenaufruf sofort
	// 7 zusätzliche Requests feuern, unabhängig davon ob das Kapitel je
	// gesehen wird (Live-Fund 20.09.: brach die "genau EIN Request"-AC
	// anderer Kapitel, die denselben Netz-Log in E2E-Tests mitzählen).
	let extremeHost = $state<HTMLElement | null>(null);
	let showExtreme = $state(false);
	onMount(() => {
		if (!extremeHost) return;
		const io = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) {
					io.disconnect();
					showExtreme = true;
				}
			},
			{ rootMargin: '200px' }
		);
		io.observe(extremeHost);
		return () => io.disconnect();
	});

	function handleReiheChange(reihe: WahlPortalReihe): void {
		setReihe(portal, reihe);
	}
	function handleEbeneChange(ebene: WahlPortalEbene): void {
		setEbene(portal, ebene);
	}
	function handleJahrChange(jahr: number): void {
		setJahr(portal, jahr);
	}

	const jahrOptions = $derived(
		jahreForReihe(portal, portal.reihe).map((w) => ({
			jahr: w.jahr,
			isRepeatElection: w.isRepeatElection
		}))
	);
	const resolvedJahr = $derived(currentJahr(portal));
	// Ohne Daten immer gesperrt, egal ob idle/loading/error/leer-geladen.
	const steuerleisteDisabled = $derived(portal.wahlen.length === 0);

	const jahre = $derived(portal.wahlen.map((w) => w.jahr));
	const minJahr = $derived(jahre.length > 0 ? Math.min(...jahre) : null);
	const maxJahr = $derived(jahre.length > 0 ? Math.max(...jahre) : null);

	const quellen = $derived(deriveQuellen(portal.wahlen));

	// Kontext-Badges (Story 10): Wechsel/Trends sind reihen-weit über ALLE
	// Wahljahre (siehe wechsel-kapitel.svelte/trends-kapitel.svelte). Beide
	// sind fest auf Kiez-Ebene -- unabhängig vom Karten-Ebenen-Toggle. Story
	// 12: der Sankey (mit seinem eigenen Kiez/Bezirk-Toggle) zog in ein
	// eigenes Kapitel um, das Trends-Badge nennt die Ebene deshalb wieder
	// (Review Triage Log #11). Extreme (Small Multiples) folgt dagegen dem
	// Karten-Jahr (`currentJahr`), fest auf Kiez-Ebene.
	const kontextReiheLabel = $derived(REIHE_LABELS[portal.reihe]);
	const kontextEbeneKiezText = `${EBENE_LABELS.kiez}-Ebene`;
	const kontextAlleWahljahreText = 'alle Wahljahre';
	// Review Triage Log #7: `resolvedJahr === null` heißt keine Daten geladen,
	// das Kapitel zeigt dann einen Leerzustand -- "alle Wahljahre" würde eine
	// Auswahl suggerieren, die es nicht gibt.
	const kontextExtremeJahreText = $derived(
		resolvedJahr !== null ? `Wahl ${resolvedJahr}` : 'kein Wahljahr geladen'
	);

	const KARTE_CHAPTER = { id: 'karte', label: 'Karte' } as const;
	const WECHSEL_CHAPTER = { id: 'wechsel', label: 'Wechsel' } as const;
	const TRENDS_CHAPTER = { id: 'trends', label: 'Trends' } as const;
	// Story 12: eigenes Kapitel für den Sankey -- vorher versteckte er sich als
	// Unterabschnitt im Trends-Kapitel ohne eigenen Nav-Eintrag.
	const UEBERGAENGE_CHAPTER = { id: 'uebergaenge', label: 'Übergänge' } as const;
	const EXTREME_CHAPTER = { id: 'extreme-gebiete', label: 'Extreme' } as const;

	// Review Triage Log #6: die Platzhalter-Kapitel „Kontraste"/„Dein Kiez"/
	// „Wahl × Atlas" standen hier ohne zugehörige Story -- Matze strich sie am
	// 20.09. 15:41 (siehe stories.yaml Story 10). Sie kommen mit ihren neuen
	// Stories zurück, bis dahin bleibt nur die Nav ohne diese Einträge.
	const NAV_CHAPTERS = [
		{ id: 'ueberblick', label: 'Überblick' },
		KARTE_CHAPTER,
		WECHSEL_CHAPTER,
		TRENDS_CHAPTER,
		UEBERGAENGE_CHAPTER,
		EXTREME_CHAPTER,
		{ id: 'methodik', label: 'Methodik' }
	];

	// Story 12: Erklär-Subtexte direkt unter jeder Kapitel-Überschrift -- was
	// zeigt das Kapitel, wie liest man es. Statische Strings (Boundary: keine
	// neuen Datenpfade), lint:wahl-konform. Der Überblick-Header bekommt
	// bewusst keinen eigenen: `pageDescription` deckt das dort bereits ab.
	const KARTE_SUBTEXT =
		'Im Gewinner-Tab zeigt die Färbung die stärkste Kraft je Gebiet, in den Partei-Tabs den Anteil der gewählten Partei. Jahr und Ebene gelten nur für dieses Kapitel.';
	const WECHSEL_SUBTEXT =
		'Die Karte zählt, wie oft ein Gebiet innerhalb der gewählten Wahl-Reihe die stärkste Kraft wechselte. Die Liste darunter nennt die Wechsel mit Jahr, alter und neuer Partei.';
	const TRENDS_SUBTEXT =
		'Die Karte zeigt Richtung und Stärke der Stimmenanteil-Entwicklung je Partei, wahlweise die Volatilität aller Parteien zusammen. Toggle und Partei-Chips wechseln nur die Einfärbung, kein neuer Datenabruf.';
	const UEBERGAENGE_SUBTEXT =
		'Jede Spalte steht für ein Wahljahr, jedes Band bündelt Gebiete mit derselben Partei-Abfolge zwischen zwei Wahlen, auch ohne Wechsel der stärksten Kraft. Hover oder Fokus zeigt die genauen Zahlen.';
	const EXTREME_SUBTEXT =
		'Die Karten zeigen je Partei das Gebiet mit dem höchsten und dem niedrigsten Stimmenanteil im gewählten Jahr.';
	const METHODIK_SUBTEXT =
		'Hier stehen die Quellen und Lizenzen aller Wahl-Datensätze, mit Links zur ausführlichen Methodik-Seite und zur Lizenzübersicht.';

	const pageTitle = 'Berlin-Wahlen - Wahlergebnisse auf der Karte - navigator.berlin';
	const pageDescription =
		'Bundestags-, Abgeordnetenhaus- und BVV-Wahlen in Berlin seit 2011: Karte, Wechsel, Trends und Wahljahre im Übergang je Kiez und Bezirk.';

	const dataCatalogJsonLd = $derived(
		buildDataCatalog({
			origin,
			name: 'navigator.berlin Wahldaten-Katalog',
			description: pageDescription,
			urlPath: '/berlin-wahlen',
			publisherName: 'Matze Schmidbauer',
			datasets: [
				{
					name: 'Berliner Wahlergebnisse seit 2011',
					description:
						'Bundestags-, Abgeordnetenhaus- und BVV-Wahlergebnisse je Stimmbezirk, Kiez, Bezirk und Berlin gesamt.',
					urlPath: '/wahl',
					license: 'dl-de/by-2-0'
				}
			]
		})
	);

	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin,
			items: [
				{ name: 'Berlin', path: '/' },
				{ name: 'Berlin-Wahlen', path: '/berlin-wahlen' }
			]
		})
	);
</script>

<SeoHead
	title={pageTitle}
	description={pageDescription}
	{pathname}
	{origin}
	ogImage={`${origin}/og/page/berlin-wahlen.png`}
	ogImageAlt="navigator.berlin Berlin-Wahlen"
	noindex={!featureFlags.wahlPortal}
/>
<JsonLd data={dataCatalogJsonLd} testid="berlin-wahlen-datacatalog-jsonld" />
<JsonLd data={breadcrumbJsonLd} testid="berlin-wahlen-breadcrumb-jsonld" />

<!-- Story 10: die Wahl-Reihe ist der einzige seitenweite Zustand und bleibt
     deshalb als eigene, schlanke Leiste dauerhaft sichtbar -- oberhalb der
     Kapitel-Nav, die ihren `top`-Offset entsprechend nachzieht. -->
<ReihenLeiste
	reihe={portal.reihe}
	disabled={steuerleisteDisabled}
	onReiheChange={handleReiheChange}
/>
<KapitelNav chapters={NAV_CHAPTERS} />

<div data-testid="berlin-wahlen-page" class="mx-auto flex max-w-4xl flex-col px-4 py-8">
	<header
		id="ueberblick"
		data-testid="wahl-portal-chapter-ueberblick"
		class="flex scroll-mt-[calc(var(--header-height,72px)+5.5rem)] flex-col gap-6 pb-10"
	>
		<p class="font-mono text-xs tracking-wider text-accent uppercase">Wahlen in Berlin</p>
		<h1 class="font-serif text-4xl text-ink md:text-5xl">Berlin-Wahlen</h1>
		<p class="max-w-prose font-serif text-lg leading-relaxed text-ink-muted">
			{pageDescription}
		</p>

		<PortalDatenstand {minJahr} {maxJahr} status={portal.status} />
		<EditorialDisclaimer variant="wahl-portal-footnote" />
	</header>

	<KapitelSection
		id={KARTE_CHAPTER.id}
		title="Karte"
		testid="wahl-portal-chapter-karte"
		subtext={KARTE_SUBTEXT}
	>
		<!-- Story 10: Jahr/Ebene sind Karten-lokale Controls (gelten nur für
		     Winner-Map/Panel/Zeit-Animation), deshalb hier statt in der
		     globalen Steuerleiste. -->
		<KartenSteuerung
			jahr={resolvedJahr}
			ebene={portal.ebene}
			{jahrOptions}
			disabled={steuerleisteDisabled}
			onJahrChange={handleJahrChange}
			onEbeneChange={handleEbeneChange}
		/>
		<WinnerMap />
	</KapitelSection>

	<KapitelSection
		id={WECHSEL_CHAPTER.id}
		title="Wechsel der stärksten Kraft"
		testid="wahl-portal-chapter-wechsel"
		subtext={WECHSEL_SUBTEXT}
	>
		<KapitelKontextBadge
			reiheLabel={kontextReiheLabel}
			jahreText={kontextAlleWahljahreText}
			ebeneText={kontextEbeneKiezText}
		/>
		<WechselKapitel />
	</KapitelSection>

	<KapitelSection
		id={TRENDS_CHAPTER.id}
		title="Trends und Volatilität"
		testid="wahl-portal-chapter-trends"
		subtext={TRENDS_SUBTEXT}
	>
		<KapitelKontextBadge
			reiheLabel={kontextReiheLabel}
			jahreText={kontextAlleWahljahreText}
			ebeneText={kontextEbeneKiezText}
		/>
		<TrendsKapitel />
	</KapitelSection>

	<KapitelSection
		id={UEBERGAENGE_CHAPTER.id}
		title="Wahljahre im Übergang"
		testid="wahl-portal-chapter-uebergaenge"
		subtext={UEBERGAENGE_SUBTEXT}
	>
		<!-- Wie Trends-Badge: kein ebeneText, der Sankey hat einen eigenen
		     Kiez/Bezirk-Toggle, das Badge darf keine Ebene behaupten. -->
		<KapitelKontextBadge reiheLabel={kontextReiheLabel} jahreText={kontextAlleWahljahreText} />
		<SankeyWahljahre />
	</KapitelSection>

	<KapitelSection
		id={EXTREME_CHAPTER.id}
		title="Stärkste und schwächste Gebiete"
		testid="wahl-portal-chapter-extreme-gebiete"
		subtext={EXTREME_SUBTEXT}
	>
		<KapitelKontextBadge
			reiheLabel={kontextReiheLabel}
			jahreText={kontextExtremeJahreText}
			ebeneText={kontextEbeneKiezText}
		/>
		<div bind:this={extremeHost}>
			{#if showExtreme}
				<SmallMultiples />
			{:else}
				<p data-testid="extreme-gebiete-lazy-hinweis" class="font-serif text-ink-muted">
					Das Kapitel lädt, sobald es sichtbar wird.
				</p>
			{/if}
		</div>
	</KapitelSection>

	<KapitelSection
		id="methodik"
		title="Methodik & Quellen"
		testid="wahl-portal-chapter-methodik"
		subtext={METHODIK_SUBTEXT}
	>
		<PortalQuellen {quellen} />
	</KapitelSection>
</div>
