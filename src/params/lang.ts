import type { ParamMatcher } from '@sveltejs/kit';

const SUPPORTED = new Set(['de', 'en', 'tr', 'uk', 'ar', 'es', 'fr', 'it']);

export const match: ParamMatcher = (param: string) => SUPPORTED.has(param);
