<script lang="ts">
	import { Accordion } from 'bits-ui';
	import { ChevronDown } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import {
		getWahlPortalState,
		currentJahr,
		vorlaeufigStatusFor
	} from '$lib/state/wahl-portal-context.svelte.js';
	import {
		stimmtypForReihe,
		REIHE_LABELS,
		type WahlPortalEbene
	} from '$lib/utils/wahl-portal-url-state.js';
	import {
		buildErgebnisPanelRows,
		vorjahrLabel,
		type ErgebnisSeriesPoint,
		type ErgebnisPanelData
	} from './internal/ergebnis-panel-data.js';
	import VorlaeufigBadge from './vorlaeufig-badge.svelte';

	type Props = {
		/** Injizierbar für Tests; Default = globales `fetch`. */
		fetchFn?: typeof fetch;
		/** Per Adress-Suche hervorgehobenes Gebiet (durchgereicht von winner-map.svelte). */
		highlightedSlug?: string | null;
		highlightedName?: string | null;
		/** Tatsächliche Anzeige-Ebene der Karte (nach Fallback-Leiter). */
		anzeigeEbene?: WahlPortalEbene;
	};
	let {
		fetchFn = fetch,
		highlightedSlug = null,
		highlightedName = null,
		anzeigeEbene = 'kiez'
	}: Props = $props();

	const portal = getWahlPortalState();
	const stimmtyp = $derived(stimmtypForReihe(portal.reihe));
	const jahr = $derived(currentJahr(portal));

	interface SeriesApiResponse {
		readonly points: ErgebnisSeriesPoint[];
		readonly license: string | null;
		readonly source_name: string | null;
	}
	type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

	// Berlin-Block: eine Reihe hat GENAU einen Berlin-Response (ebene=berlin),
	// gecacht pro Reihe×Stimmtyp (Muster winner-map.svelte loadWinners). ---
	const berlinCache: Record<string, SeriesApiResponse> = {};
	let berlinResponse = $state<SeriesApiResponse | null>(null);
	let berlinStatus = $state<LoadStatus>('idle');

	async function loadBerlinSeries(typ: string, st: string): Promise<void> {
		const key = `${typ}-${st}`;
		const cached = berlinCache[key];
		if (cached) {
			berlinResponse = cached;
			berlinStatus = 'loaded';
			return;
		}
		berlinStatus = 'loading';
		try {
			const url = `/api/wahl/series?typ=${typ}&stimmtyp=${st}&ebene=berlin`;
			const res = await fetchFn(url);
			if (!res.ok) throw new Error(`status ${res.status}`);
			const data = (await res.json()) as SeriesApiResponse;
			if (!Array.isArray(data?.points)) throw new Error('malformed series response');
			berlinCache[key] = data;
			if (typ !== portal.reihe || st !== stimmtypForReihe(portal.reihe)) return;
			berlinResponse = data;
			berlinStatus = 'loaded';
		} catch {
			if (typ !== portal.reihe || st !== stimmtypForReihe(portal.reihe)) return;
			berlinStatus = 'error';
		}
	}

	$effect(() => {
		void loadBerlinSeries(portal.reihe, stimmtyp);
	});

	// Gebiets-Block: nur auf kiez/bezirk-Anzeige-Ebene mit Adress-Treffer,
	// gecacht pro Reihe×Stimmtyp×Ebene×Slug. ---
	const gebietCache: Record<string, SeriesApiResponse> = {};
	let gebietResponse = $state<SeriesApiResponse | null>(null);
	let gebietStatus = $state<LoadStatus>('idle');

	const gebietAnfrageAktiv = $derived(
		(anzeigeEbene === 'kiez' || anzeigeEbene === 'bezirk') && highlightedSlug !== null
	);

	async function loadGebietSeries(
		typ: string,
		st: string,
		eb: 'kiez' | 'bezirk',
		slug: string
	): Promise<void> {
		const key = `${typ}-${st}-${eb}-${slug}`;
		const cached = gebietCache[key];
		if (cached) {
			gebietResponse = cached;
			gebietStatus = 'loaded';
			return;
		}
		gebietStatus = 'loading';
		try {
			const url = `/api/wahl/series?typ=${typ}&stimmtyp=${st}&ebene=${eb}&gebiet=${encodeURIComponent(slug)}`;
			const res = await fetchFn(url);
			if (!res.ok) throw new Error(`status ${res.status}`);
			const data = (await res.json()) as SeriesApiResponse;
			if (!Array.isArray(data?.points)) throw new Error('malformed series response');
			gebietCache[key] = data;
			if (
				typ !== portal.reihe ||
				st !== stimmtypForReihe(portal.reihe) ||
				eb !== anzeigeEbene ||
				slug !== highlightedSlug
			) {
				return;
			}
			gebietResponse = data;
			gebietStatus = 'loaded';
		} catch {
			if (
				typ !== portal.reihe ||
				st !== stimmtypForReihe(portal.reihe) ||
				eb !== anzeigeEbene ||
				slug !== highlightedSlug
			) {
				return;
			}
			gebietStatus = 'error';
		}
	}

	$effect(() => {
		if (!gebietAnfrageAktiv || !highlightedSlug) {
			gebietResponse = null;
			gebietStatus = 'idle';
			return;
		}
		void loadGebietSeries(
			portal.reihe,
			stimmtyp,
			anzeigeEbene as 'kiez' | 'bezirk',
			highlightedSlug
		);
	});

	const berlinPanel = $derived<ErgebnisPanelData | null>(
		berlinResponse && jahr !== null ? buildErgebnisPanelRows(berlinResponse.points, jahr) : null
	);
	const gebietPanel = $derived<ErgebnisPanelData | null>(
		gebietResponse && jahr !== null ? buildErgebnisPanelRows(gebietResponse.points, jahr) : null
	);

	const wahlBezeichnung = $derived(
		jahr !== null ? `${REIHE_LABELS[portal.reihe]} ${jahr}` : REIHE_LABELS[portal.reihe]
	);
	const vorjahrText = $derived(berlinPanel ? vorjahrLabel(berlinPanel.vorjahr) : null);

	// Vorläufig-Status aus der Portal-Wahl-Liste (nicht aus berlinPanel/der
	// Series-Antwort): die Series-API liefert das Flag pro Datenpunkt, aber
	// während Lade-/Fehlerzustand gibt es noch keine Punkte -- ohne eigene
	// Quelle würde der Kopf dann fälschlich "Endgültiges Ergebnis" zeigen,
	// obwohl der Status schlicht unbekannt ist. `null` = unbekannt: weder
	// "vorläufig" noch "endgültig" behaupten (Review-Fund 23.09.).
	const vorlaeufigStatus = $derived(vorlaeufigStatusFor(portal, portal.reihe, jahr));

	const DISCLOSURE_TEXT =
		'Berlin- und Bezirks-Werte sind amtliche Summen der Wahlämter. Kiez-Werte sind ein ' +
		'Flächen-Aggregat aus den Stimmbezirken, kein amtlicher Originalwert. Briefwahl-Stimmen ' +
		'fließen in die Bezirks- und Berlin-Summen ein, sind aber nicht auf Kieze verteilbar.';
</script>

<section
	aria-labelledby="ergebnis-panel-h"
	data-testid="ergebnis-panel"
	class="flex flex-col gap-4"
>
	<h3 id="ergebnis-panel-h" class="font-serif text-xl text-ink">Ergebnis</h3>

	<div data-testid="ergebnis-panel-kopf" class="flex flex-col gap-1">
		<p class="font-serif text-base text-ink">
			{wahlBezeichnung}
			{#if vorlaeufigStatus?.vorlaeufig}
				· <VorlaeufigBadge
					sourceUpdatedAt={vorlaeufigStatus.sourceUpdatedAt}
					testid="ergebnis-panel-vorlaeufig"
				/>
			{:else if vorlaeufigStatus !== null}
				· Endgültiges Ergebnis
			{/if}
		</p>
		{#if berlinResponse}
			<p data-testid="ergebnis-panel-datenstand" class="font-mono text-xs text-ink-subtle">
				Datenstand: {berlinResponse.source_name ?? 'unbekannte Quelle'}
				{#if berlinResponse.license}
					· Lizenz {berlinResponse.license}
				{/if}
			</p>
		{/if}
		<!-- Reservierter Slot für die Beteiligungs-Story; rendert heute nichts Sichtbares. -->
		<div data-testid="ergebnis-panel-beteiligung-slot"></div>
	</div>

	{#if berlinStatus === 'error'}
		<p data-testid="ergebnis-panel-error" role="alert" class="font-serif text-ink-muted">
			Ergebnis-Daten konnten nicht geladen werden.
		</p>
	{:else if berlinStatus !== 'loaded'}
		<p data-testid="ergebnis-panel-loading" role="status" class="font-serif text-ink-muted">
			Lädt Ergebnis …
		</p>
	{:else if !berlinPanel || berlinPanel.rows.length === 0}
		<p data-testid="ergebnis-panel-empty" role="status" class="font-serif text-ink-muted">
			Für diese Auswahl liegen noch keine Ergebnis-Daten vor.
		</p>
	{:else}
		<ol data-testid="ergebnis-panel-liste" class="flex flex-col gap-2">
			{#each berlinPanel.rows as row (row.partei)}
				<li
					data-testid={`ergebnis-panel-row-${row.partei}`}
					class="flex flex-col gap-1 font-mono text-sm text-ink"
				>
					<span class="flex items-center gap-2">
						<span
							aria-hidden="true"
							class="h-3 w-3 shrink-0 rounded-full"
							style:background-color={row.farbeHex}
						></span>
						<span class="min-w-0 flex-1 truncate">{row.partei}</span>
						<span
							data-testid={`ergebnis-panel-anteil-${row.partei}`}
							class="w-16 shrink-0 text-right tabular-nums"
						>
							{row.anteilLabel}
						</span>
						{#if row.deltaLabel}
							<span
								data-testid={`ergebnis-panel-delta-${row.partei}`}
								class="w-20 shrink-0 text-right text-ink-subtle tabular-nums"
							>
								{row.deltaLabel}
							</span>
						{:else}
							<!-- Platzhalter ohne Testid: haelt die Anteils-Spalte in Flucht,
							     wenn eine Partei kein Vorwahl-Delta hat (z. B. neu angetreten). -->
							<span aria-hidden="true" class="w-20 shrink-0"></span>
						{/if}
					</span>
					<!-- Anteils-Balken in voller Breite unter der Zeile: die alte
					     Inline-Variante kollabierte im schmalen Panel auf ~0px (Live-Fund
					     Matze 20.09.: "angeschnittener Extra-Dot" bei Zeilen ohne Delta). -->
					<span aria-hidden="true" class="bg-bg-muted ml-5 h-1.5 overflow-hidden rounded-full">
						<span
							class="block h-full rounded-full"
							style:width={`${Math.min(Math.max(row.anteil * 100, 0), 100)}%`}
							style:background-color={row.farbeHex}
						></span>
					</span>
				</li>
			{/each}
		</ol>
		{#if vorjahrText}
			<p data-testid="ergebnis-panel-vorjahr-label" class="font-mono text-xs text-ink-subtle">
				Veränderung {vorjahrText}
			</p>
		{/if}
	{/if}

	{#if anzeigeEbene === 'stimmbezirk'}
		<p data-testid="ergebnis-panel-stimmbezirk-hinweis" class="font-mono text-xs text-ink-subtle">
			Stimmbezirks-Verteilungen liegen auf den Detailseiten der einzelnen Stimmbezirke.
		</p>
	{:else if highlightedSlug}
		<div
			data-testid="ergebnis-panel-gebiet-block"
			class="flex flex-col gap-2 border-t border-rule pt-4"
		>
			<h4 class="font-serif text-base text-ink">{highlightedName ?? 'Hervorgehobenes Gebiet'}</h4>
			{#if gebietStatus === 'error'}
				<p data-testid="ergebnis-panel-gebiet-error" role="alert" class="font-serif text-ink-muted">
					Gebiets-Daten konnten nicht geladen werden.
				</p>
			{:else if gebietStatus !== 'loaded'}
				<p data-testid="ergebnis-panel-gebiet-loading" class="font-serif text-ink-muted">
					Lädt Gebiets-Ergebnis …
				</p>
			{:else if !gebietPanel || gebietPanel.rows.length === 0}
				<p data-testid="ergebnis-panel-gebiet-empty" class="font-serif text-ink-muted">
					Für dieses Gebiet liegen keine Ergebnis-Daten vor.
				</p>
			{:else}
				{#if gebietPanel.vorjahr !== null}
					<p
						data-testid="ergebnis-panel-gebiet-vorjahr-label"
						class="font-mono text-xs text-ink-subtle"
					>
						Veränderung {vorjahrLabel(gebietPanel.vorjahr)}
					</p>
				{/if}
				<ol data-testid="ergebnis-panel-gebiet-liste" class="flex flex-col gap-2">
					{#each gebietPanel.rows as row (row.partei)}
						<li
							data-testid={`ergebnis-panel-gebiet-row-${row.partei}`}
							class="flex flex-col gap-1 font-mono text-sm text-ink"
						>
							<span class="flex items-center gap-2">
								<span
									aria-hidden="true"
									class="h-3 w-3 shrink-0 rounded-full"
									style:background-color={row.farbeHex}
								></span>
								<span class="min-w-0 flex-1 truncate">{row.partei}</span>
								<span
									data-testid={`ergebnis-panel-gebiet-anteil-${row.partei}`}
									class="w-16 shrink-0 text-right tabular-nums"
								>
									{row.anteilLabel}
								</span>
								{#if row.deltaLabel}
									<span
										data-testid={`ergebnis-panel-gebiet-delta-${row.partei}`}
										class="w-20 shrink-0 text-right text-ink-subtle tabular-nums"
									>
										{row.deltaLabel}
									</span>
								{:else}
									<!-- Platzhalter ohne Testid: haelt die Anteils-Spalte in Flucht,
									     wenn eine Partei kein Vorwahl-Delta hat (z. B. neu angetreten). -->
									<span aria-hidden="true" class="w-20 shrink-0"></span>
								{/if}
							</span>
							<!-- Anteils-Balken in voller Breite unter der Zeile: die alte
							     Inline-Variante kollabierte im schmalen Panel auf ~0px (Live-Fund
							     Matze 20.09.: "angeschnittener Extra-Dot" bei Zeilen ohne Delta). -->
							<span aria-hidden="true" class="bg-bg-muted ml-5 h-1.5 overflow-hidden rounded-full">
								<span
									class="block h-full rounded-full"
									style:width={`${Math.min(Math.max(row.anteil * 100, 0), 100)}%`}
									style:background-color={row.farbeHex}
								></span>
							</span>
						</li>
					{/each}
				</ol>
			{/if}
		</div>
	{/if}

	<Accordion.Root
		type="single"
		class="border-t border-rule"
		data-testid="ergebnis-panel-disclosure"
	>
		<Accordion.Item value="disclosure" class="py-1">
			<Accordion.Header>
				<Accordion.Trigger
					data-testid="ergebnis-panel-disclosure-trigger"
					class="group flex w-full items-center justify-between gap-4 py-2 text-left font-sans text-sm font-semibold text-ink hover:text-accent"
				>
					Woher kommen diese Zahlen?
					<ChevronDown
						size={16}
						aria-hidden="true"
						class="shrink-0 transition-transform group-data-[state=open]:rotate-180"
					/>
				</Accordion.Trigger>
			</Accordion.Header>
			<Accordion.Content
				data-testid="ergebnis-panel-disclosure-content"
				class="flex flex-col gap-2 pb-3 font-serif text-sm leading-relaxed text-ink-muted"
			>
				<p>{DISCLOSURE_TEXT}</p>
				<p class="font-mono text-xs text-ink-subtle">
					<a
						href={resolve('/methodik/wahldaten')}
						data-testid="ergebnis-panel-methodik-link"
						class="hover:text-accent-strong text-accent underline underline-offset-2"
					>
						/methodik/wahldaten
					</a>
					·
					<a
						href={resolve('/lizenzen')}
						data-testid="ergebnis-panel-lizenzen-link"
						class="hover:text-accent-strong text-accent underline underline-offset-2"
					>
						/lizenzen
					</a>
				</p>
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
</section>
