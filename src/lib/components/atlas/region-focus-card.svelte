<!--
	Kleine Karte beim Ortsfokus (/explore?kiez= bzw. ?bezirk=): Name, Bezirk,
	Score mit Rang, Link auf die Profilseite und ein Hinweis, wie die Person
	zu Werten an einer Adresse kommt. Kein Inspector: der Fokus setzt keine
	Adresse. Fokus wandert nach dem Laden nicht von selbst hierher.
-->
<script lang="ts">
	import { X } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import type { RegionFocusKind } from '$lib/utils/url-state.js';

	interface Props {
		readonly kind: RegionFocusKind;
		readonly slug: string;
		readonly name: string;
		readonly bezirkName: string;
		readonly score: number | null;
		readonly rang: number | null;
		readonly total: number;
		readonly onClose: () => void;
	}

	const { kind, slug, name, bezirkName, score, rang, total, onClose }: Props = $props();

	const locale = $derived(getLocale());
	const localeOpts = $derived({ locale });
	const regionLabel = $derived(
		kind === 'kiez'
			? m.region_focus_card_aria_kiez({ name }, localeOpts)
			: m.region_focus_card_aria_bezirk({ name }, localeOpts)
	);
	const profileHref = $derived(localizedHref(`/${kind}/${slug}`, locale));
	const showSubline = $derived(kind === 'kiez' && bezirkName !== '');
	const scoreText = $derived.by(() => {
		if (score === null) return null;
		const value = String(Math.round(score));
		return kind === 'kiez'
			? m.region_focus_card_score_kiez({ score: value }, localeOpts)
			: m.region_focus_card_score_bezirk({ score: value }, localeOpts);
	});
	const rankText = $derived(
		rang !== null && total > 0 ? m.rank_format_placed({ rang, total }, localeOpts) : null
	);

	function onKeydown(event: KeyboardEvent): void {
		if (event.key !== 'Escape') return;
		event.stopPropagation();
		onClose();
	}
</script>

<!-- Escape schließt aus jedem Kind-Element; der Container selbst bleibt nicht fokussierbar. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<section
	class="pointer-events-auto absolute top-3 left-3 z-20 flex max-w-[min(20rem,calc(100%-4.5rem))] flex-col gap-2 rounded-md border border-rule-strong bg-bg-elevated/95 p-3 text-ink shadow-sm backdrop-blur-sm"
	aria-label={regionLabel}
	data-testid="region-focus-card"
	onkeydown={onKeydown}
>
	<div class="flex items-start justify-between gap-2">
		<div class="min-w-0">
			<p class="font-sans text-xs tracking-wide text-ink-muted uppercase">
				{kind === 'kiez'
					? m.region_focus_card_kind_kiez(undefined, localeOpts)
					: m.region_focus_card_kind_bezirk(undefined, localeOpts)}
			</p>
			<h2 class="font-serif text-lg leading-tight text-ink" data-testid="region-focus-name">
				{name}
			</h2>
			{#if showSubline}
				<p class="font-sans text-sm text-ink-muted" data-testid="region-focus-bezirk">
					{bezirkName}
				</p>
			{/if}
		</div>
		<button
			type="button"
			class="-mt-1 -mr-1 inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-ink-muted hover:bg-bg hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
			aria-label={m.region_focus_card_close(undefined, localeOpts)}
			data-testid="region-focus-close"
			onclick={onClose}
		>
			<X class="size-4" aria-hidden="true" />
		</button>
	</div>
	{#if scoreText}
		<p class="font-sans text-sm text-ink" data-testid="region-focus-score">
			<span class="font-mono">{scoreText}</span>
			{#if rankText}
				<span class="text-ink-muted"> · {rankText}</span>
			{/if}
		</p>
	{/if}
	<!-- localizedHref setzt den Locale-Präfix; resolve() kennt ihn nicht. -->
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<a
		href={profileHref}
		class="w-fit font-sans text-sm text-accent underline underline-offset-2 hover:no-underline"
		data-testid="region-focus-link"
	>
		{kind === 'kiez'
			? m.region_focus_card_link_kiez(undefined, localeOpts)
			: m.region_focus_card_link_bezirk(undefined, localeOpts)}
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
	<p class="font-sans text-xs text-ink-muted" data-testid="region-focus-hint">
		{kind === 'kiez'
			? m.region_focus_card_hint_kiez(undefined, localeOpts)
			: m.region_focus_card_hint_bezirk(undefined, localeOpts)}
	</p>
</section>
