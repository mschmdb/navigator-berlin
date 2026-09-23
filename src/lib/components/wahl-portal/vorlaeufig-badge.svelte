<!--
	Geteilte Vorläufig-Kennzeichnung (Matze-Entscheidung 23.09., 1B).
	Genutzt von `ergebnis-panel.svelte` (/berlin-wahlen) und
	`wahl/[slug]/+page.svelte` -- eine Markup-Kopie statt zwei.

	Kontrast: `border-state-warning` + `text-ink` statt `text-state-warning`
	auf `bg-state-warning/15` (Review-Fund: #9e5520 auf der 15%-Tint über
	#eceae0 lag bei 3,87:1, unter WCAG AA 4,5:1 für kleinen Text). Der
	Warnton bleibt als Rahmenfarbe sichtbar, der Text selbst trägt die
	dunkle `--ink`-Farbe (>4,5:1 auf jedem Seiten-Hintergrund).
-->
<script lang="ts">
	import { formatBerlinDate } from '$lib/utils/format-berlin-date.js';

	type Props = {
		/** ISO-Zeitstempel für „· Stand DD.MM.YYYY"; `null`/fehlend = nur „Vorläufig". */
		sourceUpdatedAt?: string | null;
		/** `data-testid` am Badge-Root, je Einsatzort überschreibbar. */
		testid?: string;
	};

	let { sourceUpdatedAt = null, testid = 'vorlaeufig-badge' }: Props = $props();
</script>

<span
	data-testid={testid}
	class="inline-flex items-center rounded-sm border border-state-warning px-1.5 py-0.5 font-mono text-xs font-semibold tracking-wide text-ink uppercase"
>
	Vorläufig{#if sourceUpdatedAt}&nbsp;· Stand {formatBerlinDate(sourceUpdatedAt)}{/if}
</span>
