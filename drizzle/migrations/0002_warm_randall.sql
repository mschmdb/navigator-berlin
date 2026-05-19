CREATE TYPE "public"."wahl_stimmtyp" AS ENUM('erststimme', 'zweitstimme', 'einstimme');--> statement-breakpoint
CREATE TYPE "public"."wahl_typ" AS ENUM('btw', 'agh', 'bvv');--> statement-breakpoint
CREATE TABLE "wahl" (
	"id" serial PRIMARY KEY NOT NULL,
	"jahr" integer NOT NULL,
	"typ" "wahl_typ" NOT NULL,
	"stimmtyp" "wahl_stimmtyp" NOT NULL,
	"is_repeat_election" boolean DEFAULT false NOT NULL,
	"parent_election_id" integer,
	"source_url" text NOT NULL,
	"license" text DEFAULT 'dl-de/by-2.0' NOT NULL,
	"source_updated_at" timestamp with time zone,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stimmbezirk" (
	"wahl_id" integer NOT NULL,
	"uwb_id" text NOT NULL,
	"wahlkreis" text NOT NULL,
	"wahlbezirk" text NOT NULL,
	"bezirk_code" char(2) NOT NULL,
	"bezirksart" text,
	CONSTRAINT "stimmbezirk_wahl_id_uwb_id_pk" PRIMARY KEY("wahl_id","uwb_id")
);
--> statement-breakpoint
CREATE TABLE "partei" (
	"id" serial PRIMARY KEY NOT NULL,
	"kurzname" text NOT NULL,
	"vollname" text NOT NULL,
	"farbe_hex" text NOT NULL,
	"first_seen_year" integer,
	"last_seen_year" integer,
	CONSTRAINT "partei_kurzname_unique" UNIQUE("kurzname")
);
--> statement-breakpoint
CREATE TABLE "partei_alias" (
	"id" serial PRIMARY KEY NOT NULL,
	"partei_id" integer NOT NULL,
	"alias_label" text NOT NULL,
	"jahr" integer
);
--> statement-breakpoint
CREATE TABLE "ergebnis" (
	"wahl_id" integer NOT NULL,
	"uwb_id" text NOT NULL,
	"partei_id" integer NOT NULL,
	"stimmen" integer NOT NULL,
	"anteil" real NOT NULL,
	"ist_briefwahl_aggregat" boolean DEFAULT false NOT NULL,
	CONSTRAINT "ergebnis_wahl_id_uwb_id_partei_id_pk" PRIMARY KEY("wahl_id","uwb_id","partei_id")
);
--> statement-breakpoint
CREATE TABLE "wahl_aggregat_kiez" (
	"wahl_id" integer NOT NULL,
	"kiez_slug" text NOT NULL,
	"partei_id" integer NOT NULL,
	"stimmen" integer NOT NULL,
	"anteil" real NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wahl_aggregat_kiez_wahl_id_kiez_slug_partei_id_pk" PRIMARY KEY("wahl_id","kiez_slug","partei_id")
);
--> statement-breakpoint
CREATE TABLE "wahl_aggregat_bezirk" (
	"wahl_id" integer NOT NULL,
	"bezirk_slug" text NOT NULL,
	"partei_id" integer NOT NULL,
	"stimmen" integer NOT NULL,
	"anteil" real NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wahl_aggregat_bezirk_wahl_id_bezirk_slug_partei_id_pk" PRIMARY KEY("wahl_id","bezirk_slug","partei_id")
);
--> statement-breakpoint
CREATE TABLE "wahl_aggregat_berlin" (
	"wahl_id" integer NOT NULL,
	"partei_id" integer NOT NULL,
	"stimmen" integer NOT NULL,
	"anteil" real NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wahl_aggregat_berlin_wahl_id_partei_id_pk" PRIMARY KEY("wahl_id","partei_id")
);
--> statement-breakpoint
ALTER TABLE "wahl" ADD CONSTRAINT "wahl_parent_election_id_wahl_id_fk" FOREIGN KEY ("parent_election_id") REFERENCES "public"."wahl"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stimmbezirk" ADD CONSTRAINT "stimmbezirk_wahl_id_wahl_id_fk" FOREIGN KEY ("wahl_id") REFERENCES "public"."wahl"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partei_alias" ADD CONSTRAINT "partei_alias_partei_id_partei_id_fk" FOREIGN KEY ("partei_id") REFERENCES "public"."partei"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ergebnis" ADD CONSTRAINT "ergebnis_wahl_id_wahl_id_fk" FOREIGN KEY ("wahl_id") REFERENCES "public"."wahl"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ergebnis" ADD CONSTRAINT "ergebnis_partei_id_partei_id_fk" FOREIGN KEY ("partei_id") REFERENCES "public"."partei"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wahl_aggregat_kiez" ADD CONSTRAINT "wahl_aggregat_kiez_wahl_id_wahl_id_fk" FOREIGN KEY ("wahl_id") REFERENCES "public"."wahl"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wahl_aggregat_kiez" ADD CONSTRAINT "wahl_aggregat_kiez_partei_id_partei_id_fk" FOREIGN KEY ("partei_id") REFERENCES "public"."partei"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wahl_aggregat_bezirk" ADD CONSTRAINT "wahl_aggregat_bezirk_wahl_id_wahl_id_fk" FOREIGN KEY ("wahl_id") REFERENCES "public"."wahl"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wahl_aggregat_bezirk" ADD CONSTRAINT "wahl_aggregat_bezirk_partei_id_partei_id_fk" FOREIGN KEY ("partei_id") REFERENCES "public"."partei"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wahl_aggregat_berlin" ADD CONSTRAINT "wahl_aggregat_berlin_wahl_id_wahl_id_fk" FOREIGN KEY ("wahl_id") REFERENCES "public"."wahl"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wahl_aggregat_berlin" ADD CONSTRAINT "wahl_aggregat_berlin_partei_id_partei_id_fk" FOREIGN KEY ("partei_id") REFERENCES "public"."partei"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "wahl_jahr_typ_stimmtyp_uniq" ON "wahl" USING btree ("jahr","typ","stimmtyp");--> statement-breakpoint
CREATE UNIQUE INDEX "partei_alias_label_jahr_uniq" ON "partei_alias" USING btree ("alias_label","jahr");