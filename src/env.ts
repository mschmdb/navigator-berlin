import { defineEnvVars } from '@sveltejs/kit/env';

// INDEXNOW_KEY bleibt optional: ohne Key antwortet /[key].txt mit 404.
export const variables = defineEnvVars({ INDEXNOW_KEY: { schema: (input) => input } });
