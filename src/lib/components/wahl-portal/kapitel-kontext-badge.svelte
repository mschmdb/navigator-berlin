<script lang="ts">
	/**
	 * Story 10 (Steuerungs-Klarheit): Jahr und Ebene gelten NICHT seitenweit,
	 * nur die Wahl-Reihe (siehe `reihen-leiste.svelte`). Kapitel, die trotzdem
	 * einen Reihen-/Jahres-/Ebenen-Bezug haben (Wechsel, Trends, Extreme),
	 * deklarieren ihn sichtbar über dieses Badge statt ihn zu suggerieren.
	 *
	 * `ebeneText` ist optional (Review Triage Log #2): Kapitel mit eigenem
	 * Ebenen-Toggle (z. B. der Sankey im Trends-Kapitel) würden dem Badge
	 * sonst eine feste Ebene unterstellen, die der sichtbaren Grafik
	 * widerspricht. Ohne Wert entfällt das dritte Segment samt Mittelpunkt.
	 *
	 * Reiner Text, kein aria-Ballast (A11y-Boundary der Story): die Werte
	 * selbst sind schon sprechend, ein zusätzliches Label würde nur
	 * Redundanz für Screenreader erzeugen.
	 */
	type Props = {
		reiheLabel: string;
		jahreText: string;
		ebeneText?: string;
	};

	let { reiheLabel, jahreText, ebeneText }: Props = $props();

	const badgeText = $derived(
		ebeneText ? `${reiheLabel} · ${jahreText} · ${ebeneText}` : `${reiheLabel} · ${jahreText}`
	);
</script>

<p data-testid="kapitel-kontext-badge" class="font-mono text-xs text-ink-subtle">
	{badgeText}
</p>
