<script lang="ts">
	import { page } from '$app/state';
	import {
		ArrowRight,
		Search,
		MapPin,
		Navigation,
		Film,
		BookOpen,
		Waves,
		Landmark,
		ShoppingBag,
		Droplet,
		ExternalLink
	} from '@lucide/svelte';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import FaqSection from '$lib/components/atlas/faq-section.svelte';
	import DwdHitzewarnBanner from '$lib/components/kuehle-orte/dwd-hitzewarn-banner.svelte';
	import InDeinerNaehe from '$lib/components/kuehle-orte/in-deiner-naehe.svelte';
	import KuehleOrteTransparenz from '$lib/components/kuehle-orte/kuehle-orte-transparenz.svelte';
	import { buildDataset } from '$lib/seo/jsonld-dataset.js';
	import { buildBreadcrumbList } from '$lib/seo/jsonld-breadcrumb.js';
	import { HITZE_FAQ } from '$lib/content/hitze-faq.js';
	import { buildExplorerDeepLink } from '$lib/utils/url-state.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const origin = $derived(page.url.origin);
	const pathname = $derived(page.url.pathname);

	// Dieselbe Seite ist über zwei Hosts erreichbar: navigator.berlin/hitze und
	// hitze.navigator.berlin/ (Reroute). Canonical konsolidiert auf die Haupt-Domain,
	// damit kein Duplicate-Content entsteht. `hitze.`-Subdomain wird gestrippt, lokal bleibt lokal.
	const primaryOrigin = $derived(origin.replace('://hitze.', '://'));
	const canonical = $derived(`${primaryOrigin}/hitze`);

	// mode=hitze erzwingt den reduzierten Explorer auch ohne Hitze-Host (lokal + Main-Domain).
	const explorerLink = `${buildExplorerDeepLink(['kuehle-orte'])}&mode=hitze`;
	const pageTitle = 'Hitze-Navigator Berlin - kühle Orte bei Hitze finden';
	const pageDescription =
		'Über 500 kühle Orte in Berlin bei Hitze: Kinos, Bibliotheken, Schwimmhallen, Museen, Malls und Trinkbrunnen, jeweils mit Adresse und Weg dorthin. Ein Angebot auf offenen Daten.';
	const ogImagePath = '/og/page/hitze.png';
	const ogImageAbsolute = $derived(`${primaryOrigin}${ogImagePath}`);

	const datasetJsonLd = $derived(
		buildDataset({
			origin: primaryOrigin,
			name: 'Kühle Orte in Berlin',
			description: pageDescription,
			license: 'ODbL 1.0',
			dateModified: '2026-06-30',
			creatorName: 'navigator.berlin',
			contentUrl: `${primaryOrigin}/hitze`,
			encodingFormat: 'text/html',
			keywords: ['Kühle Orte', 'Hitze', 'Berlin', 'Abkühlung', 'Klimaanlage', 'Trinkbrunnen']
		})
	);

	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin: primaryOrigin,
			items: [
				{ name: 'Start', path: '/' },
				{ name: 'Kühle Orte bei Hitze', path: '/hitze' }
			]
		})
	);

	const categories = [
		{ icon: Film, name: 'Kinos', note: 'meist klimatisiert' },
		{ icon: BookOpen, name: 'Bibliotheken', note: 'kühl und ruhig' },
		{ icon: Waves, name: 'Schwimmhallen', note: 'Abkühlung im Wasser' },
		{ icon: Landmark, name: 'Museen', note: 'oft klimatisiert' },
		{ icon: ShoppingBag, name: 'Malls und Kaufhäuser', note: 'frei zugänglich' },
		{ icon: Droplet, name: 'Trinkbrunnen', note: 'Mai bis Oktober' }
	];

	const steps = [
		{ icon: Search, title: 'Adresse eingeben', text: 'Tippe deinen Standort in die Karte.' },
		{
			icon: MapPin,
			title: 'Nächste Orte sehen',
			text: 'Die Karte zeigt die kühlen Orte in deiner Nähe, sortiert nach Entfernung.'
		},
		{
			icon: Navigation,
			title: 'Hinnavigieren',
			text: 'Ein Tap öffnet die Route in Google oder Apple Maps.'
		}
	];

	const offiziell = [
		{
			href: 'https://www.berlin.de/hitzeschutz/',
			title: 'Hitzeschutzportal der Stadt Berlin',
			text: 'Warnungen, Verhaltenstipps und Hintergründe der Senatsverwaltung.'
		},
		{
			href: 'https://kuehle-orte.berlin.de/hsp/',
			title: 'Offizielle Kühle-Orte-Karte',
			text: 'Die städtische Karte mit Grünanlagen, Badestellen und Trinkbrunnen.'
		},
		{
			href: 'https://www.berlin.de/hitzeschutz/hitzeaktionsplan/',
			title: 'Berliner Hitzeaktionsplan',
			text: 'Die Strategie der Stadt gegen Hitzefolgen.'
		}
	];
</script>

<SeoHead
	title={pageTitle}
	description={pageDescription}
	{pathname}
	{origin}
	{canonical}
	ogImage={ogImageAbsolute}
	locales={['de']}
/>
<JsonLd data={datasetJsonLd} testid="hitze-dataset-jsonld" />
<JsonLd data={breadcrumbJsonLd} testid="hitze-breadcrumb-jsonld" />

<div data-testid="hitze-landing" class="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-12">
	<DwdHitzewarnBanner warning={data.warning} />
	<header class="flex flex-col gap-6">
		<p class="font-mono text-xs tracking-wider text-accent uppercase">Kühle Orte bei Hitze</p>
		<h1 class="font-serif text-4xl text-ink md:text-5xl lg:text-6xl">Hitze-Navigator Berlin</h1>
		<p class="max-w-prose font-serif text-lg leading-relaxed text-ink-muted">
			Gib deinen Standort ein. Du siehst die nächsten kühlen Orte in Berlin, sortiert nach
			Entfernung, mit Öffnungsstatus und dem Weg dorthin. Kinos, Bibliotheken, Schwimmhallen,
			Museen, Malls und Trinkbrunnen, über 500 Orte aus offenen Daten.
		</p>
		<div class="flex flex-col gap-2 pt-1">
			<a
				href={explorerLink}
				data-testid="hitze-cta"
				class="inline-flex w-fit items-center gap-2 rounded border border-accent bg-accent px-4 py-2 font-mono text-sm tracking-wider text-bg uppercase hover:border-ink hover:bg-ink"
			>
				<ArrowRight size={16} aria-hidden="true" />
				Kühle Orte auf der Karte
			</a>
			<p class="font-sans text-sm text-ink-subtle">
				Interaktive Karte mit allen kühlen Orten, Live-Status und Filtern.
			</p>
			<a
				href="/layer/kuehle-orte"
				data-testid="hitze-methodik-link"
				class="w-fit font-mono text-sm tracking-wider text-ink-muted uppercase hover:text-ink"
			>
				Methodik: wie wir kühle Orte bewerten
			</a>
		</div>
	</header>

	<InDeinerNaehe explorerHref={explorerLink} />

	<section aria-labelledby="orte-h" class="flex flex-col gap-4">
		<h2 id="orte-h" class="font-sans text-2xl font-semibold text-ink">
			Kühle Orte in Berlin: wo du Abkühlung findest
		</h2>
		<ul class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			{#each categories as cat (cat.name)}
				{@const Icon = cat.icon}
				<li class="flex items-start gap-3 rounded border border-rule bg-bg-elevated px-3 py-2.5">
					<Icon size={20} aria-hidden="true" class="mt-0.5 shrink-0 text-[#0277BD]" />
					<span class="flex flex-col">
						<span class="font-sans text-sm font-medium text-ink">{cat.name}</span>
						<span class="font-serif text-sm text-ink-muted">{cat.note}</span>
					</span>
				</li>
			{/each}
		</ul>
	</section>

	<section aria-labelledby="schritte-h" class="flex flex-col gap-4">
		<h2 id="schritte-h" class="font-sans text-2xl font-semibold text-ink">
			In drei Schritten zum kühlen Ort
		</h2>
		<ol class="flex flex-col gap-3">
			{#each steps as step, i (step.title)}
				{@const Icon = step.icon}
				<li class="flex items-start gap-3">
					<span
						class="bg-accent/10 text-accent flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-sans text-sm font-semibold"
						aria-hidden="true">{i + 1}</span
					>
					<span class="flex flex-col">
						<span class="flex items-center gap-1.5 font-sans text-sm font-medium text-ink">
							<Icon size={15} aria-hidden="true" class="text-ink-muted" />
							{step.title}
						</span>
						<span class="font-serif text-sm text-ink-muted">{step.text}</span>
					</span>
				</li>
			{/each}
		</ol>
	</section>

	<section aria-labelledby="offiziell-h" class="flex flex-col gap-4">
		<h2 id="offiziell-h" class="font-sans text-2xl font-semibold text-ink">
			Offizielle Angebote der Stadt Berlin
		</h2>
		<p class="font-serif text-base text-ink-muted">
			Der Hitze-Navigator ergänzt die Angebote der Stadt, er ersetzt sie nicht. Die offiziellen
			Quellen:
		</p>
		<ul class="flex flex-col gap-3">
			{#each offiziell as link (link.href)}
				<li>
					<a
						href={link.href}
						target="_blank"
						rel="noopener noreferrer"
						class="group flex items-start gap-2 rounded border border-rule px-3 py-2.5 hover:border-ink-subtle"
					>
						<ExternalLink
							size={16}
							aria-hidden="true"
							class="mt-0.5 shrink-0 text-ink-subtle group-hover:text-ink"
						/>
						<span class="flex flex-col">
							<span class="font-sans text-sm font-medium text-accent">{link.title}</span>
							<span class="font-serif text-sm text-ink-muted">{link.text}</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>

	<FaqSection items={HITZE_FAQ} pageType="landing" />

	<KuehleOrteTransparenz />
</div>
