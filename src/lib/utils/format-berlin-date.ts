/**
 * Formatiert einen ISO-Zeitstempel als `DD.MM.YYYY` in `Europe/Berlin`
 * (de-DE), unabhängig von der Prozess-Zeitzone des ausführenden Hosts.
 *
 * Geteilter Formatter für die Vorläufig-Badges (Matze-Entscheidung 23.09.,
 * 1B): `ergebnis-panel.svelte` und `berlin-wahlen/[slug]/+page.svelte` hatten
 * je eine eigene `formatStand`-Kopie ohne explizites `timeZone`, die ohne
 * dieses Modul auf einem Host mit `TZ=UTC` (z.B. Coolify-Default) ein
 * falsches, einen Tag zu frühes Datum gerendert hätte.
 */
export function formatBerlinDate(iso: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleDateString('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		timeZone: 'Europe/Berlin'
	});
}
