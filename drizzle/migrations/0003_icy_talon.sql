ALTER TABLE "bezirk_score" ADD COLUMN "gruen_hitze" double precision;--> statement-breakpoint
ALTER TABLE "bezirk_score" ADD COLUMN "wohnschutz" double precision;--> statement-breakpoint
ALTER TABLE "kiez_score" ADD COLUMN "gruen_hitze" double precision;--> statement-breakpoint
ALTER TABLE "kiez_score" ADD COLUMN "wohnschutz" double precision;--> statement-breakpoint
ALTER TABLE "bezirk_score" DROP COLUMN "gruen";--> statement-breakpoint
ALTER TABLE "bezirk_score" DROP COLUMN "soziale_lage";--> statement-breakpoint
ALTER TABLE "kiez_score" DROP COLUMN "gruen";--> statement-breakpoint
ALTER TABLE "kiez_score" DROP COLUMN "soziale_lage";