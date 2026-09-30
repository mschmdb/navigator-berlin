Anyone who stacked two Kiez score dimensions until now got green on green: all dimensions shared one colour scale, and from the second layer on, the map disappeared into an unreadable tangle of lines. This update fixes that, and for good.

The map now follows a fixed set of rules:

- **Each dimension has its own colour.** Quiet & air is blue, mobility purple, local amenities ochre, tenant protection teal, culture berry. Green is reserved for the overall score and green & heat. Within each colour, the rule still holds: light means a low level, dark a high one.
- **At most two value layers at once, with clear roles.** The first fills the area. The second appears as graduated square symbols, one square per planning area, whose size shows the level. A third value layer automatically replaces the oldest, because nobody can read more than two reliably.
- **Square means analysis, circle means place.** The symbols are deliberately angular: a square stands for an aggregated area value, while round markers and pins still stand for concrete places such as stations or libraries.
- **Area layers do not count.** Milieuschutz areas or cold-air corridors only say "something applies here" and sit underneath as areas. Both Milieuschutz maps plus the tenant protection score can now be shown at the same time.
- **Swap roles with one click.** In the legend, the swap arrow turns the symbol layer into the area layer and the other way round. The setting travels with the shared link.

When you hover, the tooltip now shows the values of all value layers hit, not just the top one. And because the audience of the map does not consist only of people with full colour vision: the size gradation of the symbols carries the information even where hues become similar under red-green colour blindness. We measured the limits with simulated colour vision deficiency instead of estimating them.

On the side, navigator.berlin has a new logo: the silhouette of Berlin as a grid of coloured squares, inspired by Gerhard Richter's colour charts. The colours are pure decoration and carry no data. If you look closely, you can see the kinship with the new map symbols. The square grid is now the visual language of the project.
