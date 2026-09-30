The Kiez score has a new context dimension: recorded crime. The data source is the [Berlin crime atlas (Kriminalitätsatlas Berlin)](https://www.kriminalitaetsatlas.berlin.de/) of the Berlin Police (dl-de-by-2.0).

## The metric

The incidence rate, meaning cases per 100,000 residents, for selected offences relevant to housing: Kieztaten, burglary of dwellings, criminal damage, street robbery and bicycle theft. "Kieztaten" is a collective category of the Berlin Police for offences closely tied to the residential area. For each offence, we take the mean of the last three years, which dampens outliers in individual years.

In the inspector, the dimension can be expanded by type of offence. On the map, there is a separate layer in indigo.

## Limits of the metric

The incidence rate measures recorded cases per registered resident. This sets clear limits:

- **Not a personal risk.** The figure describes incidence per resident, not the probability for one individual.
- **Tourists and commuters distort it.** Inner-city places such as the government quarter or Alexanderplatz have few registered residents but a lot of through traffic. Their incidence rate therefore looks exaggerated. We cap these outliers in the scale.
- **Only reported crime.** Recorded cases are those reported to the police, and reporting behaviour differs from place to place.

## Bezirksregion instead of address

The values exist per Bezirksregion, not per address. Every planning area inherits the value of its Bezirksregion. The dimension is therefore coarser than the five core dimensions.

## Not in the overall score

Recorded crime deliberately does not feed into the overall score or any ranking. A high value means more recorded cases, not a judgement on the Kiez. For the same reason, the dimension does not appear in the prose profiles.

## Methodology

Offence selection, scale and all limits are described in the [Methodology for the Kiez score](/en/methodik/kiez-score).
