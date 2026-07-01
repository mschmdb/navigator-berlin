<script lang="ts">
	import { page } from '$app/state';
	import {
		Snowflake,
		ArrowRight,
		Home,
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
	import { buildDataset } from '$lib/seo/jsonld-dataset.js';
	import { buildExplorerDeepLink } from '$lib/utils/url-state.js';

	const origin = $derived(page.url.origin);
	const pathname = $derived(page.url.pathname);

	const explorerLink = buildExplorerDeepLink(['kuehle-orte']);
	const pageTitle = 'Hitze-Navigator Berlin - kühle Orte bei Hitze finden';
	const pageDescription =
		'Über 500 kühle Orte in Berlin bei Hitze: Kinos, Bibliotheken, Schwimmhallen, Museen, Malls und Trinkbrunnen, jeweils mit Adresse und Weg dorthin. Ein Angebot auf offenen Daten.';
	const ogImagePath = '/og/page/hitze.png';
	const ogImageAbsolute = $derived(`${origin}${ogImagePath}`);

	const datasetJsonLd = $derived(
		buildDataset({
			origin,
			name: 'Kühle Orte in Berlin',
			description: pageDescription,
			license: 'ODbL 1.0',
			dateModified: '2026-06-30',
			creatorName: 'navigator.berlin',
			contentUrl: `${origin}${pathname}`,
			encodingFormat: 'text/html',
			keywords: ['Kühle Orte', 'Hitze', 'Berlin', 'Abkühlung', 'Klimaanlage', 'Trinkbrunnen']
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
	ogImage={ogImageAbsolute}
	locales={['de']}
/>
<JsonLd data={datasetJsonLd} testid="hitze-dataset-jsonld" />

<main id="main" class="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-10">
	<header class="flex flex-col gap-4">
		<h1 class="flex items-center gap-2 font-sans text-4xl font-semibold text-ink">
			<Snowflake size={32} aria-hidden="true" class="shrink-0 text-[#0277BD]" />
			Hitze-Navigator Berlin
		</h1>
		<p class="font-serif text-xl leading-relaxed text-ink-muted">
			Bei Hitze zählt eine schnelle Antwort: Wohin zum Abkühlen? Der Hitze-Navigator zeigt über 500
			kühle Orte in Berlin, jeweils mit Adresse und Weg dorthin. Ein Angebot auf offenen Daten, kein
			Ersatz für die Hinweise der Stadt.
		</p>
		<div class="flex flex-col gap-2">
			<a
				href={explorerLink}
				data-testid="hitze-cta"
				class="bg-accent hover:bg-accent-strong focus-visible:ring-accent inline-flex min-h-11 w-fit items-center gap-2 rounded px-6 py-3 font-sans text-base font-semibold text-bg-elevated focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
			>
				Kühle Orte auf der Karte
				<ArrowRight size={18} aria-hidden="true" />
			</a>
			<p class="font-sans text-sm text-ink-subtle">
				Interaktive Karte mit allen kühlen Orten, Live-Status und Filtern.
			</p>
		</div>
	</header>

	<section aria-labelledby="orte-h" class="flex flex-col gap-4">
		<h2 id="orte-h" class="font-sans text-2xl font-semibold text-ink">
			Wo du in Berlin Abkühlung findest
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

	<section aria-labelledby="daten-h" class="flex flex-col gap-2">
		<h2 id="daten-h" class="font-sans text-lg font-semibold text-ink">Woher die Daten kommen</h2>
		<p class="font-serif text-sm leading-relaxed text-ink-muted">
			Geometrie und Basis-Angaben stammen aus OpenStreetMap (ODbL), ergänzt um eine redaktionelle
			Anreicherung von navigator.berlin: Kühle-Score, Klimatisierung, Öffnungszeiten und
			Sommer-Verfügbarkeit. Wo eine Angabe nicht belegbar war, sagen wir das offen. Kein
			Rechtsanspruch auf Zugang, private Orte wie Malls und Kinos üben Hausrecht aus.
		</p>
	</section>

	<footer class="border-t border-rule pt-5">
		<a
			href="https://navigator.berlin/"
			class="hover:text-ink inline-flex items-center gap-1.5 font-sans text-sm text-ink-subtle"
		>
			<Home size={14} aria-hidden="true" />
			navigator.berlin: der volle Open-Data-Atlas für Berlin
		</a>
	</footer>
</main>
