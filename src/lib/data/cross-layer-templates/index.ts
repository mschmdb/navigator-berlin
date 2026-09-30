export {
	TemplateSchema,
	TemplateFileSchema,
	TemplateScopeSchema,
	type Template,
	type TemplateFile,
	type TemplateScope
} from './schema.js';
export {
	parseTemplateFile,
	loadTemplatesFromRawMap,
	findTemplatesForScope,
	type LoadedTemplateBundle
} from './loader.js';
export {
	renderTemplate,
	canRender,
	type RenderedTemplate,
	type TemplateRenderOptions,
	type TemplateContext
} from './renderer.js';
export {
	buildKiezTrendContext,
	type KiezTrendInput,
	type KiezSparklinePoint
} from './context-builder.js';
