<script lang="ts">
	import { ExternalLink } from '@lucide/svelte';
	import type { StolpersteinFeature } from './internal/editorial-types.js';

	type Props = {
		feature: StolpersteinFeature;
		fetchedAt: string;
	};

	let { feature, fetchedAt }: Props = $props();

	const featureProps = $derived(feature.properties ?? ({} as StolpersteinFeature['properties']));
	const personName = $derived(featureProps.person ?? 'Unbekannte Person');
	const inscription = $derived(
		featureProps.inscription && featureProps.inscription.trim().length > 0
			? featureProps.inscription
			: 'Information nicht verfügbar, bitte Quelle besuchen.'
	);

	type WikiLink = { href: string; lang: 'de' | 'en' } | null;

	function parseWikipedia(p: StolpersteinFeature['properties']): WikiLink {
		const de = p['wikipedia:de'];
		const en = p['wikipedia:en'];
		const generic = p.wikipedia;
		const raw = de ?? en ?? generic;
		if (!raw || typeof raw !== 'string') return null;
		const match = raw.match(/^([a-z]{2}):(.+)$/);
		const lang: 'de' | 'en' = de ? 'de' : en ? 'en' : match?.[1] === 'en' ? 'en' : 'de';
		const title = match?.[2] ?? raw;
		const encoded = encodeURI(title.replace(/\s+/g, '_'));
		return { href: `https://${lang}.wikipedia.org/wiki/${encoded}`, lang };
	}

	const wikipedia = $derived(parseWikipedia(featureProps));
	const koordinierungUrl = 'https://www.stolpersteine-berlin.de/';
</script>

<section
	data-testid="stolperstein-detail"
	data-osm-sourced="true"
	class="flex flex-col gap-2"
>
	<h4
		data-testid="stolperstein-person"
		class="font-serif text-base font-semibold text-ink"
	>
		{personName}
	</h4>
	<blockquote
		data-testid="stolperstein-inscription"
		class="font-serif italic text-sm text-ink-muted border-l-2 border-rule pl-3"
	>
		{inscription}
	</blockquote>
	<ul class="flex flex-col gap-1 text-sm">
		<li>
			<a
				data-testid="stolperstein-source-koordinierung"
				href={koordinierungUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1 text-accent underline underline-offset-2 hover:text-accent-strong"
			>
				<ExternalLink size={12} aria-hidden="true" />
				<span>Berliner Koordinierungsstelle Stolpersteine</span>
			</a>
		</li>
		{#if wikipedia}
			<li>
				<a
					data-testid="stolperstein-source-wikipedia"
					href={wikipedia.href}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-1 text-accent underline underline-offset-2 hover:text-accent-strong"
				>
					<ExternalLink size={12} aria-hidden="true" />
					<span>Wikipedia ({wikipedia.lang.toUpperCase()})</span>
				</a>
			</li>
		{/if}
	</ul>
	<p
		data-testid="stolperstein-footer"
		class="font-mono text-xs text-ink-subtle"
	>
		Quelle: OpenStreetMap · Stand: {fetchedAt}
	</p>
</section>
