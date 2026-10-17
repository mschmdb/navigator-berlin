<script lang="ts">
	import { Phone, ExternalLink, CircleCheck, Clock, Info } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import {
		HILFE_DIENSTE,
		HILFE_STAND,
		KAELTEHILFE_APP_URL,
		KAELTEHILFE_WEGWEISER_URL,
		NOTRUF,
		type HilfeDienst,
		type HilfeDienstId
	} from '$lib/kaelte/hilfe-dienste.js';
	import {
		formatMonthDay,
		isKaelteSaison,
		serviceStatus,
		type ServiceStatus
	} from '$lib/utils/berlin-time.js';
	import QuellenZeile from './quellen-zeile.svelte';

	/** Zeitpunkt der Berechnung. Ohne Angabe: aktuelle Zeit, minütlich aktualisiert. */
	let { now }: { now?: Date } = $props();

	let tick = $state(new Date());
	const current = $derived(now ?? tick);

	$effect(() => {
		if (now) return;
		const id = setInterval(() => (tick = new Date()), 60_000);
		return () => clearInterval(id);
	});

	const locale = $derived(getLocale());

	const hour = (h: number): string => `${String(h).padStart(2, '0')}:00`;

	const rows = $derived.by(() => {
		const withStatus = HILFE_DIENSTE.map((dienst) => ({
			dienst,
			status: serviceStatus(dienst, current)
		}));
		// Bestätigt erreichbare Dienste zuerst, sonst bleibt die Reihenfolge der Datei.
		// Dienste mit unbestätigtem Betrieb rücken nie nach vorn.
		const confirmedOpen = (r: (typeof withStatus)[number]) =>
			r.status.state === 'open' && !r.dienst.betriebUnbestaetigt;
		return [...withStatus.filter(confirmedOpen), ...withStatus.filter((r) => !confirmedOpen(r))];
	});

	function statusText(status: ServiceStatus): string {
		if (status.state === 'open') return m.kaelte_status_open({ zeit: hour(status.closesAtHour) });
		if (status.state === 'season-starts') {
			return m.kaelte_status_saison({
				datum: formatMonthDay({ month: status.month, day: status.day }, locale)
			});
		}
		const zeit = hour(status.opensAtHour);
		if (status.when === 'today') return m.kaelte_status_heute({ zeit });
		if (status.when === 'tomorrow') return m.kaelte_status_morgen({ zeit });
		return m.kaelte_status_werktag({ zeit });
	}

	const names: Record<HilfeDienstId, () => string> = {
		kaeltehilfetelefon: () => m.kaelte_name_kaeltehilfetelefon(),
		kaeltebus: () => m.kaelte_name_kaeltebus(),
		waermebus: () => m.kaelte_name_waermebus(),
		karuna: () => m.kaelte_name_karuna()
	};

	const descriptions: Record<HilfeDienstId, () => string> = {
		kaeltehilfetelefon: () => m.kaelte_beschreibung_kaeltehilfetelefon(),
		kaeltebus: () => m.kaelte_beschreibung_kaeltebus(),
		waermebus: () => m.kaelte_beschreibung_waermebus(),
		karuna: () => m.kaelte_beschreibung_karuna()
	};

	function timesText(d: HilfeDienst): string {
		const params = { von: hour(d.startHour), bis: hour(d.endHour) };
		return d.weekdays ? m.kaelte_zeiten_werktags(params) : m.kaelte_zeiten_taeglich(params);
	}

	function seasonText(d: HilfeDienst): string {
		if (!d.season) return m.kaelte_ganzjaehrig();
		return m.kaelte_saison({
			von: formatMonthDay(d.season.from, locale),
			bis: formatMonthDay(d.season.to, locale)
		});
	}

	const standText = $derived(
		new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(
			new Date(`${HILFE_STAND}T00:00:00Z`)
		)
	);

	const externalLinkClass =
		'group flex items-start gap-2 rounded border border-rule px-3 py-2.5 hover:border-ink-subtle';
</script>

<section
	data-testid="kaelte-notfall"
	aria-labelledby="kaelte-notfall-h"
	class="flex flex-col gap-4 rounded border-2 border-accent bg-bg-elevated p-4 md:gap-5 md:p-6"
>
	<h2 id="kaelte-notfall-h" class="font-sans text-xl font-semibold text-ink md:text-2xl">
		{m.kaelte_notfall_h()}
	</h2>

	<ol class="flex list-decimal flex-col gap-1 pl-5 text-sm text-ink md:text-base">
		<li>{m.kaelte_notfall_schritt1()}</li>
		<li>{m.kaelte_notfall_schritt2()}</li>
		<li>{m.kaelte_notfall_schritt3()}</li>
	</ol>

	<div class="flex flex-col gap-1">
		<a
			href={`tel:${NOTRUF.phoneTel}`}
			data-testid="kaelte-112-link"
			class="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded border border-accent bg-accent px-4 py-3 font-sans text-xl font-semibold text-bg hover:border-ink hover:bg-ink sm:w-fit"
		>
			<Phone size={22} aria-hidden="true" />
			{m.kaelte_notfall_112()}
		</a>
		<p class="font-sans text-sm text-ink-muted">{m.kaelte_notfall_112_hint()}</p>
	</div>

	<div class="flex flex-col gap-3">
		<h3 class="font-sans text-lg font-semibold text-ink">{m.kaelte_dienste_h()}</h3>

		{#if !isKaelteSaison(current)}
			<p
				data-testid="kaelte-saison-hinweis"
				class="flex items-start gap-2 rounded border border-rule px-3 py-2 text-sm text-ink-muted"
			>
				<Info size={16} aria-hidden="true" class="mt-0.5 shrink-0" />
				{m.kaelte_dienste_leer_saison()}
			</p>
		{/if}

		<ul class="flex flex-col gap-3">
			{#each rows as { dienst, status } (dienst.id)}
				{@const isOpen = status.state === 'open' && !dienst.betriebUnbestaetigt}
				{@const name = names[dienst.id]()}
				<li
					data-testid={`kaelte-dienst-${dienst.id}`}
					class={`flex flex-col gap-1.5 rounded border px-3 py-2.5 ${isOpen ? 'border-state-success bg-state-success/10' : 'border-rule'}`}
				>
					<div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
						<span class="font-sans text-base font-semibold text-ink">{name}</span>
						<span
							data-testid="kaelte-status"
							class={`inline-flex items-center gap-1 font-sans text-sm font-medium ${isOpen ? 'text-state-success' : 'text-ink-muted'}`}
						>
							{#if isOpen}
								<CircleCheck size={15} aria-hidden="true" />
							{:else}
								<Clock size={15} aria-hidden="true" />
							{/if}
							{statusText(status)}
						</span>
					</div>
					<a
						href={`tel:${dienst.phoneTel}`}
						aria-label={m.kaelte_anrufen_label({ name, nummer: dienst.phoneDisplay })}
						class="inline-flex min-h-11 w-fit items-center gap-2 rounded border border-accent px-3 py-1.5 text-base text-accent hover:bg-accent hover:text-bg"
						>{dienst.phoneDisplay}</a
					>
					<p class="text-sm text-ink-muted">{descriptions[dienst.id]()}</p>
					<p class="font-sans text-xs text-ink-subtle">
						{timesText(dienst)}, {seasonText(dienst)}
					</p>
					{#if dienst.betriebUnbestaetigt}
						<p
							data-testid="kaelte-unbestaetigt"
							class="flex items-start gap-1.5 font-sans text-sm text-ink-muted"
						>
							<Info size={16} aria-hidden="true" class="mt-0.5 shrink-0" />
							{m.kaelte_unbestaetigt({ stand: standText })}
						</p>
					{/if}
					<QuellenZeile quellen={dienst.quellen} />
				</li>
			{/each}
		</ul>
	</div>

	<div class="flex flex-col gap-3">
		<h3 class="font-sans text-lg font-semibold text-ink">{m.kaelte_mehr_h()}</h3>
		<ul class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			{#each [{ href: KAELTEHILFE_APP_URL, title: m.kaelte_app_title(), text: m.kaelte_app_text() }, { href: KAELTEHILFE_WEGWEISER_URL, title: m.kaelte_wegweiser_title(), text: m.kaelte_wegweiser_text() }] as link (link.href)}
				<li>
					<a href={link.href} target="_blank" rel="noopener noreferrer" class={externalLinkClass}>
						<ExternalLink
							size={16}
							aria-hidden="true"
							class="mt-0.5 shrink-0 text-ink-subtle group-hover:text-ink"
						/>
						<span class="flex flex-col">
							<span class="font-sans text-sm font-medium text-accent"
								>{link.title}<span class="sr-only"> {m.kaelte_new_tab_hint()}</span></span
							>
							<span class="text-sm text-ink-muted">{link.text}</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</div>

	<p class="font-sans text-xs text-ink-muted">
		{m.kaelte_haftung()}
		<time datetime={HILFE_STAND}>{m.kaelte_stand({ datum: standText })}</time>
	</p>
</section>
