/**
 * Anzeige-Name einer Briefwahl-Gruppe (kleinste Kartenebene: alle Urnen-
 * Stimmbezirke mit demselben Briefwahlbezirk plus dieser Briefwahlbezirk
 * selbst). Geteiltes Modul für Winner-Map und Detailseiten-Choropleth --
 * vorher zwei unabhängige, divergierende Kopien mit unterschiedlichen Bugs
 * (Review-Fund).
 */

/**
 * Extrahiert den Briefwahl-Code aus einer Gruppen-ID (== DB-uwbId des
 * Briefwahl-Stimmbezirks, siehe `gruppeIdFromGeo` in `wahl-geo-mapping.ts`).
 *
 * | Format        | Beispiel          | Code |
 * |---------------|-------------------|------|
 * | BTW 21/25     | `075-01-1A-5`     | `1A` |
 * | BTW 17        | `075-01-01B1A-5`  | `1A` |
 * | AGH/BVV       | `09B7P`           | `7P` |
 */
export function briefCodeFromGruppeId(gruppeId: string): string {
	const dashParts = gruppeId.split('-');
	const codeSegment = dashParts.length === 4 ? dashParts[2] : gruppeId;
	const briefMatch = codeSegment.match(/B([A-Z0-9]+)$/i);
	return briefMatch ? briefMatch[1] : codeSegment;
}

/**
 * Anzeige-Name einer Gruppe, analog zur Tagesspiegel-Darstellung
 * ("Stimmbezirke 726, 727 und Briefwahl 7P"). `membersRaw` = `MEMBERS`-
 * Property der dissolvierten Fläche (kommagetrennte UWB3-Liste,
 * `sbb-geo-pipeline.ts#dissolveGruppen`); `undefined`/leer fällt auf
 * "Gruppe <gruppeId>" zurück (Layer-Altbestand ohne `MEMBERS`).
 *
 * Alle Mitglieder werden komma-getrennt aufgezählt, "und Briefwahl <code>"
 * hängt genau einmal am Ende -- kein zweites "und" zwischen den letzten
 * beiden Stimmbezirken.
 */
export function gruppenAnzeigeName(gruppeId: string, membersRaw: string | undefined): string {
	const members = (membersRaw ?? '')
		.split(',')
		.map((m) => m.trim())
		.filter(Boolean);
	if (members.length === 0) return `Gruppe ${gruppeId}`;

	const briefCode = briefCodeFromGruppeId(gruppeId);
	const stimmbezirkeText =
		members.length === 1 ? `Stimmbezirk ${members[0]}` : `Stimmbezirke ${members.join(', ')}`;
	return `${stimmbezirkeText} und Briefwahl ${briefCode}`;
}
