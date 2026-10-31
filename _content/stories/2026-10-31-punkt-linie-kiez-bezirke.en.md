I'll admit it, the name is borrowed. In 1926 the Bauhaus published [Wassily Kandinsky](https://en.wikipedia.org/wiki/Wassily_Kandinsky)'s book [Point and Line to Plane](https://en.wikipedia.org/wiki/Point_and_Line_to_Plane). In it he breaks pictures down into their basic elements: point, line, plane. At the Bauhaus he also paired basic shapes with basic colours: the yellow triangle, the red square, the blue circle.

That's the game I play here with Berlin data. Every district gets the same six shapes. A number from open data decides how big each shape gets. So every district turns into its own composition.

<!-- visual -->

## How to read the picture

- **Circle:** green space, as an index from 0 to 100 based on the Umweltatlas categories. Bigger means more green nearby.
- **Square:** share of homes built before 1949.
- **Triangle:** noise as L_DEN, between 45 and 62 dB. Bigger means louder.
- **Bar:** residents per km². It grows logarithmically, otherwise Mitte would flatten everything else.
- **Lines:** share of residents with a transit stop within 400 m. One line from 80 percent, six at 100 percent.
- **Donut:** clubs. It grows with the square root of the number of clubs, up to 50. No clubs, no donut.

I didn't keep Kandinsky's colours entirely. The circle is green because it shows green space. The donut is blue. Readability beats art history.

Where a shape sits means nothing. Each district has a fixed seed, so Pankow always looks the same. If a value is missing, its shape is missing too, and the legend says "no data". Pick a district above; you can also reach every shape with the keyboard.

## Ready to print

Below the large picture you can download your district as a PDF. It's a vector file, so you can have it printed at any size. Everything is MIT licensed, and the sources are on the poster.
