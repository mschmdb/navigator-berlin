# Datenschutz-Snippet: Adress-Bookmarks (Merkliste)

**Status:** Entwurf für Einbindung in Story 4.6 (Compliance-Pages, Datenschutzerklärung).
**Quelle:** Story 1.26, ADR-004 (Cookieless-Architektur, Bookmark-Exception).
**Rechtsgrundlage:** TDDDG §25 Abs. 2 Nr. 2, DSK-Orientierungshilfe Telemedien 2021.

---

## Adress-Merkliste (Bookmarks)

navigator.berlin stellt eine optionale Merklisten-Funktion zur Verfügung, mit der Sie Adressen für spätere Recherche in Ihrem Browser ablegen können. Diese Funktion ist eine vom Nutzer ausdrücklich gewünschte Zusatzfunktion im Sinne von §25 Abs. 2 Nr. 2 TDDDG und benötigt keine separate Einwilligung.

### Was wird gespeichert

Pro Bookmark legen wir folgende Informationen ab:

- Anzeige-Name der Adresse (z. B. "Wörther Straße 11, 10405 Berlin")
- Geographische Koordinaten (Längen- und Breitengrad)
- Bezirk und Postleitzahl, falls bekannt
- Zeitstempel der Speicherung (ISO-Datum)

Es werden ausschließlich öffentlich verfügbare Adressdaten gespeichert, die Sie selbst aktiv über die Adress-Suche ausgewählt haben.

### Wo wird gespeichert

Die Bookmarks liegen ausschließlich im **lokalen Speicher Ihres Browsers** (LocalStorage). Es findet **keine Übertragung an unsere Server statt**. Es findet **keine Übertragung an Dritte statt**. Es findet **keine serverseitige Auswertung statt**.

Speicherort: LocalStorage-Schlüssel `navigator-berlin.bookmarks.v1`.

### Wozu verwenden wir die Daten

Die Bookmarks dienen ausschließlich dazu, dass Sie zwischen Sitzungen Ihre Recherche-Liste wiederfinden, ohne Adressen erneut eintippen zu müssen. Wir nutzen die Daten nicht für Tracking, nicht für Profilbildung, nicht für Werbung, nicht für Statistiken.

### Wie lange werden die Daten gespeichert

Solange Sie die Bookmarks nicht löschen. Wir setzen kein Ablaufdatum.

### Wie können Sie die Daten löschen

Sie haben drei gleichwertige Möglichkeiten:

1. **In der Anwendung:** Öffnen Sie das Bookmark-Symbol im Header, klicken Sie auf das Mülleimer-Symbol neben einer Adresse oder auf "Alle löschen" im Dialog-Footer.
2. **Im Browser-Menü:** Über die Browser-Einstellungen können Sie alle Website-Daten für navigator.berlin löschen.
3. **Inkognito-Modus:** Im privaten Browser-Modus werden Bookmarks beim Schließen des Fensters automatisch verworfen.

### Was passiert ohne Bookmarks

Die Anwendung funktioniert vollständig ohne aktivierte Bookmark-Funktion. Sie ist ein optionaler Komfort, keine Voraussetzung für die Nutzung von navigator.berlin.

### Kein Cookie-Banner

Da diese Funktion technisch notwendig für die von Ihnen aktiv gewünschte Merklisten-Funktion ist und keine personenbezogenen Daten an Server oder Dritte übertragen werden, fällt die Speicherung unter die Ausnahme nach §25 Abs. 2 Nr. 2 TDDDG. Ein separates Cookie-Banner ist nicht erforderlich.

### Rechtsgrundlagen

- §25 Abs. 2 Nr. 2 TDDDG (Telekommunikation-Digitale-Dienste-Datenschutzgesetz)
- Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer funktionsfähigen Anwendung mit User-Komfort)
- Orientierungshilfe der Datenschutzkonferenz für Anbieter von Telemedien vom 20.12.2021, S. 14 (Merkliste als Beispiel für ausdrücklich gewünschten Dienst)

### Kontakt

Fragen zur Bookmark-Funktion oder zur Datenverarbeitung beantworten wir unter der im Impressum genannten E-Mail-Adresse.
