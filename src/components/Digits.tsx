/**
 * Ziffern in gleich breiten Zellen.
 *
 * Die Hausschrift hat keine Tabellenziffern – eine „1“ ist nur halb so breit
 * wie eine „0“. Ohne feste Zellen würde ein Preis beim Ziehen des Reglers oder
 * beim Hochzählen ständig seine Breite ändern und hin und her springen.
 */
const DIGIT = /(\d)/;

function isDigit(part: string): boolean {
  return part.length === 1 && part >= '0' && part <= '9';
}

/** Für Text, den React rendert. */
export function Digits({ text }: { text: string }) {
  return (
    <>
      {text.split(DIGIT).map((part, index) =>
        isDigit(part) ? (
          <span key={index} className="digit">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** Für Text, der pro Animationsbild direkt in den DOM geschrieben wird. */
export function setDigits(node: HTMLElement, text: string): void {
  const children = text
    .split(DIGIT)
    .filter((part) => part !== '')
    .map((part) => {
      if (!isDigit(part)) return part;
      const cell = document.createElement('span');
      cell.className = 'digit';
      cell.textContent = part;
      return cell;
    });
  node.replaceChildren(...children);
}
