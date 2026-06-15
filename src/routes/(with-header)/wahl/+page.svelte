<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import EditorialDisclaimer from '$lib/components/atlas/editorial-disclaimer.svelte';
	import { buildBreadcrumbList } from '$lib/seo/jsonld-breadcrumb.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const origin = $derived(page.url.origin);
	const pathname = $derived(page.url.pathname);

	const pageTitle = 'Wahlen in Berlin · navigator.berlin';
	const pageDescription =
		'Wahlen in Berlin im Daten-Atlas: Bundestag, Abgeordnetenhaus und BVV. Stimmenanteile pro Partei, Bezirk und Kiez.';

	type Entry = (typeof data.entries)[number];

	const groupedByTyp = $derived.by(() => {
		const groups: Record<'btw' | 'agh' | 'bvv', Entry[]> = {
			btw: [],
			agh: [],
			bvv: []
		};
		for (const e of data.entries) groups[e.typ].push(e);
		return groups;
	});

	const breadcrumbs = $derived(
		buildBreadcrumbList({
			origin,
			items: [
				{ name: 'Berlin', path: '/' },
				{ name: 'Wahlen', path: '/wahl' }
			]
		})
	);
</script>

<SeoHead title={pageTitle} description={pageDescription} {origin} {pathname} locales={['de']} />

<JsonLd data={breadcrumbs} />

<article class="mx-auto max-w-4xl space-y-8 px-4 py-8" data-testid="wahl-index-page">
	<header class="space-y-3">
		<p class="font-mono text-xs tracking-wide text-ink-muted uppercase">
			<a href="/" class="underline-offset-2 hover:text-ink hover:underline">Berlin</a>
		</p>
		<h1 class="font-sans text-3xl font-bold text-ink" data-testid="wahl-index-title">
			Wahlen in Berlin
		</h1>
		<p class="font-serif text-base leading-relaxed text-ink-muted">
			Stimmenanteile pro Partei in Berlin, aggregiert auf Stimmbezirk, Kiez, Bezirk und Berlin
			gesamt. Bundestagswahlen ab 2013, Abgeordnetenhaus und Bezirksverordneten-Versammlungen ab
			2011.
		</p>
	</header>

	{#if data.entries.length === 0}
		<p class="font-mono text-sm text-ink-muted" data-testid="wahl-index-empty">
			Keine Wahldaten in der Datenbank verfügbar.
		</p>
	{:else}
		{#each ['btw', 'agh', 'bvv'] as typ (typ)}
			{@const list = groupedByTyp[typ as 'btw' | 'agh' | 'bvv']}
			{#if list.length > 0}
				<section class="space-y-3" data-testid={`wahl-index-section-${typ}`}>
					<h2 class="font-sans text-xl font-semibold text-ink">
						{list[0].typLabel}
					</h2>
					<ul class="grid gap-2 sm:grid-cols-2">
						{#each list as entry (entry.slug)}
							<li>
								<a
									href={`/wahl/${entry.slug}`}
									data-testid={`wahl-index-card-${entry.slug}`}
									class="hover:bg-bg-muted block rounded border border-rule p-3 transition-colors hover:border-ink"
								>
									<div class="flex items-baseline justify-between gap-2">
										<span class="font-mono text-base text-ink tabular-nums">
											{entry.jahr}
										</span>
										{#if entry.isRepeatElection}
											<span class="font-mono text-[10px] tracking-wide text-ink-muted uppercase">
												Wiederholung
											</span>
										{/if}
									</div>
									{#if entry.typ !== 'bvv'}
										<span class="font-mono text-xs text-ink-muted">
											{entry.stimmtypLabel}
										</span>
									{/if}
								</a>
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		{/each}
	{/if}

	<EditorialDisclaimer variant="wahl-stimmenanteile" />

	<a
		href="/methodik/wahldaten"
		data-testid="wahl-index-methodik-link"
		class="hover:text-accent-strong inline-block font-mono text-sm text-accent underline underline-offset-2"
	>
		Methodik · Wahldaten
	</a>
</article>
