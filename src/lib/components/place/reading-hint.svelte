<!--
	Lesehilfe am Wert: zarte Tönung hinter einem kurzen Klartext („leiser als Berlin-Median“).
	Salbeigrün und Terrakotta nur bei Kennzahlen mit klarer Richtung, sonst neutral grau.
	Der Text trägt die Aussage, die Farbe ergänzt nur (Rot-Grün-Schwäche).
-->
<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import type { Hint } from '$lib/place/topics';
	let { hint, short = false }: { hint: Hint | null; short?: boolean } = $props();
	const label = $derived(hint ? (short ? hint.short : hint.text) : '');
	const arrow = $derived(hint?.dir === 'higher' ? '↑' : hint?.dir === 'lower' ? '↓' : '≈');
	const toneWord = $derived(
		hint?.tone === 'good' ? m.place_hint_good() : hint?.tone === 'bad' ? m.place_hint_bad() : ''
	);
</script>

{#if hint}
	<span
		class="inline-flex items-center gap-1 rounded px-1.5 py-px text-dense-label font-normal text-ink-muted
		{short ? 'whitespace-nowrap' : ''}
		{hint.tone === 'good' ? 'bg-[var(--hint-good-bg)]' : ''}
		{hint.tone === 'bad' ? 'bg-[var(--hint-bad-bg)]' : ''}
		{hint.tone === 'neutral' ? 'bg-bg-muted' : ''}"
		><span aria-hidden="true">{arrow}</span>{label}{#if toneWord}<span class="sr-only"
				>, {toneWord}</span
			>{/if}</span
	>
{/if}
