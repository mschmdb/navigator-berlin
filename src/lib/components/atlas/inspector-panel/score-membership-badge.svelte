<!--
	Story 14.11 / GH-88: Zeigt unter dem Datensatz-Titel, in welche Kiez-Score-Dimension der Layer
	einfließt. Die Zeile springt zur Dimension. Kontext-Layer bekommen kein Label: Dass sie nicht im
	Score stehen, sagt schon die Gruppe „Zusätzlich, nicht im Score" im Score-Block (Regel 2).
-->
<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, type Locale } from '$lib/paraglide/runtime';
	import {
		scoreDimensionFor,
		scoreDimensionLabelFor,
		contextNoteFor
	} from './internal/score-membership.js';

	type Props = {
		slug: string;
		/** Sprung zur Score-Dimension (Konsument scrollt die Zeile in den Blick). */
		onJump?: (dimension: string) => void;
		lang?: Locale;
	};
	let { slug, onJump, lang }: Props = $props();

	const locale = $derived(lang ?? getLocale());
	const localeOpts = $derived({ locale });

	const dimension = $derived(scoreDimensionFor(slug));
	const label = $derived(scoreDimensionLabelFor(slug, localeOpts));
	const note = $derived(contextNoteFor(slug, localeOpts));
</script>

{#if dimension && label}
	<button
		type="button"
		data-testid="score-membership-link-{slug}"
		class="inline-flex min-h-(--target-min) w-fit items-center text-left text-dense-label text-accent underline-offset-2 hover:underline"
		onclick={() => onJump?.(dimension)}
		title={m.inspector_score_membership_in_score_title({ label }, localeOpts)}
	>
		{m.inspector_score_membership_in_score_label({ label }, localeOpts)}
	</button>
{/if}
{#if note}
	<p class="text-dense-label leading-snug text-ink-muted" data-testid="context-note-{slug}">
		{note}
	</p>
{/if}
