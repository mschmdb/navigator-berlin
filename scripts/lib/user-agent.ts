export const USER_AGENT = 'navigator.berlin/1.0 (mailto:hallo@navigator.berlin)';

export const defaultHeaders = (): HeadersInit => ({
	'User-Agent': USER_AGENT,
	Accept: 'application/json'
});
