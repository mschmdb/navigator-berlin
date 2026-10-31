<!--
	"Punkt, Linie, Kiez" für die 12 Bezirke (#163): ein Bezirk groß mit Legende, alle Bezirke als
	Buttons darunter. Der gewählte Button trägt `aria-pressed="true"` und einen Tinten-Balken
	unter der Zeichnung. Den Fokusring zeichnet der globale `:focus-visible`-Stil. Die Fußzeile
	nennt Quellen mit Stand, Lizenzen und den OSM-Hinweis.
-->
<script lang="ts">
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { trackEvent } from '$lib/utils/plausible.js';
	import type { BezirkItem, KennzahlenQuelle } from '$lib/stories/punkt-linie-kiez/types.js';
	import { STORY_FONT, STORY_INK, STORY_PAPER } from '$lib/stories/tokens.js';
	import PunktLinieKiez from './punkt-linie-kiez.svelte';

	interface Props {
		readonly bezirke: readonly BezirkItem[];
		readonly sources: readonly KennzahlenQuelle[];
		/** Startwahl. Ein unbekannter Slug fällt auf den ersten Bezirk zurück. */
		readonly initialSlug?: string;
		/** Wird bei jeder Wahl durch den Nutzer aufgerufen, etwa um die URL zu aktualisieren. */
		readonly onselect?: (slug: string) => void;
	}

	const { bezirke, sources, initialSlug, onselect }: Props = $props();

	let chosen = $state<string | undefined>(undefined);
	const effectiveSlug = $derived(
		[chosen, initialSlug].find((s) => s !== undefined && bezirke.some((b) => b.slug === s)) ??
			bezirke[0]?.slug ??
			''
	);
	const selected = $derived(bezirke.find((b) => b.slug === effectiveSlug));
	const sourceLabels = $derived(
		[...new Map(sources.map((s) => [s.name, s])).values()].map((s) =>
			s.stand ? `${s.name} (${m.plk_stand()} ${s.stand})` : s.name
		)
	);

	const locale = $derived(getLocale());

	function choose(slug: string): void {
		chosen = slug;
		onselect?.(slug);
	}
</script>

<section
	data-testid="plk-auswahl"
	aria-label={m.plk_title()}
	class="not-prose my-6 border"
	style:background-color={STORY_PAPER}
	style:color={STORY_INK}
	style:border-color={STORY_INK}
	style:font-family={STORY_FONT}
>
	{#if selected}
		<div data-testid="plk-auswahl-gross">
			<PunktLinieKiez name={selected.name} kennzahlen={selected.kennzahlen} />
			<p class="m-0 px-4 pb-4 sm:px-6">
				<!-- Das Poster liegt pro Sprache und Bezirk als Vektor-PDF vor, beim Build erzeugt. -->
				<a
					data-testid="plk-pdf-link"
					onclick={() =>
						trackEvent('Stories PDF Download', {
							serie: 'punkt-linie-kiez',
							bezirk: selected.slug,
							sprache: locale
						})}
					href="/stories/punkt-linie-kiez/{locale}/{selected.slug}.pdf"
					download="punkt-linie-kiez-{selected.slug}-{locale}.pdf"
					class="inline-flex min-h-6 items-center border px-3 py-1 text-base font-semibold underline underline-offset-2"
					style:border-color={STORY_INK}
				>
					{m.plk_pdf_link()}
				</a>
			</p>
		</div>
	{/if}
	<div class="px-4 pb-4 sm:px-6 sm:pb-6">
		<p class="m-0 text-base font-semibold">{m.plk_title()}</p>
		<p class="m-0 mb-3 text-base">{m.plk_sub()}</p>
		<ul
			data-testid="plk-auswahl-liste"
			aria-label={m.plk_choose_label()}
			class="m-0 grid list-none grid-cols-3 gap-3 p-0 sm:grid-cols-4 lg:grid-cols-6"
		>
			{#each bezirke as b (b.slug)}
				<li class="m-0 p-0">
					<button
						type="button"
						aria-pressed={b.slug === effectiveSlug}
						onclick={() => choose(b.slug)}
						class="flex min-h-(--target-min) w-full flex-col items-stretch gap-1 border-0 border-b-4 bg-transparent p-1 text-left text-sm leading-tight"
						style:border-color={b.slug === effectiveSlug ? STORY_INK : 'transparent'}
						style:color={STORY_INK}
					>
						<PunktLinieKiez name={b.name} kennzahlen={b.kennzahlen} thumbnail legend={false} bare />
						<span class="[overflow-wrap:anywhere]">{b.name.toLocaleLowerCase('de')}</span>
					</button>
				</li>
			{/each}
		</ul>
		<p role="status" class="sr-only">
			{selected ? m.plk_selected_status({ name: selected.name }) : ''}
		</p>
	</div>
	<footer
		data-testid="plk-auswahl-fuss"
		class="flex flex-col gap-1 border-t px-4 py-3 text-sm sm:flex-row sm:justify-between sm:gap-6 sm:px-6"
		style:border-color={STORY_INK}
	>
		<span>{m.plk_footer_brand()}</span>
		<span class="sm:text-right">
			{m.plk_sources_label()}: {sourceLabels.join('; ')}.
			<a
				href={localizedHref('/lizenzen')}
				class="inline-flex min-h-6 items-center underline underline-offset-2"
			>
				{m.plk_licenses_link()}
			</a>
			<span aria-hidden="true">/</span>
			<a
				href="https://www.openstreetmap.org/copyright"
				class="inline-flex min-h-6 items-center underline underline-offset-2"
			>
				{m.plk_osm()}
			</a>
		</span>
	</footer>
</section>
