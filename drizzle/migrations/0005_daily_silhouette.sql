CREATE TABLE "bezirk_comparison" (
	"slug" text NOT NULL,
	"metric_key" text NOT NULL,
	"bezirk_value" double precision,
	"berlin_median" double precision,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bezirk_comparison_slug_metric_key_pk" PRIMARY KEY("slug","metric_key")
);
--> statement-breakpoint
CREATE TABLE "kiez_comparison" (
	"slug" text NOT NULL,
	"metric_key" text NOT NULL,
	"kiez_value" double precision,
	"bezirk_mean" double precision,
	"berlin_median" double precision,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kiez_comparison_slug_metric_key_pk" PRIMARY KEY("slug","metric_key")
);
