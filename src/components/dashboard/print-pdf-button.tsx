"use client";

export function PrintPdfButton() {
  return (
    <button type="button" className="print-toolbar__button" onClick={() => window.print()}>
      Generar PDF
    </button>
  );
}
