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
        except Exception:
            # Fallback to pdfplumber
            try:
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
            except Exception:
                # Ultimate fallback for any unparseable PDF
                raw_snippet = f"Document: {file_path.name}\n(Preview could not extract text from this format; please ensure it is not password-protected or image-only)."
                return [DocumentPageContent(page_number=1, text=raw_snippet, sections=[])], 1, raw_snippet

    @staticmethod
    def _parse_docx(file_path: Path) -> Tuple[List[DocumentPageContent], int, str]:
        full_text = ""
        full_paragraphs = []
        try:
            doc = DocxDocument(str(file_path))
            full_paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
            full_text = "\n\n".join(full_paragraphs)
        except Exception:
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    full_text = f.read()
                    full_paragraphs = [p.strip() for p in full_text.split("\n\n") if p.strip()]
            except Exception:
                full_text = f"Document: {file_path.name}"
                full_paragraphs = [full_text]
        
        # Paginate while preserving paragraphs (\n\n)
        words_per_page = 400
        pages_content = []
        cur_page_paras = []
        cur_word_count = 0
        
        for p in full_paragraphs:
            w = len(p.split())
            if cur_word_count + w > words_per_page and cur_page_paras:
                page_text = "\n\n".join(cur_page_paras)
                pages_content.append(DocumentPageContent(
                    page_number=len(pages_content) + 1,
                    text=page_text,
                    sections=DocumentParser._detect_sections(page_text)
                ))
                cur_page_paras = [p]
                cur_word_count = w
            else:
                cur_page_paras.append(p)
                cur_word_count += w
                
        if cur_page_paras:
            page_text = "\n\n".join(cur_page_paras)
            pages_content.append(DocumentPageContent(
                page_number=len(pages_content) + 1,
                text=page_text,
                sections=DocumentParser._detect_sections(page_text)
            ))
            
        if not pages_content:
            pages_content = [DocumentPageContent(page_number=1, text=full_text, sections=[])]
            
        return pages_content, len(pages_content), full_text

    @staticmethod
    def _parse_text(file_path: Path) -> Tuple[List[DocumentPageContent], int, str]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            full_text = f.read()
            
        full_paragraphs = [p.strip() for p in re.split(r"(?:\r?\n){2,}|(?=\n(?:Section|Clause|Article|[0-9]{1,2}\.))", full_text, flags=re.I) if p.strip()]
        if not full_paragraphs:
            full_paragraphs = [full_text]
            
        words_per_page = 400
        pages_content = []
        cur_page_paras = []
        cur_word_count = 0
        
        for p in full_paragraphs:
            w = len(p.split())
            if cur_word_count + w > words_per_page and cur_page_paras:
                page_text = "\n\n".join(cur_page_paras)
                pages_content.append(DocumentPageContent(
                    page_number=len(pages_content) + 1,
                    text=page_text,
                    sections=DocumentParser._detect_sections(page_text)
                ))
                cur_page_paras = [p]
                cur_word_count = w
            else:
                cur_page_paras.append(p)
                cur_word_count += w
                
        if cur_page_paras:
            page_text = "\n\n".join(cur_page_paras)
            pages_content.append(DocumentPageContent(
                page_number=len(pages_content) + 1,
                text=page_text,
                sections=DocumentParser._detect_sections(page_text)
            ))
            
        if not pages_content:
            pages_content = [DocumentPageContent(page_number=1, text=full_text, sections=[])]
            
        return pages_content, len(pages_content), full_text

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
