CREATE TABLE "wahl_stimmbezirk_gruppe" (
	"wahl_id" integer NOT NULL,
	"uwb_id" text NOT NULL,
	"gruppe_id" text NOT NULL,
	CONSTRAINT "wahl_stimmbezirk_gruppe_wahl_id_uwb_id_pk" PRIMARY KEY("wahl_id","uwb_id")
);
--> statement-breakpoint
ALTER TABLE "stimmbezirk" ADD COLUMN "wahlberechtigte" integer;--> statement-breakpoint
ALTER TABLE "wahl_stimmbezirk_gruppe" ADD CONSTRAINT "wahl_stimmbezirk_gruppe_wahl_id_wahl_id_fk" FOREIGN KEY ("wahl_id") REFERENCES "public"."wahl"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wahl_stimmbezirk_gruppe_gruppe_idx" ON "wahl_stimmbezirk_gruppe" USING btree ("wahl_id","gruppe_id");