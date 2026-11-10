# Schätzspiel

Ein Browser-Spiel, bei dem man Dinge möglichst genau schätzt. Läuft auf Handy, iPad und PC,
ohne Anmeldung und ohne Server.

Die erste Version enthält den Modus **„Was kostet das?“**: Zehn Fragen pro Spiel, die Schätzung
gibt man mit einem Regler ab, danach sieht man den echten Preis samt Quelle und bekommt Punkte.

## Loslegen

Voraussetzung ist [Node.js](https://nodejs.org) ab Version 22.

```bash
npm install     # einmalig: Abhängigkeiten laden
npm run dev     # Spiel lokal starten (Adresse steht danach im Terminal)
npm test        # automatische Tests
npm run build   # fertige Version in den Ordner dist/ bauen
```

Um das lokal laufende Spiel auf einem iPad oder Handy im selben WLAN zu öffnen, startet man
`npm run dev -- --host` und ruft die angezeigte „Network“-Adresse auf dem Gerät auf.

## So wird gewertet

- Ein Volltreffer bringt 1.000 Punkte, ein Spiel also höchstens 10.000.
- Jedes Prozent Abweichung kostet 5 Punkte. Die Punkte sinken gleichmäßig bis auf 0 bei 200 %.
- Die Abweichung wird vom kleineren der beiden Werte aus gemessen. Halb so viel und doppelt so
  viel zählen deshalb gleich (beide 100 % = 500 Punkte). Sonst wäre es eine Gewinnstrategie,
  immer ganz niedrig zu tippen.

| Abweichung | Beispiel bei 100 € | Punkte |
| ---------- | ------------------ | ------ |
| 0 %        | 100 €              | 1.000  |
| 10 %       | 110 € oder 90,91 € | 950    |
| 50 %       | 150 € oder 66,67 € | 750    |
| 100 %      | 200 € oder 50 €    | 500    |
| 200 %      | 300 € oder 33,33 € | 0      |

Die Stellschrauben stehen in `src/game/scoring.ts` (`MAX_POINTS`, `ZERO_POINTS_DEVIATION`).

## Der Regler

- Die Skala ist logarithmisch: Der Abstand von 10 € zu 100 € ist so groß wie der von 100 € zu
  1.000 €. Nur so lassen sich Briefporto und Bugatti mit demselben Regler schätzen.
- Der echte Preis liegt **immer** im Bereich des Reglers, zufällig zwischen 15 % und 85 % der
  Breite. Die Mitte verrät also nichts. Ein Test prüft das für jede Frage mit Hunderten
  Zufallswerten (`src/game/scale.test.ts`).
- Einstellungen: `RANGE_FACTOR` und die Positionsgrenzen in `src/game/scale.ts`.

## Fragen pflegen

Alle Fragen stehen in `src/data/questions.ts`. Jede Frage braucht:

| Feld                    | Bedeutung                                                       |
| ----------------------- | --------------------------------------------------------------- |
| `id`                    | eindeutiger Kurzname                                            |
| `title`                 | Kurzname für die Auswertung                                     |
| `category`              | `alltag`, `unterwegs`, `technik`, `amtlich` oder `luxus`        |
| `emoji`                 | Bild auf dem Preisschild                                        |
| `question`, `detail`    | die Frage und was genau gemeint ist (Variante, Tarif, Größe)    |
| `price`                 | echter Preis in Euro                                            |
| `source.name`, `.url`   | Quelle und Link, unter dem sich der Preis nachprüfen lässt      |
| `source.asOf`           | Stand der Angabe im Format `JJJJ-MM`                            |

`npm test` prüft automatisch, dass keine Frage ohne Quelle, Link und Datum auskommt.

Aufgenommen werden nur eindeutige Preise: offizielle Tarife und Gebühren, Listenpreise bzw.
unverbindliche Preisempfehlungen oder dokumentierte historische Beträge. Schwankende
Händlerpreise eignen sich nicht.

### Stand der Preise

Die 38 Fragen wurden im November 2026 per Websuche geprüft. Bekannte Änderungen, nach denen
die Datei angepasst werden muss:

- Briefporto: ab 01.01.2027 voraussichtlich 1,15 € (bisher 0,95 €)
- Deutschlandticket: ab 01.01.2027 voraussichtlich 66,80 € (bisher 63 €)
- Vignette Österreich: neuer Preis für das Vignettenjahr 2027
- Rundfunkbeitrag: mögliche Anpassung ab 2027

## Veröffentlichen

Das Spiel ist eine rein statische Seite. Jeder Hoster für statische Seiten funktioniert:
Build-Befehl `npm run build`, Ausgabeordner `dist`.

| Anbieter           | Privates Repo, kostenlos | Kommerzielle Nutzung im Gratis-Tarif | Hinweis                                             |
| ------------------ | ------------------------ | ------------------------------------ | --------------------------------------------------- |
| **Cloudflare**     | ja                       | keine Einschränkung gefunden         | 500 Builds pro Monat, Datenverkehr unbegrenzt       |
| Vercel (Hobby)     | ja, bei persönlichem Konto | nein, nur privat und nicht kommerziell | sobald Geld verdient wird, ist der Pro-Tarif nötig |
| GitHub Pages       | nein                     | –                                    | im Gratis-Tarif nur für öffentliche Repositories    |

Empfehlung: **Cloudflare**. Einrichtung in etwa fünf Minuten:

1. Auf [dash.cloudflare.com](https://dash.cloudflare.com) kostenlos registrieren.
2. „Workers & Pages“ → „Create“ → Repository aus GitHub importieren und der Cloudflare-App
   Zugriff auf dieses eine Repository geben.
3. Build-Befehl `npm run build`, Ausgabeordner `dist` eintragen und speichern.

Danach wird jede Änderung auf dem Hauptzweig automatisch veröffentlicht. Die Tarifbedingungen
der Anbieter ändern sich; vor dem Start lohnt ein Blick auf die aktuellen Preisseiten.

## Spielstand und Stabilität

- **Automatisch gespeichert:** Nach jeder Aktion und bei jeder Reglerbewegung (gebündelt), außerdem
  sofort, wenn die App in den Hintergrund geht. Gespeichert werden auch die Fragen samt Preisen vom
  Spielbeginn – spätere Preisänderungen verschieben keine bereits erzielten Punkte.
- **Fortsetzen:** Nach Neuladen oder erneutem Öffnen bietet die Startseite eine Karte
  „Unterbrochenes Spiel“ bzw. „Letztes Ergebnis“ mit Weiterspielen und Verwerfen (mit Rückfrage).
- **Verfall:** 24 Stunden nach der letzten Aktion wird ein Spielstand verworfen.
- **Zurück-Taste / Wischgeste:** Im Spiel und auf der Ergebnisseite führt sie zur Startseite; das
  Spiel bleibt gespeichert. Auf der Startseite verlässt sie die App wie gewohnt.
- **Beenden:** Das X im Spiel (mit Rückfrage) und „Startseite“ auf der Ergebnisseite löschen den Stand.
- **Fehler:** Programmfehler – auch in Klicks – führen zum Fehlerbildschirm. Nach „Seite neu laden“
  geht es beim zuletzt sicher gespeicherten Stand weiter. Lädt das Programm gar nicht, erscheint nach
  12 Sekunden ein Hinweis mit Neu-laden-Knopf.
- **Speicher gesperrt** (z. B. privater Modus): Das Spiel läuft, nur ohne Speichern.

Technisch: `src/game/savedGame.ts` (Format, strenge Prüfung, Verfall), `src/game/useGame.ts`
(automatisches Speichern), `src/lib/backNavigation.ts` (Zurück-Taste), `src/lib/useErrorTrap.ts`.

## Designsystem „Papier & Tinte“

Die Gestaltung ist in `src/styles/index.css` festgelegt und gilt für alle Bildschirme.
Komponenten verwenden nur diese Bausteine – keine eigenen Farben oder Größen.

| Baustein        | Regel                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------- |
| Farben          | Ruhige Flächen, schwarze Tinte, eine Akzentfarbe (Stempelblau). Farbe hat immer Bedeutung: Blau = Aktion, Grün/Ocker/Rot = Bewertung eines Tipps. |
| Hell und dunkel | Folgt der Systemeinstellung. Jedes Textpaar erfüllt WCAG AA (mindestens 4,5:1).             |
| Schrift         | Instrument Sans mit Tabellenziffern. Sieben Größen: `display`, `title`, `heading`, `body-lg`, `body`, `small`, `label`; für Zahlen `figure-xl` und `figure-lg`. |
| Radien          | Drei Stufen: `chip`, `control`, `card`.                                                     |
| Tippflächen     | Mindestens 44 × 44 px.                                                                      |
| Piktogramme     | Einfarbige Liniensymbole statt Emoji (Tabler Icons, MIT-Lizenz).                            |
| Bewegung        | Eine Kurve, kurze Einblendungen. Einziger Höhepunkt: Der echte Preis zählt hoch. Bei „Bewegung reduzieren“ entfällt alles. |
| Erkennungszeichen | Das Preisschild mit Lochung und Abrisskante – sonst keine Dekoration.                     |

**Neues Piktogramm für eine Frage:** Namen in `src/data/pictograms.ts` ergänzen und in
`src/components/Pictogram.tsx` einem Symbol zuordnen. TypeScript meldet, wenn eines von beiden fehlt.

**Platzhalter:** Die Tagesrunde (Startseite) und der Ton-Schalter (oben rechts) sind gestaltet, aber
noch ohne Funktion. Beide sind sichtbar als nicht verfügbar gekennzeichnet.

## Aufbau

```
src/
  data/questions.ts      Fragen mit Preis, Quelle und Stand
  data/pictograms.ts     Namen der erlaubten Piktogramme
  game/                  Spiellogik ohne Oberfläche – vollständig getestet
    scoring.ts           Abweichung, Punkte, Bewertungsstufen, Titel
    scale.ts             Reglerbereich, logarithmische Skala, glatte Beträge
    rounds.ts            Auswahl der Fragen für ein Spiel
    game.ts              Spielablauf (Start → Schätzen → Auflösung → Auswertung)
    labels.ts            Texte zur Bewertung, Signalfarbe, Text zum Teilen
    summary.ts           Höhepunkte eines Spiels (bester Tipp, größter Ausreißer)
    format.ts            Preise, Punkte und Datum in deutscher Schreibweise
    storage.ts           Bestwert und gesehene Fragen im Browser
    savedGame.ts         Laufendes Spiel speichern, prüfen und wiederherstellen
  lib/                   Kleine Hilfen: Animation, Zurück-Taste, Fehlerabfang, „Bewegung reduzieren“
  components/            Oberfläche: Start, Spielrunde, Regler, Preisschild, Auswertung
  styles/index.css       Designsystem: Farben, Schrift, Radien, Bewegung, Preisschild
```

Technik: React, TypeScript, Vite und Tailwind CSS. Animationen kommen ohne Bibliothek aus.
Die Schrift (Instrument Sans) liegt im Projekt und wird nicht von fremden Servern geladen.
