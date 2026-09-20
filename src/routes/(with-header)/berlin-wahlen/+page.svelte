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
	import PortalSteuerleiste from '$lib/components/wahl-portal/portal-steuerleiste.svelte';
	import KapitelNav from '$lib/components/wahl-portal/kapitel-nav.svelte';
	import KapitelSection from '$lib/components/wahl-portal/kapitel-section.svelte';
	import PortalDatenstand from '$lib/components/wahl-portal/portal-datenstand.svelte';
	import PortalQuellen from '$lib/components/wahl-portal/portal-quellen.svelte';
	import WinnerMap from '$lib/components/wahl-portal/winner-map.svelte';
	import WechselKapitel from '$lib/components/wahl-portal/wechsel-kapitel.svelte';
	import TrendsKapitel from '$lib/components/wahl-portal/trends-kapitel.svelte';
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

	const KARTE_CHAPTER = { id: 'karte', label: 'Karte' } as const;
	const WECHSEL_CHAPTER = { id: 'wechsel', label: 'Wechsel' } as const;
	const TRENDS_CHAPTER = { id: 'trends', label: 'Trends' } as const;
	const EXTREME_CHAPTER = { id: 'extreme-gebiete', label: 'Extreme' } as const;

	const PLACEHOLDER_CHAPTERS_VOR_EXTREME = [
		{
			id: 'kontraste',
			label: 'Kontraste',
			title: 'Kontraste',
			takeaway: 'Hier entstehen Ausgeglichenheits-Karte und die schärfsten Nachbar-Kontraste.'
		}
	] as const;
	const PLACEHOLDER_CHAPTERS_NACH_EXTREME = [
		{
			id: 'dein-kiez',
			label: 'Dein Kiez',
			title: 'Dein Kiez',
			takeaway: 'Hier entstehen dein Kiez-Profil über die Jahre und die ähnlich wählenden Kieze.'
		},
		{
			id: 'atlas',
			label: 'Wahl × Atlas',
			title: 'Wahl × Atlas',
			takeaway: 'Hier entsteht die Kreuzung von Wahlergebnissen mit den Atlas-Layern.'
		}
	] as const;
	const NAV_CHAPTERS = [
		{ id: 'ueberblick', label: 'Überblick' },
		KARTE_CHAPTER,
		WECHSEL_CHAPTER,
		TRENDS_CHAPTER,
		...PLACEHOLDER_CHAPTERS_VOR_EXTREME.map((c) => ({ id: c.id, label: c.label })),
		EXTREME_CHAPTER,
		...PLACEHOLDER_CHAPTERS_NACH_EXTREME.map((c) => ({ id: c.id, label: c.label })),
		{ id: 'methodik', label: 'Methodik' }
	];

	const pageTitle = 'Berlin-Wahlen - Wahlergebnisse auf der Karte - navigator.berlin';
	const pageDescription =
		'Bundestags-, Abgeordnetenhaus- und BVV-Wahlen in Berlin seit 2011: Karte, Trends, Kontraste und dein Kiez im Wahlverhalten.';

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

<KapitelNav chapters={NAV_CHAPTERS} />

<div data-testid="berlin-wahlen-page" class="mx-auto flex max-w-4xl flex-col px-4 py-8">
	<header
		id="ueberblick"
		data-testid="wahl-portal-chapter-ueberblick"
		class="flex scroll-mt-[calc(var(--header-height,72px)+3rem)] flex-col gap-6 pb-10"
	>
		<p class="font-mono text-xs tracking-wider text-accent uppercase">Wahlen in Berlin</p>
		<h1 class="font-serif text-4xl text-ink md:text-5xl">Berlin-Wahlen</h1>
		<p class="max-w-prose font-serif text-lg leading-relaxed text-ink-muted">
			{pageDescription}
		</p>

		<PortalSteuerleiste
			reihe={portal.reihe}
			jahr={resolvedJahr}
			ebene={portal.ebene}
			{jahrOptions}
			disabled={steuerleisteDisabled}
			onReiheChange={handleReiheChange}
			onJahrChange={handleJahrChange}
			onEbeneChange={handleEbeneChange}
		/>

		<PortalDatenstand {minJahr} {maxJahr} status={portal.status} />
		<EditorialDisclaimer variant="wahl-portal-footnote" />
	</header>

	<KapitelSection id={KARTE_CHAPTER.id} title="Karte" testid="wahl-portal-chapter-karte">
		<WinnerMap />
	</KapitelSection>

	<KapitelSection
		id={WECHSEL_CHAPTER.id}
		title="Wechsel der stärksten Kraft"
		testid="wahl-portal-chapter-wechsel"
	>
		<WechselKapitel />
	</KapitelSection>

	<KapitelSection
		id={TRENDS_CHAPTER.id}
		title="Trends und Volatilität"
		testid="wahl-portal-chapter-trends"
	>
		<TrendsKapitel />
	</KapitelSection>

	{#each PLACEHOLDER_CHAPTERS_VOR_EXTREME as chapter (chapter.id)}
		<KapitelSection
			id={chapter.id}
			title={chapter.title}
			testid={`wahl-portal-chapter-${chapter.id}`}
		>
			{#snippet takeaway()}
				{chapter.takeaway}
			{/snippet}
			<p
				data-testid={`wahl-portal-chapter-${chapter.id}-placeholder`}
				class="font-serif text-base text-ink-muted"
			>
				Dieses Kapitel ist in Arbeit und folgt in Kürze.
			</p>
		</KapitelSection>
	{/each}

	<KapitelSection
		id={EXTREME_CHAPTER.id}
		title="Stärkste und schwächste Gebiete"
		testid="wahl-portal-chapter-extreme-gebiete"
	>
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

	{#each PLACEHOLDER_CHAPTERS_NACH_EXTREME as chapter (chapter.id)}
		<KapitelSection
			id={chapter.id}
			title={chapter.title}
			testid={`wahl-portal-chapter-${chapter.id}`}
		>
			{#snippet takeaway()}
				{chapter.takeaway}
			{/snippet}
			<p
				data-testid={`wahl-portal-chapter-${chapter.id}-placeholder`}
				class="font-serif text-base text-ink-muted"
			>
				Dieses Kapitel ist in Arbeit und folgt in Kürze.
			</p>
		</KapitelSection>
	{/each}

	<KapitelSection id="methodik" title="Methodik & Quellen" testid="wahl-portal-chapter-methodik">
		<PortalQuellen {quellen} />
	</KapitelSection>
</div>
