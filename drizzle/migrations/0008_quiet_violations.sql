CREATE TABLE "wahl_analytik_kiez" (
	"kiez_slug" text NOT NULL,
	"typ" "wahl_typ" NOT NULL,
	"stimmtyp" "wahl_stimmtyp" NOT NULL,
	"wechsel_count" integer NOT NULL,
	"wechsel_jahre" jsonb NOT NULL,
	"volatilitaet" real NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wahl_analytik_kiez_kiez_slug_typ_stimmtyp_pk" PRIMARY KEY("kiez_slug","typ","stimmtyp")
);
--> statement-breakpoint
CREATE TABLE "wahl_trend_kiez" (
	"kiez_slug" text NOT NULL,
	"typ" "wahl_typ" NOT NULL,
	"stimmtyp" "wahl_stimmtyp" NOT NULL,
	"partei_id" integer NOT NULL,
	"slope" real NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wahl_trend_kiez_kiez_slug_typ_stimmtyp_partei_id_pk" PRIMARY KEY("kiez_slug","typ","stimmtyp","partei_id")
);
--> statement-breakpoint
ALTER TABLE "wahl_trend_kiez" ADD CONSTRAINT "wahl_trend_kiez_partei_id_partei_id_fk" FOREIGN KEY ("partei_id") REFERENCES "public"."partei"("id") ON DELETE restrict ON UPDATE no action;