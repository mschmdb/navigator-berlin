CREATE TABLE "bezirk_rank" (
	"slug" text NOT NULL,
	"metric_key" text NOT NULL,
	"rang" integer,
	"quartil" integer,
	"total" integer NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bezirk_rank_slug_metric_key_pk" PRIMARY KEY("slug","metric_key")
);
--> statement-breakpoint
CREATE TABLE "kiez_rank" (
	"slug" text NOT NULL,
	"metric_key" text NOT NULL,
	"rang" integer,
	"quartil" integer,
	"total" integer NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kiez_rank_slug_metric_key_pk" PRIMARY KEY("slug","metric_key")
);
