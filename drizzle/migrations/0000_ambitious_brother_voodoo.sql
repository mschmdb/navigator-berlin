CREATE TYPE "public"."locale" AS ENUM('de', 'en');--> statement-breakpoint
CREATE TYPE "public"."page_type" AS ENUM('bezirk', 'kiez', 'layer');--> statement-breakpoint
CREATE TABLE "bezirk_stats" (
	"slug" text PRIMARY KEY NOT NULL,
	"laerm" jsonb NOT NULL,
	"luft" jsonb NOT NULL,
	"gruen" jsonb NOT NULL,
	"klima" jsonb NOT NULL,
	"wohnen" jsonb NOT NULL,
	"oepnv" jsonb NOT NULL,
	"bildung" jsonb NOT NULL,
	"heritage" jsonb NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kiez_stats" (
	"slug" text PRIMARY KEY NOT NULL,
	"bezirk_slug" text NOT NULL,
	"laerm" jsonb NOT NULL,
	"luft" jsonb NOT NULL,
	"gruen" jsonb NOT NULL,
	"klima" jsonb NOT NULL,
	"wohnen" jsonb NOT NULL,
	"oepnv" jsonb NOT NULL,
	"bildung" jsonb NOT NULL,
	"heritage" jsonb NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bezirk_score" (
	"slug" text PRIMARY KEY NOT NULL,
	"composite" double precision NOT NULL,
	"ruhe_luft" double precision,
	"gruen" double precision,
	"mobilitaet" double precision,
	"soziale_lage" double precision,
	"versorgung" double precision,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kiez_score" (
	"slug" text PRIMARY KEY NOT NULL,
	"bezirk_slug" text NOT NULL,
	"composite" double precision NOT NULL,
	"ruhe_luft" double precision,
	"gruen" double precision,
	"mobilitaet" double precision,
	"soziale_lage" double precision,
	"versorgung" double precision,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faq_qna" (
	"page_type" "page_type" NOT NULL,
	"slug" text NOT NULL,
	"cluster" text NOT NULL,
	"locale" "locale" NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "faq_qna_page_type_slug_cluster_locale_pk" PRIMARY KEY("page_type","slug","cluster","locale")
);
--> statement-breakpoint
CREATE TABLE "llms_content" (
	"page_type" "page_type" NOT NULL,
	"slug" text NOT NULL,
	"locale" "locale" NOT NULL,
	"markdown" text NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "llms_content_page_type_slug_locale_pk" PRIMARY KEY("page_type","slug","locale")
);
--> statement-breakpoint
ALTER TABLE "kiez_stats" ADD CONSTRAINT "kiez_stats_bezirk_slug_bezirk_stats_slug_fk" FOREIGN KEY ("bezirk_slug") REFERENCES "public"."bezirk_stats"("slug") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kiez_score" ADD CONSTRAINT "kiez_score_bezirk_slug_bezirk_stats_slug_fk" FOREIGN KEY ("bezirk_slug") REFERENCES "public"."bezirk_stats"("slug") ON DELETE restrict ON UPDATE no action;