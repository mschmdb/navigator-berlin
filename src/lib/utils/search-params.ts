/**
 * Wendet Updates auf eine Query-String-Kopie an. `null` entfernt den Schlüssel.
 * Liegt in einer .ts-Datei, weil die Kopie lokal und nicht reaktiv ist.
 */
export function applySearchParamUpdates(
	current: string,
	updates: Record<string, string | null>
): string {
	const params = new URLSearchParams(current);
	for (const [key, value] of Object.entries(updates)) {
		if (value === null) params.delete(key);
		else params.set(key, value);
	}
	return params.toString();
}
