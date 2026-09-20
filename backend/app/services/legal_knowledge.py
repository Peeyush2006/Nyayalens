from typing import List, Optional, Dict, Any
from app.models.schemas import LegalConcept

INDIA_LEGAL_DATABASE: List[Dict[str, Any]] = [
    {
        "term": "Indemnity",
        "plain_meaning": "A contractual promise by one party to compensate the other for specified loss or damage caused by the conduct of the promisor or a third party.",
        "why_it_matters": "Indemnity clauses can shift huge financial liabilities and legal defense expenses onto you. Under Indian law, an indemnified party can claim damages even before incurring actual out-of-pocket loss once liability becomes absolute.",
        "common_in": ["Employment Contracts", "Vendor Agreements", "SaaS SLAs", "Leases"],
        "statutory_framework": "Section 124 of the Indian Contract Act, 1872 defines a contract of indemnity as a contract by which one party promises to save the other from loss caused to him by the conduct of the promisor himself, or by the conduct of any other person.",
        "india_code_reference": "Indian Contract Act, 1872 (Act No. 9 of 1872), Section 124 & 125",
        "case_law_doctrine": "Gajanan Moreshwar Parelkar v. Moreshwar Madan Mantri (1942 Bom LR) held that the indemnified party can compel the indemnifier to place him in a position to meet the liability before actual payment.",
        "sample_clause": "\"The Service Provider shall indemnify, defend, and hold harmless the Client against any third-party claims arising from a breach of warranties or intellectual property infringement.\""
    },
    {
        "term": "Non-Compete Covenants (Section 27)",
        "plain_meaning": "A contractual restriction preventing an employee or contractor from engaging in or establishing a competing business during or after termination.",
        "why_it_matters": "While employers frequently include post-employment non-compete clauses, Indian courts consistently hold that any agreement restraining a person from exercising a lawful profession, trade, or business is void.",
        "common_in": ["Employment Agreements", "Consultancy Contracts", "Co-Founder Agreements"],
        "statutory_framework": "Section 27 of the Indian Contract Act, 1872 states: 'Every agreement by which any one is restrained from exercising a lawful profession, trade or business of any kind, is to that extent void.'",
        "india_code_reference": "Indian Contract Act, 1872, Section 27 (Agreement in restraint of trade, void)",
        "case_law_doctrine": "Percept D'Mark (India) (P) Ltd. v. Zaheer Khan (2006 4 SCC 227) & Niranjan Shankar Golikari v. Century Spg. & Mfg. Co. Ltd. (AIR 1967 SC 1098) - Negative covenants operative during the period of contract are valid, but post-contract restraints are void under Section 27.",
        "sample_clause": "\"Employee covenants that for a period of 12 months following cessation of employment, they shall not engage in any competing software development business within India.\""
    },
    {
        "term": "Force Majeure",
        "plain_meaning": "A provision relieving parties from contractual liabilities when extraordinary, unforeseeable events outside their reasonable control make performance impossible or impracticable.",
        "why_it_matters": "Prevents breach of contract claims during wars, natural disasters, floods, epidemics, or sudden statutory government prohibitions.",
        "common_in": ["Commercial Leases", "Construction Contracts", "Supply Chain Agreements"],
        "statutory_framework": "Under Indian law, Force Majeure operates as a contractual clause. Where no clause exists, the doctrine of frustration under Section 56 of the Indian Contract Act, 1872 applies, discharging the contract if performance becomes impossible or unlawful.",
        "india_code_reference": "Indian Contract Act, 1872, Section 32 (Contingent contracts) and Section 56 (Agreement to do impossible act)",
        "case_law_doctrine": "Energy Watchdog v. CERC (2017 14 SCC 80) affirmed that force majeure clauses are strictly construed; mere commercial unviability or price escalation does not constitute frustration.",
        "sample_clause": "\"Neither party shall be liable for failure or delay in performing obligations if such failure arises from acts of God, flood, pandemic, or civil disturbance beyond reasonable control.\""
    },
    {
        "term": "Arbitration & Dispute Resolution",
        "plain_meaning": "A private, legally binding method of resolving disputes outside traditional government courts through independent arbitrators.",
        "why_it_matters": "Arbitration can be faster and confidential, but private arbitrator fees and administrative costs can be significant for individuals. Under Indian law, an arbitral award has the force of a civil court decree.",
        "common_in": ["Partnership Deeds", "Employment Agreements", "SaaS Agreements", "Commercial Contracts"],
        "statutory_framework": "Arbitration and Conciliation Act, 1996 (as amended in 2015, 2019, 2021) based on the UNCITRAL Model Law.",
        "india_code_reference": "Arbitration and Conciliation Act, 1996 (Act No. 26 of 1996), Section 7 (Arbitration agreement) & Section 8",
        "case_law_doctrine": "Vidya Drolia v. Durga Trading Corporation (2021 2 SCC 1) established the four-fold test for arbitrability of disputes in India.",
        "sample_clause": "\"Any dispute or difference arising out of or in connection with this contract shall be referred to and finally resolved by sole arbitration in accordance with the Arbitration and Conciliation Act, 1996. The seat shall be New Delhi.\""
    },
    {
        "term": "Liquidated Damages vs Penalty",
        "plain_meaning": "A pre-determined monetary amount specified in the agreement to be paid as compensation if one party breaches the contract.",
        "why_it_matters": "Unlike English common law, Indian courts under Section 74 of the Contract Act do not enforce punitive penalties; only 'reasonable compensation' up to the stipulated sum is awarded upon proof of actual or genuine loss.",
        "common_in": ["Employment Lock-In Clauses", "Construction Contracts", "Non-Disclosure Agreements"],
        "statutory_framework": "Section 74 of the Indian Contract Act, 1872 (Compensation for breach of contract where penalty stipulated for).",
        "india_code_reference": "Indian Contract Act, 1872, Section 74",
        "case_law_doctrine": "Kailash Nath Associates v. DDA (2015 4 SCC 136) held that reasonable compensation is the measure of damages; where loss is quantifiable, it must be proven before forfeiture is permitted.",
        "sample_clause": "\"In the event Employee terminates employment during the lock-in period, Employee agrees to pay INR 2,00,000 as liquidated damages representing training and replacement expenditure.\""
    },
    {
        "term": "Data Fiduciary Obligations (DPDP Act 2023)",
        "plain_meaning": "Legal obligations imposed on entities that determine the purpose and means of processing personal identifiable digital data.",
        "why_it_matters": "Entities collecting data must obtain informed, unambiguous consent, implement reasonable security safeguards, and promptly report data breaches to the Data Protection Board and affected users.",
        "common_in": ["Privacy Policies", "SaaS Master Subscription Agreements", "Consumer Terms of Service"],
        "statutory_framework": "Digital Personal Data Protection Act, 2023 (DPDP Act 2023, Act No. 22 of 2023).",
        "india_code_reference": "DPDP Act, 2023, Section 4 (Grounds for processing) & Section 8 (General obligations of Data Fiduciary)",
        "case_law_doctrine": "Justice K.S. Puttaswamy (Retd.) v. Union of India (2017 10 SCC 1) recognized the fundamental right to privacy under Article 21 of the Constitution of India.",
        "sample_clause": "\"The Company shall process all personal data strictly in compliance with the Digital Personal Data Protection Act, 2023, ensuring encryption at rest and in transit.\""
    },
    {
        "term": "Employee vs Independent Contractor",
        "plain_meaning": "The legal distinction between a hired worker subject to direct supervision and control (employee) versus a self-employed professional contracted for a specific deliverable (independent contractor).",
        "why_it_matters": "Misclassification carries substantial liability for unpaid provident fund (PF), gratuity, state insurance (ESIC), and labour law benefits.",
        "common_in": ["Consultancy Agreements", "Freelance Service Contracts", "Gig Work Terms"],
        "statutory_framework": "Code on Social Security, 2020; Industrial Disputes Act, 1947; Employees' Provident Funds and Miscellaneous Provisions Act, 1952.",
        "india_code_reference": "Labour Codes framework; Section 2(s) of Industrial Disputes Act, 1947 (Workman definition)",
        "case_law_doctrine": "Sushilaben Indravadan Gandhi v. New India Assurance Co. Ltd. (2021 7 SCC 151) applied the modern multi-factor test of economic reality, integration, and control.",
        "sample_clause": "\"The relationship of Consultant to Company is that of an independent contractor. Nothing herein shall be construed to create an employer-employee, agency, or joint venture relationship.\""
    }
]

class LegalKnowledgeService:
    @staticmethod
    def get_concepts(jurisdiction: str = "India") -> List[LegalConcept]:
        return [LegalConcept(**c) for c in INDIA_LEGAL_DATABASE]

    @staticmethod
    def search_concept(query: str, jurisdiction: str = "India") -> List[LegalConcept]:
        q = query.lower().strip()
        matched = []
        for item in INDIA_LEGAL_DATABASE:
            text_corpus = (item["term"] + " " + item["plain_meaning"] + " " + item["why_it_matters"] + " " + item["statutory_framework"]).lower()
            if q in text_corpus or any(w in text_corpus for w in q.split() if len(w) > 3):
                matched.append(LegalConcept(**item))
        if not matched:
            matched = [LegalConcept(**c) for c in INDIA_LEGAL_DATABASE[:3]]
        return matched
