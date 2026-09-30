Twelve elections are now available: Bundestag (2013, 2017, 2021, 2025), House of Representatives (2011, 2016, 2021, 2023) and District Assembly (BVV) (2011, 2016, 2021, 2023). The repeat elections of February 2023 each refer to the September 2021 election, which was declared invalid.

Sources: the Bundestag elections come from the Federal Election Commissioner (Bundeswahlleiterin), the House of Representatives and District Assembly elections from the Statistics Office Berlin-Brandenburg (Amt für Statistik Berlin-Brandenburg). Both are licensed under Data licence Germany, attribution, version 2.0.

## Address inspector

Search for an address and scroll to the "Voting behaviour here" block. You can switch between polling district, Kiez (planning area), Bezirk and Berlin as a whole. Next to each party you see the difference from the next higher level, with a small line below showing the trend over the last elections.

## Election pages

Under [`/en/wahl`](/en/berlin-wahlen), each of the 20 election variants has its own page (first and second votes count separately). Each page shows a bar for Berlin as a whole with the top 5, the top 3 per Bezirk and a map of all 3,500 polling districts, coloured by strongest party.

## Kiez history

The "Election history here" block appears on each of the 143 Kiez pages. For each election type, it shows a row of cards: 2017, 2021 and 2025, each with the strongest party. The data comes from the Kiez aggregate, which adds up the votes of the polling districts within each planning area.

## Postal vote gap before 2021

Up to 2017 (Bundestag) and 2016 (House of Representatives, District Assembly), postal votes were counted only as separate postal polling districts, with no spatial assignment. At polling district level they are therefore missing for that period. The map and inspector mark this with a hatched strip on the bar and a "Without postal votes" badge that links to the methodology. Bezirk and Berlin values include the postal votes in full.

For the 2013 Bundestag election and the 2011 House of Representatives and District Assembly elections, the polling district polygons are also missing. These three elections have no map, only the Bezirk and Berlin aggregate.

## WebMCP tools

Four new tools in the manifest: list elections, query the result at an address, compare several elections at the same location, and return the polling district polygon for a district ID. A Claude or ChatGPT plugin can then answer "How did Friedrichshain vote in the 2025 Bundestag election?" with a figure, source and licence instead of scraping HTML. Manifest: [`/webmcp-manifest.json`](/webmcp-manifest.json).

## Methodology

Data sources, aggregation logic, postal vote handling and coverage gaps: [Election data methodology](/en/methodik/wahldaten).
