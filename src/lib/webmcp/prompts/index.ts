export { addressOverviewPrompt } from './address-overview.js';
export { compareKiezePrompt } from './compare-kieze.js';
export { explainLayerPrompt } from './explain-layer.js';
export type { PromptTemplate, PromptLocale, PromptArgumentDescriptor } from './prompt-types.js';

import { addressOverviewPrompt } from './address-overview.js';
import { compareKiezePrompt } from './compare-kieze.js';
import { explainLayerPrompt } from './explain-layer.js';
import type { PromptTemplate } from './prompt-types.js';

export const ALL_PROMPTS: readonly PromptTemplate[] = [
	addressOverviewPrompt,
	compareKiezePrompt,
	explainLayerPrompt
];
