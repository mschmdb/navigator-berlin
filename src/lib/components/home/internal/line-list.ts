/**
 * Listen der Startseite als Zeilen mit Trennlinie (Epic #85, Leitlinie 4),
 * dasselbe Muster wie Inspector und Unterseiten. Jede Zeile trägt oben eine
 * Linie, die Liste schließt unten ab. In mehrspaltigen Rastern liegen die
 * Linien je Spalte, darum `border-t` am Eintrag statt `divide-y` an der Liste.
 */
export const lineList = 'grid gap-x-8 border-b border-rule';

export const lineItem = 'border-t border-rule';

/** Ganze Zeile als Klickziel, Fokus kommt aus der globalen `--focus`-Regel. */
export const lineRow =
	'group flex min-h-(--target-min) flex-col gap-1 py-3 text-ink hover:text-accent';
