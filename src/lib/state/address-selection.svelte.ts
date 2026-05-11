import { getContext, setContext } from 'svelte';
import type { GeocodeSuggestion } from '$lib/data';

const KEY = Symbol('address-selection');

export class AddressSelectionState {
	current: GeocodeSuggestion | null = $state.raw(null);

	set(suggestion: GeocodeSuggestion | null) {
		this.current = suggestion;
	}
}

export function provideAddressSelection(): AddressSelectionState {
	const state = new AddressSelectionState();
	setContext(KEY, state);
	return state;
}

export function useAddressSelection(): AddressSelectionState {
	const state = getContext<AddressSelectionState | undefined>(KEY);
	if (!state) {
		throw new Error(
			'AddressSelectionState fehlt: provideAddressSelection muss in einem Ancestor laufen'
		);
	}
	return state;
}
