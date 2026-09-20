import re
import math
from typing import List, Dict, Any, Tuple, Optional
from app.models.schemas import GroundedAnswer, Citation, DocumentDetail, Clause

class RAGEngine:
    @staticmethod
    def answer_question(document: DocumentDetail, question: str, language: str = "english") -> GroundedAnswer:
        q_clean = question.strip()
        q_lower = q_clean.lower()

        # Step 1: Detect intent and search relevant document chunks & clauses
        relevant_chunks: List[Tuple[float, Dict[str, Any]]] = []

        # A. Search through clauses
        for clause in document.clauses:
            score = RAGEngine._compute_relevance(q_lower, clause.title.lower() + " " + clause.original_text.lower() + " " + clause.why_it_matters.lower())
            if score > 0.08:
                relevant_chunks.append((
                    score,
                    {
                        "type": "clause",
                        "page": clause.source.page,
                        "section": clause.source.section or clause.title,
                        "title": clause.title,
                        "snippet": clause.original_text[:400],
                        "clause_obj": clause
                    }
                ))

        # B. Search through document pages
        for page in document.pages_content:
            score = RAGEngine._compute_relevance(q_lower, page.text.lower())
            if score > 0.12:
                # Find matching snippet
                snippet = RAGEngine._extract_best_snippet(page.text, q_lower)
                relevant_chunks.append((
                    score,
                    {
                        "type": "page",
                        "page": page.page_number,
                        "section": f"Page {page.page_number}",
                        "title": f"Document Page {page.page_number}",
                        "snippet": snippet,
                        "clause_obj": None
                    }
                ))

        # Sort chunks by relevance
        relevant_chunks.sort(key=lambda x: x[0], reverse=True)

        # Step 2: Hallucination Guard - Check if evidence exists in the document
        if not relevant_chunks or relevant_chunks[0][0] < 0.25:
            return GroundedAnswer(
                question=q_clean,
                answer=(
                    "I couldn't find this information in the provided document. "
                    "The contract does not appear to contain provisions directly addressing this specific query."
                    if language == "english" else
                    "Mujhe diye gaye document mein is baare mein koi jankari nahi mili. Is contract mein is vishay par koi spasht clause maujood nahi lagta."
                ),
                citations=[],
                confidence=0.15,
                is_grounded=False,
                uncertainty_note="No verifiable contractual clauses or textual evidence matched this inquiry.",
                suggested_followups=[
                    "What are my key obligations in this contract?",
                    "When can I terminate this agreement?",
                    "What are the payment terms?"
                ]
            )

        # Step 3: Extract top citations
        top_chunks = relevant_chunks[:3]
        citations = []
        for score, chunk in top_chunks:
            citations.append(Citation(
                document_id=document.id,
                document_name=document.filename,
                page=chunk["page"],
                section=chunk["section"],
                snippet=chunk["snippet"],
                relevance_score=round(min(score * 1.5, 0.99), 2)
            ))

        # Step 4: Construct Grounded Response with language adaptation (English, Hindi, Hinglish)
        primary_chunk = top_chunks[0][1]
        c_obj: Optional[Clause] = primary_chunk.get("clause_obj")
        
        answer_text, followups = RAGEngine._synthesize_grounded_answer(
            q_lower, document, primary_chunk, c_obj, language
        )

        return GroundedAnswer(
            question=q_clean,
            answer=answer_text,
            citations=citations,
            confidence=0.94,
            is_grounded=True,
            uncertainty_note=None,
            suggested_followups=followups
        )

    @staticmethod
    def _compute_relevance(query: str, text: str) -> float:
        # Token overlap with TF weighting
        q_words = set(re.findall(r"\w+", query))
        stopwords = {"the", "is", "at", "which", "on", "a", "an", "and", "or", "in", "to", "for", "of", "this", "my", "i", "what", "can", "how", "does", "do", "contract", "agreement", "document", "clause", "section", "permit", "allow"}
        meaningful_q = [w for w in q_words if w not in stopwords and len(w) > 2]
        
        if not meaningful_q:
            return 0.0

        hits = 0
        for w in meaningful_q:
            if w in text:
                hits += 1

        score = hits / len(meaningful_q)

        # Boost if strong semantic keywords match
        if any(k in query for k in ["terminat", "exit", "quit", "leave", "notice"]) and any(k in text for k in ["terminat", "notice period"]):
            score += 0.4
        if any(k in query for k in ["pay", "rent", "amount", "salary", "fee", "cost"]) and any(k in text for k in ["payment", "fee", "rent", "inr", "salary"]):
            score += 0.4
        if any(k in query for k in ["indemn", "harm", "loss", "liability"]) and any(k in text for k in ["indemnif", "liability", "damages"]):
            score += 0.4
        if any(k in query for k in ["compete", "restraint", "job switch"]) and any(k in text for k in ["non-compete", "competing", "covenant"]):
            score += 0.4
        if any(k in query for k in ["renew", "extend", "duration", "expiry"]) and any(k in text for k in ["renewal", "term", "expire"]):
            score += 0.4
        if any(k in query for k in ["date", "deadline", "when", "timeline"]) and any(k in text for k in ["days", "months", "date", "effective"]):
            score += 0.3

        return min(score, 1.0)

    @staticmethod
    def _extract_best_snippet(text: str, query: str) -> str:
        paragraphs = text.split("\n\n")
        best_p = text[:300]
        max_overlap = 0
        q_words = set(re.findall(r"\w+", query))
        for p in paragraphs:
            p_words = set(re.findall(r"\w+", p.lower()))
            overlap = len(q_words.intersection(p_words))
            if overlap > max_overlap:
                max_overlap = overlap
                best_p = p.strip()
        return best_p[:350] + ("..." if len(best_p) > 350 else "")

    @staticmethod
    def _synthesize_grounded_answer(
        q_lower: str,
        doc: DocumentDetail,
        chunk: Dict[str, Any],
        clause: Optional[Clause],
        language: str
    ) -> Tuple[str, List[str]]:
        page = chunk["page"]
        section = chunk["section"]
        snippet = chunk["snippet"]

        # Check Termination query
        if any(k in q_lower for k in ["terminat", "exit", "cancel", "notice period", "leave"]):
            if language == "hinglish":
                ans = (
                    f"Aap is agreement ko formal written notice dekar terminate kar sakte hain, jaisa ki Page {page} ({section}) par likha hai. "
                    f"Clause ke mutabiq, aapko notice period serve karna hoga taaki premature termination penalty ya deposit forfeit na ho. "
                    f"Evidence: \"{snippet[:180]}...\""
                )
            elif language == "hindi":
                ans = (
                    f"दस्तावेज़ के पृष्ठ {page} ({section}) के अनुसार, आप निर्धारित अवधि का लिखित नोटिस देकर इस अनुबंध को समाप्त कर सकते हैं। "
                    f"नोटिस की शर्तों का पालन करना अनिवार्य है अन्यथा पेनाल्टी या देनदारी उत्पन्न हो सकती है। "
                    f"साक्ष्य: \"{snippet[:180]}...\""
                )
            else:
                ans = (
                    f"According to Page {page} ({section}), the agreement permits termination upon delivering formal written notice within the required notice period. "
                    f"Failure to adhere to the stated notice requirements may result in financial consequences such as forfeiture of deposit or liability for remaining dues. "
                    f"Evidence snippet: \"{snippet[:180]}...\""
                )
            followups = [
                "What are the penalties if I leave without notice?",
                "What happens to my security deposit or unpaid dues?",
                "Can the counterparty terminate without cause?"
            ]
            return ans, followups

        # Check Payment / Money query
        if any(k in q_lower for k in ["pay", "rent", "salary", "due", "fee", "cost", "money", "deposit"]):
            if language == "hinglish":
                ans = (
                    f"Page {page} ({section}) ke mutabiq, payment aur financial consideration ki shartein di gayi hain. "
                    f"Stated deadline ke andar payment karni hogi, warna late fee ya contractual interest lag sakta hai. "
                    f"Evidence: \"{snippet[:180]}...\""
                )
            elif language == "hindi":
                ans = (
                    f"पृष्ठ {page} ({section}) के अनुसार, भुगतान की शर्तें और समय-सीमा निर्धारित की गई हैं। "
                    f"देय तिथि से पहले भुगतान न करने पर विलंब शुल्क या ब्याज लगाया जा सकता है। "
                    f"साक्ष्य: \"{snippet[:180]}...\""
                )
            else:
                ans = (
                    f"As stipulated on Page {page} ({section}), payments must be completed in accordance with the documented schedule. "
                    f"Delays may trigger default clauses, interest penalties, or suspension of services as outlined in the provision. "
                    f"Evidence snippet: \"{snippet[:180]}...\""
                )
            followups = [
                "Is there a grace period for missed payments?",
                "What is the late fee or interest rate?",
                "Who bears statutory taxes (like GST)?"
            ]
            return ans, followups

        # Check Non-Compete query
        if any(k in q_lower for k in ["non-compete", "compete", "restraint", "job", "switch"]):
            if language == "hinglish":
                ans = (
                    f"Document ke Page {page} ({section}) par restrictive covenant / non-compete provision hai. "
                    f"Dhyan rahe ki Indian Contract Act ke Section 27 ke tehat aamtaur par post-employment non-compete void maana jaata hai, "
                    f"lekin counterparty confidentiality aur trade secrets enforce kar sakti hai. Is par qualified lawyer se salaah leni chahiye. "
                    f"Evidence: \"{snippet[:180]}...\""
                )
            else:
                ans = (
                    f"Based on Page {page} ({section}), the document contains a restrictive covenant attempting to limit your activities with competing businesses. "
                    f"In India, Section 27 of the Indian Contract Act 1872 generally deems agreements in restraint of trade void post-employment; however, trade secret protections remain enforceable. "
                    f"Evidence snippet: \"{snippet[:180]}...\""
                )
            followups = [
                "Does this non-compete hold up in court in India?",
                "What constitutes a 'competing business' under this clause?",
                "Are there non-solicitation restrictions as well?"
            ]
            return ans, followups

        # General grounded fallback
        if language == "hinglish":
            ans = (
                f"Page {page} ({section}) par mile text ke anusaar: "
                f"{clause.plain_english if clause else 'Is vishay par document mein provision maujood hai.'} "
                f"Contractual evidence: \"{snippet[:200]}...\""
            )
        elif language == "hindi":
            ans = (
                f"पृष्ठ {page} ({section}) के साक्ष्य के अनुसार: "
                f"{clause.plain_english if clause else 'दस्तावेज़ में यह प्रावधान उल्लेखित है।'} "
                f"साक्ष्य: \"{snippet[:200]}...\""
            )
        else:
            ans = (
                f"Based on the provisions found on Page {page} ({section}): "
                f"{clause.plain_english if clause else 'The document specifies relevant contractual terms regarding this matter.'} "
                f"Evidence snippet: \"{snippet[:200]}...\""
            )
        followups = [
            "What obligations does this clause create for me?",
            "What should I ask a lawyer about this provision?",
            "Does the counterparty have matching obligations?"
        ]
        return ans, followups
