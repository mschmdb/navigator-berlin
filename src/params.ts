import { defineParams } from '@sveltejs/kit/params';

const SUPPORTED = new Set(['de', 'en', 'tr', 'uk', 'ar', 'es', 'fr', 'it']);
const matchLang = (param: string) => SUPPORTED.has(param);

export const params = defineParams({
	lang: (param) => (matchLang(param) ? param : undefined)
});
