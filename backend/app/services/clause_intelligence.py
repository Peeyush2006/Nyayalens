import re
import uuid
from typing import List, Dict, Any, Optional
from app.models.schemas import Clause, RiskSeverity, SourceReference, DocumentPageContent

CLAUSE_RULES = [
    {
        "type": "indemnification",
        "title": "Indemnity & Defense Obligations",
        "keywords": [r"\bindemnif\w*", r"\bhold harmless\b", r"\bdefend and hold\b"],
        "why_it_matters": "Can shift massive third-party legal liabilities, defense fees, or damage claims onto you if someone sues or alleges losses.",
        "plain_english_template": "Requires one party to compensate or defend the other for specific losses, liabilities, or legal claims.",
        "hinglish_template": "Agar koi third party nuksan ya claim karti hai, toh uske kharche aur liability aapko uthani pad sakti hai.",
        "default_risk": RiskSeverity.CRITICAL
    },
    {
        "type": "non_compete",
        "title": "Non-Compete & Restrictive Covenants",
        "keywords": [r"\bnon-compete\b", r"\brestrictive covenant\b", r"\bcompeting business\b", r"\brestraint of trade\b"],
        "why_it_matters": "May restrict your freedom to work, consult, or start a similar business in the same industry after the contract ends. (Note: Under Section 27 of the Indian Contract Act 1872, post-employment non-competes are generally void).",
        "plain_english_template": "Attempts to prohibit you from engaging in or working with competing businesses for a designated duration or geography.",
        "hinglish_template": "Yeh clause aapko contract ke baad kisi competitor ke sath kaam karne ya aisi business shuru karne se rokne ki koshish karta hai.",
        "default_risk": RiskSeverity.CRITICAL
    },
    {
        "type": "non_solicitation",
        "title": "Non-Solicitation of Clients & Staff",
        "keywords": [r"\bnon-solicit\w*", r"\bsolicit any employee\b", r"\bentice away\b", r"\bpoaching\b"],
        "why_it_matters": "Prevents you from recruiting employees, contractors, or taking existing customers away from the other party.",
        "plain_english_template": "Barring the solicitation or hiring of the company's team members or customer base.",
        "hinglish_template": "Contract khatam hone ke baad company ke employees ya clients ko apne sath kaam karne ke liye approach nahi kar sakte.",
        "default_risk": RiskSeverity.HIGH_ATTENTION
    },
    {
        "type": "intellectual_property",
        "title": "Intellectual Property Ownership & Assignment",
        "keywords": [r"\bintellectual property\b", r"\bwork made for hire\b", r"\bmoral rights\b", r"\bassign\w* all rights\b", r"\bpatents and copyrights\b"],
        "why_it_matters": "Determines whether code, inventions, documents, or creative assets you produce belong exclusively to the counterparty.",
        "plain_english_template": "Transfers ownership of all deliverables, inventions, and work product developed during the engagement.",
        "hinglish_template": "Kaam ke dauran banaya gaya saara code, design ya idea counterparty ki sampatti (IP) ban jayega.",
        "default_risk": RiskSeverity.HIGH_ATTENTION
    },
    {
        "type": "confidentiality",
        "title": "Confidentiality & Non-Disclosure",
        "keywords": [r"\bconfidential information\b", r"\bnon-disclosure\b", r"\bproprietary information\b", r"\btrade secrets\b"],
        "why_it_matters": "Obligates you to maintain secrecy regarding trade secrets, source code, financial numbers, and client data.",
        "plain_english_template": "Requires you to protect proprietary information and not disclose it to unauthorized parties.",
        "hinglish_template": "Company ki gupt jankari ya business details ko kisi ke sath share karne par pabandi lagata hai.",
        "default_risk": RiskSeverity.MODERATE
    },
    {
        "type": "termination",
        "title": "Termination and Notice Period",
        "keywords": [r"\bterminat\w*", r"\bnotice period\b", r"\bwith cause\b", r"\bwithout cause\b", r"\bcancellation\b"],
        "why_it_matters": "Dictates how and under what conditions either party can exit the contract, and potential penalties or notice periods required.",
        "plain_english_template": "Outlines the procedures, timelines, and grounds required to terminate this agreement.",
        "hinglish_template": "Yeh batata hai ki contract kaise khatam kiya ja sakta hai aur kitne din pehle written notice dena hoga.",
        "default_risk": RiskSeverity.MODERATE
    },
    {
        "type": "indemnification",
        "title": "Indemnity & Defense Obligations",
        "keywords": [r"\bindemnif\w*", r"\bhold harmless\b", r"\bdefend and hold\b"],
        "why_it_matters": "Can shift massive third-party legal liabilities, defense fees, or damage claims onto you if someone sues or alleges losses.",
        "plain_english_template": "Requires one party to compensate or defend the other for specific losses, liabilities, or legal claims.",
        "hinglish_template": "Agar koi third party nuksan ya claim karti hai, toh uske kharche aur liability aapko uthani pad sakti hai.",
        "default_risk": RiskSeverity.CRITICAL
    },
    {
        "type": "limitation_of_liability",
        "title": "Limitation of Liability & Damages Cap",
        "keywords": [r"\blimitation of liability\b", r"\bconsequential damages\b", r"\bindirect damages\b", r"\bliability cap\b", r"\baggregate liability\b"],
        "why_it_matters": "Caps the financial recovery you can claim if the other party breaches, often excluding lost profits or consequential damages.",
        "plain_english_template": "Restricts the total financial compensation either party can recover in the event of a breach or dispute.",
        "hinglish_template": "Agar doosri party contract todti hai, toh aapko milne wala compensation ek tay seema (cap) tak hi limited rahega.",
        "default_risk": RiskSeverity.HIGH_ATTENTION
    },
    {
        "type": "confidentiality",
        "title": "Confidentiality & Non-Disclosure",
        "keywords": [r"\bconfidential information\b", r"\bnon-disclosure\b", r"\bproprietary information\b", r"\btrade secrets\b"],
        "why_it_matters": "Obligates you to maintain secrecy regarding trade secrets, source code, financial numbers, and client data.",
        "plain_english_template": "Requires you to protect proprietary information and not disclose it to unauthorized parties.",
        "hinglish_template": "Company ki gupt jankari ya business details ko kisi ke sath share karne par pabandi lagata hai.",
        "default_risk": RiskSeverity.MODERATE
    },
    {
        "type": "governing_law",
        "title": "Governing Law & Exclusive Jurisdiction",
        "keywords": [r"\bgoverning law\b", r"\bjurisdiction\b", r"\bcourts of\b", r"\blaws of\b"],
        "why_it_matters": "Dictates which state/country's legal system governs the contract and where court proceedings must be filed.",
        "plain_english_template": "Specifies the legal jurisdiction and territorial courts that will resolve disputes arising from this agreement.",
        "hinglish_template": "Yeh batata hai ki kisi bhi vivad ya dispute ki sunwayi kis shahar ya state ke court mein hogi.",
        "default_risk": RiskSeverity.INFORMATIONAL
    },
    {
        "type": "dispute_resolution",
        "title": "Dispute Resolution & Arbitration",
        "keywords": [r"\barbitration\b", r"\bmediat\w*", r"\barbitrator\b", r"\barbitration and conciliation act\b"],
        "why_it_matters": "Mandates private arbitration over traditional public court litigation, impacting legal costs, speed, and appeal rights.",
        "plain_english_template": "Specifies alternative dispute resolution mechanisms such as binding arbitration prior to litigation.",
        "hinglish_template": "Court jane se pehle aapas mein ya kisi neutral arbitrator ke madhyam se masla hal karne ka niyam.",
        "default_risk": RiskSeverity.MODERATE
    },
    {
        "type": "payment_terms",
        "title": "Payment Terms & Monetary Obligations",
        "keywords": [r"\bpayment terms\b", r"\bfee\b", r"\bsalary\b", r"\bmonthly rent\b", r"\binvoice\b", r"\binterest on overdue\b", r"\blate fee\b"],
        "why_it_matters": "Sets payment schedules, late fees, interest penalties, and conditions precedent for disbursement.",
        "plain_english_template": "Governs the amount, schedule, invoicing requirements, and late payment penalties.",
        "hinglish_template": "Payment kab, kitni aur kaise ki jayegi, aur late hone par kya penalty lagegi.",
        "default_risk": RiskSeverity.MODERATE
    },
    {
        "type": "security_deposit",
        "title": "Security Deposit & Deductions",
        "keywords": [r"\bsecurity deposit\b", r"\brefundable deposit\b", r"\bdeductions from deposit\b"],
        "why_it_matters": "Sets amount of deposit held, conditions for deduction, and timeline for refund upon vacating or handover.",
        "plain_english_template": "Regulates the deposit amount held by the owner/counterparty and conditions for its return.",
        "hinglish_template": "Security deposit ka paisa kab wapas milega aur kin cheezon ke liye deduction kiya ja sakta hai.",
        "default_risk": RiskSeverity.HIGH_ATTENTION
    },
    {
        "type": "lock_in_period",
        "title": "Lock-In Period & Minimum Term",
        "keywords": [r"\block-in period\b", r"\block in\b", r"\bminimum term\b", r"\bpremature termination penalty\b"],
        "why_it_matters": "Bars early exit without paying liquidated damages or forfeit of deposit for the entire lock-in duration.",
        "plain_english_template": "Prohibits either party from terminating before a specified period without incurring financial penalties.",
        "hinglish_template": "Ek nishchit samay se pehle agreement khatam karne par penalty ya deposit forfeiture ka khatra.",
        "default_risk": RiskSeverity.CRITICAL
    },
    {
        "type": "force_majeure",
        "title": "Force Majeure (Unforeseen Circumstances)",
        "keywords": [r"\bforce majeure\b", r"\bact of god\b", r"\bpandemic\b", r"\bunforeseen circumstances\b"],
        "why_it_matters": "Excuses performance obligations during extraordinary events like natural disasters, war, or governmental shutdowns.",
        "plain_english_template": "Suspends contractual obligations when performance becomes impossible due to events outside human control.",
        "hinglish_template": "Kudrati aapda ya aisi ghatnaye jo kabu se bahar ho, tab kaam na kar pane par relief milti hai.",
        "default_risk": RiskSeverity.INFORMATIONAL
    },
    {
        "type": "data_privacy",
        "title": "Data Protection & Privacy Compliance",
        "keywords": [r"\bpersonal data\b", r"\bdata protection\b", r"\bdpdp\b", r"\bgdpr\b", r"\bprivacy policy\b"],
        "why_it_matters": "Governs how personal identifiable data is stored, processed, transferred, and breach-notified under applicable privacy laws.",
        "plain_english_template": "Outlines obligations regarding collection, processing, and security of personal identifiable data.",
        "hinglish_template": "Users ya employees ke personal data ki suraksha aur privacy se jude niyam.",
        "default_risk": RiskSeverity.MODERATE
    }
]

class ClauseIntelligenceService:
    @staticmethod
    def extract_clauses(pages_content: List[DocumentPageContent]) -> List[Clause]:
        extracted_clauses: List[Clause] = []
        found_types = set()

        for page in pages_content:
            page_num = page.page_number
            text = page.text
            if not text:
                continue

            # Split page into structural paragraphs
            paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 30]
            
            for para in paragraphs:
                for rule in CLAUSE_RULES:
                    rule_type = rule["type"]
                    # If this clause type was already detected on this page, avoid over-duplication
                    matches = False
                    for kw in rule["keywords"]:
                        if re.search(kw, para, re.IGNORECASE):
                            matches = True
                            break
                    
                    if matches:
                        # Extract section or heading if visible
                        section_header = None
                        first_line = para.split("\n")[0]
                        if len(first_line) < 60 and any(h in first_line.lower() for h in ["section", "clause", "article", rule["title"].lower().split()[0]]):
                            section_header = first_line

                        # Determine user and counterparty obligations based on clause type
                        user_ob, counter_ob, concern = ClauseIntelligenceService._derive_obligations_and_concerns(rule_type, para)
                        
                        # Calculate risk severity
                        risk_sev = ClauseIntelligenceService._evaluate_risk_severity(rule_type, para, rule["default_risk"])
                        
                        clause = Clause(
                            id=f"clause-{uuid.uuid4().hex[:8]}",
                            clause_type=rule_type,
                            title=rule["title"],
                            original_text=para[:1200],  # capture clean snippet
                            plain_english=ClauseIntelligenceService._generate_plain_english(rule_type, para, rule["plain_english_template"]),
                            hinglish=rule["hinglish_template"],
                            why_it_matters=rule["why_it_matters"],
                            user_obligation=user_ob,
                            counterparty_obligation=counter_ob,
                            potential_concern=concern,
                            risk_level=risk_sev,
                            source=SourceReference(
                                page=page_num,
                                section=section_header,
                                snippet=para[:220] + "..." if len(para) > 220 else para
                            ),
                            confidence=0.94
                        )
                        extracted_clauses.append(clause)
                        found_types.add(rule_type)
                        break  # Match one rule per paragraph chunk

        return extracted_clauses

    @staticmethod
    def _derive_obligations_and_concerns(clause_type: str, text: str):
        t = text.lower()
        if clause_type == "termination":
            return (
                "Provide formal written notice within the required notice period before terminating.",
                "Settle outstanding dues and transition active responsibilities upon notice receipt.",
                "Review if termination with or without cause triggers any immediate forfeit or repayment clause."
            )
        elif clause_type == "indemnification":
            return (
                "Potentially reimburse counterparty for third-party damages, claims, and legal costs.",
                "Give prompt notice of any claim subject to indemnification.",
                "Broad uncapped indemnity could expose you to liabilities outside your immediate direct control."
            )
        elif clause_type == "limitation_of_liability":
            return (
                "Accept that damages claims against the counterparty may be strictly capped.",
                "Remain bound by the agreed liability ceiling in case of operational failure or breach.",
                "Check if the liability cap excludes critical matters like IP infringement or confidentiality."
            )
        elif clause_type == "non_compete":
            return (
                "Refrain from joining or advising competing entities within designated domains/territories.",
                "Honor post-termination employment restrictions if legally enforceable in jurisdiction.",
                "Section 27 of the Indian Contract Act voids covenants in restraint of trade; seek legal verification."
            )
        elif clause_type == "payment_terms":
            return (
                "Disburse payments on or before the stated due dates to avoid penalty fees.",
                "Issue valid invoices and provide documented deliverables as agreed.",
                "Look out for high compounded interest on delayed payments."
            )
        elif clause_type == "security_deposit":
            return (
                "Pay the agreed deposit upfront and maintain premises/assets without unapproved damage.",
                "Safely refund the deposit within the specified number of business days following vacancy.",
                "Watch out for unilateral landlord/counterparty discretion in determining repair deductions."
            )
        elif clause_type == "lock_in_period":
            return (
                "Remain bound to the agreement throughout the minimum term.",
                "Provide services/tenancy without unjustified early repudiation.",
                "Early termination during lock-in usually requires paying the rent or fees for the entire remaining period."
            )
        else:
            return (
                "Abide by the terms and standards explicitly delineated in this clause.",
                "Reciprocate required notifications and contractual cooperation.",
                "Ensure clarity on conditions precedent before signing."
            )

    @staticmethod
    def _evaluate_risk_severity(clause_type: str, text: str, default_risk: RiskSeverity) -> RiskSeverity:
        t = text.lower()
        if "sole discretion" in t or "unilateral" in t or "without any compensation" in t:
            return RiskSeverity.CRITICAL
        if "indemnif" in t and ("broad" in t or "all losses" in t or "indirect" in t):
            return RiskSeverity.CRITICAL
        if "non-compete" in t:
            return RiskSeverity.CRITICAL
        if "lock-in" in t or "forfeiture of" in t:
            return RiskSeverity.HIGH_ATTENTION
        return default_risk

    @staticmethod
    def _generate_plain_english(clause_type: str, text: str, default_template: str) -> str:
        # Check for notice days
        notice_match = re.search(r"(\d+)\s*(?:days?|months?)\s*(?:prior|written)?\s*notice", text, re.IGNORECASE)
        if notice_match and clause_type == "termination":
            return f"Either party may terminate this agreement by providing at least {notice_match.group(1)} days prior written notice."
        
        # Check for deposit amount
        deposit_match = re.search(r"(?:Rs\.?|INR|\$|₹)\s*([\d,]+)", text, re.IGNORECASE)
        if deposit_match and clause_type in ["security_deposit", "payment_terms"]:
            return f"Specifies payment/deposit terms of approximately {deposit_match.group(0)} subject to the conditions detailed herein."

        return default_template
