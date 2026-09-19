/**
 * Pure Arrow/Home/End-Navigationslogik für `role="radiogroup"`-Toggles
 * (Muster `inspector-level-toggle.svelte`). Von `portal-steuerleiste.svelte`
 * für Reihe-, Jahr- und Ebene-Gruppe wiederverwendet, um Duplikation zu
 * vermeiden.
 */
export function nextRadioIndex(key: string, currentIndex: number, length: number): number | null {
	if (length === 0) return null;
	if (key === 'ArrowRight' || key === 'ArrowDown') return (currentIndex + 1) % length;
	if (key === 'ArrowLeft' || key === 'ArrowUp') return (currentIndex - 1 + length) % length;
	if (key === 'Home') return 0;
	if (key === 'End') return length - 1;
	return null;
}
