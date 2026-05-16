export { buildCanonical } from './canonical.js';
export {
	buildHreflangCluster,
	type HreflangInput,
	type HreflangLink,
	type SupportedLocale
} from './hreflang.js';
export {
	buildSitemapXml,
	buildSitemapIndexXml,
	collectPrerenderedUrls,
	STATIC_PAGES_SOURCE,
	LAYER_DETAIL_SOURCE,
	type SitemapEntry,
	type SitemapIndexEntry,
	type SitemapLocale,
	type SitemapSource,
	type SitemapSourceContext
} from './sitemap-builder.js';

// Story 2.2: JSON-LD-Generator-Bibliothek
export { serializeJsonLd } from './serialize-jsonld.js';
export { licenseToSchemaOrgUrl } from './license-url.js';
export {
	buildWebSite,
	type WebSiteInput,
	type WebSiteJsonLd,
	type WebSiteLeafJsonLd,
	type WebSiteSearchActionJsonLd
} from './jsonld-website.js';
export {
	buildPlace,
	type PlaceInput,
	type PlaceJsonLd,
	type PlaceLeafJsonLd
} from './jsonld-place.js';
export {
	buildAdministrativeArea,
	type AdministrativeAreaInput,
	type AdministrativeAreaJsonLd,
	type AdministrativeAreaLeafJsonLd
} from './jsonld-administrative-area.js';
export {
	buildDataset,
	type DatasetInput,
	type DatasetJsonLd,
	type DatasetLeafJsonLd
} from './jsonld-dataset.js';
export {
	buildFaqPage,
	type FaqItem,
	type FaqPageInput,
	type FaqPageJsonLd,
	type FaqPageLeafJsonLd
} from './jsonld-faqpage.js';
export {
	buildBreadcrumbList,
	type BreadcrumbItem,
	type BreadcrumbListInput,
	type BreadcrumbListJsonLd,
	type BreadcrumbListLeafJsonLd
} from './jsonld-breadcrumb.js';
export {
	buildBlogPosting,
	buildBlogIndex,
	type BlogPostingInput,
	type BlogIndexInput,
	type BlogPostingJsonLd,
	type BlogJsonLd
} from './jsonld-blog-posting.js';
