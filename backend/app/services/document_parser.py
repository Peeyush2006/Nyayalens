import os
import re
from pathlib import Path
from typing import List, Dict, Any, Tuple
import fitz  # PyMuPDF
import pdfplumber
from docx import Document as DocxDocument
from app.models.schemas import DocumentPageContent

class DocumentParser:
    @staticmethod
    def parse_file(file_path: Path) -> Tuple[List[DocumentPageContent], int, str]:
        ext = file_path.suffix.lower()
        if ext == ".pdf":
            return DocumentParser._parse_pdf(file_path)
        elif ext in [".docx", ".doc"]:
            return DocumentParser._parse_docx(file_path)
        elif ext in [".txt", ".md"]:
            return DocumentParser._parse_text(file_path)
        else:
            raise ValueError(f"Unsupported file format: {ext}")

    @staticmethod
    def _parse_pdf(file_path: Path) -> Tuple[List[DocumentPageContent], int, str]:
        pages_content: List[DocumentPageContent] = []
        full_text_list = []
        
        try:
            # First try PyMuPDF for fast, clean text extraction
            doc = fitz.open(str(file_path))
            page_count = len(doc)
            
            for page_idx in range(page_count):
                page = doc[page_idx]
                text = page.get_text("text").strip()
                
                # If PyMuPDF returned little text, fallback to pdfplumber for that page
                if len(text) < 20:
                    try:
                        with pdfplumber.open(str(file_path)) as plumber_pdf:
                            if page_idx < len(plumber_pdf.pages):
                                plumber_text = plumber_pdf.pages[page_idx].extract_text()
                                if plumber_text and len(plumber_text) > len(text):
                                    text = plumber_text.strip()
                    except Exception:
                        pass
                
                sections = DocumentParser._detect_sections(text)
                pages_content.append(DocumentPageContent(
                    page_number=page_idx + 1,
                    text=text,
                    sections=sections
                ))
                full_text_list.append(text)
            
            doc.close()
            return pages_content, page_count, "\n\n".join(full_text_list)
        except Exception as e:
            # Fallback to pdfplumber
            pages_content = []
            with pdfplumber.open(str(file_path)) as pdf:
                page_count = len(pdf.pages)
                for i, page in enumerate(pdf.pages):
                    t = page.extract_text() or ""
                    sections = DocumentParser._detect_sections(t)
                    pages_content.append(DocumentPageContent(
                        page_number=i + 1,
                        text=t.strip(),
                        sections=sections
                    ))
                    full_text_list.append(t.strip())
            return pages_content, page_count, "\n\n".join(full_text_list)

    @staticmethod
    def _parse_docx(file_path: Path) -> Tuple[List[DocumentPageContent], int, str]:
        doc = DocxDocument(str(file_path))
        full_paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        full_text = "\n\n".join(full_paragraphs)
        
        # Simulate pages (~500 words per page)
        words = full_text.split()
        words_per_page = 450
        page_chunks = []
        for i in range(0, max(len(words), 1), words_per_page):
            chunk = " ".join(words[i:i + words_per_page])
            page_chunks.append(chunk)
        
        if not page_chunks:
            page_chunks = [full_text or "Empty Document"]
            
        pages_content = []
        for idx, chunk in enumerate(page_chunks):
            sections = DocumentParser._detect_sections(chunk)
            pages_content.append(DocumentPageContent(
                page_number=idx + 1,
                text=chunk,
                sections=sections
            ))
            
        return pages_content, len(page_chunks), full_text

    @staticmethod
    def _parse_text(file_path: Path) -> Tuple[List[DocumentPageContent], int, str]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            full_text = f.read()
            
        words = full_text.split()
        words_per_page = 450
        page_chunks = []
        for i in range(0, max(len(words), 1), words_per_page):
            chunk = " ".join(words[i:i + words_per_page])
            page_chunks.append(chunk)
            
        if not page_chunks:
            page_chunks = [full_text or "Empty Document"]
            
        pages_content = []
        for idx, chunk in enumerate(page_chunks):
            sections = DocumentParser._detect_sections(chunk)
            pages_content.append(DocumentPageContent(
                page_number=idx + 1,
                text=chunk,
                sections=sections
            ))
            
        return pages_content, len(page_chunks), full_text

    @staticmethod
    def _detect_sections(text: str) -> List[str]:
        section_patterns = [
            r"(?:Section|Clause|Article|\b[0-9]{1,2}\.)\s+([A-Z][A-Za-z0-9\s,\-\(\)]+)",
            r"^[A-Z\s]{4,40}$",
        ]
        detected = []
        lines = text.split("\n")
        for line in lines:
            line_str = line.strip()
            if not line_str or len(line_str) > 80:
                continue
            for pat in section_patterns:
                match = re.search(pat, line_str)
                if match:
                    detected.append(line_str)
                    break
        return detected[:10]
