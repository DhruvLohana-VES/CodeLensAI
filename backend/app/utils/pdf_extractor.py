from dataclasses import dataclass

import fitz


class PDFExtractionError(Exception):
    """Base error for PDF extraction failures."""


class InvalidPDFError(PDFExtractionError):
    """Raised when a PDF is invalid, corrupted, or not a PDF."""


class EmptyPDFError(PDFExtractionError):
    """Raised when the PDF is empty or has no extractable text."""


@dataclass(frozen=True)
class PDFExtractionResult:
    text: str
    pages: int


def extract_text_from_pdf(file_bytes: bytes) -> PDFExtractionResult:
    if not file_bytes:
        raise EmptyPDFError("Uploaded file is empty.")

    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
    except Exception as exc:  # fitz raises generic exceptions for invalid PDFs.
        raise InvalidPDFError("Unable to open PDF. File may be corrupted.") from exc

    try:
        if doc.needs_pass:
            raise InvalidPDFError("PDF is password protected.")

        if doc.page_count <= 0:
            raise EmptyPDFError("PDF has no pages.")

        pages_text: list[str] = []
        for page in doc:
            page_text = page.get_text("text")
            if page_text:
                pages_text.append(page_text)

        combined = "\n".join(pages_text).strip()
        normalized = " ".join(combined.split())

        if not normalized:
            raise EmptyPDFError("PDF has no extractable text.")

        return PDFExtractionResult(text=normalized, pages=doc.page_count)
    finally:
        doc.close()
