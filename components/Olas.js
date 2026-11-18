// Tres capas de olas SVG que se desplazan a distinta velocidad (ver .olas en globals.css).
export default function Olas() {
  return (
    <svg className="olas" viewBox="0 24 150 28" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <path id="ola" d="M-160 44c30 0 58-18 88-18s58 18 88 18 58-18 88-18 58 18 88 18v44h-352z" />
      </defs>
      <use href="#ola" x="48" y="0" />
      <use href="#ola" x="48" y="3" />
      <use href="#ola" x="48" y="6" />
    </svg>
  );
}
