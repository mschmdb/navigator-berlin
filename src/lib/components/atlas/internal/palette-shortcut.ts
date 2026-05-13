export function isFocusInTextInput(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	if (target.matches('input, textarea, [contenteditable="true"], [contenteditable=""]')) return true;
	return false;
}

export function shouldHandleSlash(e: KeyboardEvent): boolean {
	if (e.key !== '/') return false;
	if (e.metaKey || e.ctrlKey || e.altKey) return false;
	if (e.isComposing) return false;
	return !isFocusInTextInput(e.target);
}
