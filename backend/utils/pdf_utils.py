"""
PDF Ingestion Utility
----------------------
Extracts text from uploaded PDFs and feeds them into the vector DB.
Handles multi-page PDFs, cleans up whitespace, and chunks intelligently.
"""

import logging
import io
from pypdf import PdfReader

logger = logging.getLogger(__name__)


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract all text from a PDF file (given as bytes)."""
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        pages_text = []
        for page_num, page in enumerate(reader.pages, 1):
            text = page.extract_text()
            if text and text.strip():
                pages_text.append(f"[Page {page_num}]\n{text.strip()}")

        full_text = "\n\n".join(pages_text)
        logger.info(f"PDF extracted | pages={len(reader.pages)} | chars={len(full_text)}")
        return full_text
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        raise ValueError(f"Could not extract text from PDF: {str(e)}")


def clean_text(text: str) -> str:
    """Remove excessive whitespace and fix common PDF extraction artifacts."""
    import re
    # Collapse multiple spaces
    text = re.sub(r"[ \t]+", " ", text)
    # Collapse more than 2 newlines
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Remove lines that are just numbers (page numbers)
    text = re.sub(r"^\s*\d+\s*$", "", text, flags=re.MULTILINE)
    return text.strip()
