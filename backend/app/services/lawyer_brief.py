import datetime
from typing import Dict, Any, List
from app.models.schemas import DocumentDetail, LawyerConsultationBrief

class LawyerBriefService:
    @staticmethod
    def generate_brief(document: DocumentDetail, user_notes: str = "") -> LawyerConsultationBrief:
        now_str = datetime.datetime.now().strftime("%d %B %Y, %H:%M")
        
        # 1. Key issues from Critical and High Attention risks
        key_issues = [
            f"[{r.severity.value}] {r.title}: {r.detected_issue} (Page {r.page_number})"
            for r in document.risks
            if r.severity.value in ["Critical", "High Attention"]
        ]
        if not key_issues and document.risks:
            key_issues = [f"{r.title} (Page {r.page_number})" for r in document.risks[:3]]

        # 2. Important clauses
        important_clauses = [
            {
                "title": c.title,
                "page": c.source.page,
                "summary": c.plain_english,
                "risk": c.risk_level.value,
                "why_it_matters": c.why_it_matters
            }
            for c in document.clauses[:6]
        ]

        # 3. User obligations
        user_obligations = [
            {
                "task": ob.task,
                "deadline": ob.deadline,
                "consequence": ob.consequence_of_breach or "Contractual default",
                "page": ob.page_number
            }
            for ob in document.obligations
        ]

        # 4. Questions to ask a lawyer
        questions_to_ask = [r.suggested_lawyer_question for r in document.risks if r.suggested_lawyer_question]
        if len(questions_to_ask) < 4:
            questions_to_ask.extend([
                "Are there any standard statutory protections or implied warranties that this agreement attempts to waive?",
                "Is the dispute resolution and arbitration mechanism cost-effective for an individual in this jurisdiction?",
                "Does the termination clause adequately protect my rights if the counterparty fails to fulfill its commitments?"
            ])

        # 5. Missing information
        missing_info = [
            "Specific service level agreements (SLAs) or operational remedy benchmarks are not quantified.",
            "Detailed procedure for handling intellectual property created prior to this agreement (background IP) is undefined.",
            "Statutory notice mechanism (registered post vs email) should be explicitly verified."
        ]

        # 6. Ambiguous provisions
        ambiguous = [
            "Subjective standards such as 'reasonable commercial efforts' or 'sole discretion' without objective metrics.",
            "Broad definition of 'Confidential Information' without specifying marking requirements or expiration timelines."
        ]

        # 7. Timeline / critical deadlines
        critical_deadlines = [
            {
                "milestone": ev.event_type,
                "date_text": ev.date_text,
                "description": ev.description,
                "page": ev.page_number
            }
            for ev in document.timeline
        ]

        # 8. Recommended documents to bring to consultation
        recommended_docs = [
            f"Original signed copy or latest draft of '{document.filename}'",
            "Prior communications, emails, offer letters, or WhatsApp exchanges discussing commercial terms",
            "Proof of payments, bank transaction receipts, or security deposit vouchers (if applicable)",
            "Government photo identification and proof of address for notarization or vakalatnama"
        ]

        disclaimer = (
            "NyayaLens provides legal information and document assistance, not legal advice. "
            "AI-generated analysis may be incomplete or incorrect. "
            "This briefing dossier is designed solely to structure your consultation with a qualified legal professional."
        )

        return LawyerConsultationBrief(
            document_id=document.id,
            document_name=document.filename,
            document_type=document.doc_type,
            generated_at=now_str,
            executive_summary=document.executive_summary,
            key_issues=key_issues,
            important_clauses=important_clauses,
            user_obligations=user_obligations,
            questions_to_ask_lawyer=questions_to_ask[:8],
            missing_information=missing_info,
            ambiguous_provisions=ambiguous,
            critical_deadlines=critical_deadlines,
            recommended_documents_to_bring=recommended_docs,
            user_notes=user_notes,
            disclaimer=disclaimer
        )

    @staticmethod
    def generate_markdown(brief: LawyerConsultationBrief) -> str:
        md = []
        md.append(f"# Prepare for Legal Consultation: Briefing Dossier")
        md.append(f"**Document**: {brief.document_name} ({brief.document_type})  ")
        md.append(f"**Generated via NyayaLens on**: {brief.generated_at}\n")
        md.append(f"> **Notice**: {brief.disclaimer}\n")
        
        md.append("## 1. Executive Summary")
        md.append(brief.executive_summary + "\n")
        
        md.append("## 2. Key Issues Requiring Counsel Review")
        for issue in brief.key_issues:
            md.append(f"- {issue}")
        md.append("")

        md.append("## 3. Important Clauses & Potential Concerns")
        for cl in brief.important_clauses:
            md.append(f"### {cl['title']} (Page {cl['page']}) — Risk: {cl['risk']}")
            md.append(f"*{cl['summary']}*  ")
            md.append(f"**Why it matters**: {cl['why_it_matters']}\n")

        md.append("## 4. Key Obligations Imposed on You")
        for ob in brief.user_obligations:
            md.append(f"- **{ob['task']}** (Deadline: {ob['deadline']}, Page {ob['page']})  ")
            md.append(f"  *Consequence of default*: {ob['consequence']}")
        md.append("")

        md.append("## 5. Suggested Questions to Ask Your Lawyer")
        for idx, q in enumerate(brief.questions_to_ask_lawyer, 1):
            md.append(f"{idx}. {q}")
        md.append("")

        md.append("## 6. Missing or Omitted Information")
        for m in brief.missing_information:
            md.append(f"- {m}")
        md.append("")

        md.append("## 7. Ambiguous or Vague Provisions")
        for a in brief.ambiguous_provisions:
            md.append(f"- {a}")
        md.append("")

        md.append("## 8. Critical Deadlines Timeline")
        for dl in brief.critical_deadlines:
            md.append(f"- **{dl['milestone']}** ({dl['date_text']}, Page {dl['page']}): {dl['description']}")
        md.append("")

        md.append("## 9. Documents to Bring to the Consultation")
        for doc in brief.recommended_documents_to_bring:
            md.append(f"- [ ] {doc}")
        md.append("")

        md.append("## 10. Your Personal Consultation Notes")
        md.append(brief.user_notes if brief.user_notes.strip() else "*No notes added by user.*")
        md.append("")

        return "\n".join(md)
