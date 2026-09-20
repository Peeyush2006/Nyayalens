import uuid
import re
from typing import List, Dict, Any, Tuple
from app.models.schemas import Clause, RiskFinding, RiskSeverity

class RiskRadarService:
    @staticmethod
    def analyze_risks(clauses: List[Clause]) -> Tuple[List[RiskFinding], int, Dict[str, int]]:
        risks: List[RiskFinding] = []
        breakdown = {
            RiskSeverity.CRITICAL.value: 0,
            RiskSeverity.HIGH_ATTENTION.value: 0,
            RiskSeverity.MODERATE.value: 0,
            RiskSeverity.INFORMATIONAL.value: 0
        }

        for clause in clauses:
            t = clause.original_text.lower()
            
            # Check 1: Non-compete restrictions
            if clause.clause_type == "non-compete" or "non-compete" in t:
                rf = RiskFinding(
                    id=f"risk-{uuid.uuid4().hex[:8]}",
                    title="Potentially Restrictive Non-Compete Provision",
                    severity=RiskSeverity.CRITICAL,
                    detected_issue="The document contains language attempting to restrict post-termination employment or business activities.",
                    why_it_matters="Such covenants can severely hinder your ability to seek employment in your domain or start a business. In Indian jurisprudence (Section 27 of the Indian Contract Act, 1872), post-employment non-compete clauses are generally treated as void as restraints of trade.",
                    potential_user_impact="You could face intimidation, threat of legal notice, or confusion regarding your right to switch jobs or freelance.",
                    source_clause_id=clause.id,
                    source_text=clause.source.snippet,
                    page_number=clause.source.page,
                    suggested_lawyer_question="Is this post-employment non-compete enforceable under applicable state and national law, and should we negotiate its deletion?"
                )
                risks.append(rf)
                breakdown[RiskSeverity.CRITICAL.value] += 1

            # Check 2: Broad / Unilateral Indemnification
            elif clause.clause_type == "indemnification" or "indemnif" in t:
                is_broad = any(w in t for w in ["all claims", "indirect", "consequential", "defend", "unlimited", "attorneys' fees"])
                sev = RiskSeverity.CRITICAL if is_broad else RiskSeverity.HIGH_ATTENTION
                rf = RiskFinding(
                    id=f"risk-{uuid.uuid4().hex[:8]}",
                    title="Unusually Broad Indemnification Obligation",
                    severity=sev,
                    detected_issue="The indemnity clause appears to require one party to cover a wide spectrum of third-party claims and defense costs.",
                    why_it_matters="If a third party files a lawsuit or claims damages against the counterparty, this provision might obligate you to pay their legal defense and settlement costs, even for events beyond your sole control.",
                    potential_user_impact="Potentially unbounded financial liability if legal disputes arise from work deliverables or software.",
                    source_clause_id=clause.id,
                    source_text=clause.source.snippet,
                    page_number=clause.source.page,
                    suggested_lawyer_question="Does this indemnity obligation expose me to liabilities beyond my direct willful misconduct or breach, and can we cap it?"
                )
                risks.append(rf)
                breakdown[sev.value] += 1

            # Check 3: Lock-In Period / Early Exit Penalty
            elif clause.clause_type == "lock_in_period" or "lock-in" in t:
                rf = RiskFinding(
                    id=f"risk-{uuid.uuid4().hex[:8]}",
                    title="Mandatory Lock-In Period with Exit Forfeiture",
                    severity=RiskSeverity.HIGH_ATTENTION,
                    detected_issue="A minimum mandatory commitment period is specified, restricting premature termination.",
                    why_it_matters="Exiting prior to the lock-in duration may lead to automatic forfeiture of security deposits or a contractual claim for all remaining unpaid months.",
                    potential_user_impact="You may be financially committed to pay the full term even if circumstances force you to vacate or leave early.",
                    source_clause_id=clause.id,
                    source_text=clause.source.snippet,
                    page_number=clause.source.page,
                    suggested_lawyer_question="Are there exceptions or force majeure grounds to terminate during the lock-in period without forfeiting the deposit?"
                )
                risks.append(rf)
                breakdown[RiskSeverity.HIGH_ATTENTION.value] += 1

            # Check 4: Unilateral Modification / Sole Discretion
            elif "sole discretion" in t or "without notice" in t or "unilateral" in t:
                rf = RiskFinding(
                    id=f"risk-{uuid.uuid4().hex[:8]}",
                    title="Unilateral Discretion or Modification Rights",
                    severity=RiskSeverity.HIGH_ATTENTION,
                    detected_issue="One party reserves the exclusive right to alter terms, policies, or make decisions with sole discretion.",
                    why_it_matters="Such provisions reduce contractual parity and leave the other party vulnerable to unexpected amendments.",
                    potential_user_impact="Terms, prices, or performance expectations may change without your explicit mutual consent.",
                    source_clause_id=clause.id,
                    source_text=clause.source.snippet,
                    page_number=clause.source.page,
                    suggested_lawyer_question="Can we require mutual written consent for any future amendments to these core terms?"
                )
                risks.append(rf)
                breakdown[RiskSeverity.HIGH_ATTENTION.value] += 1

            # Check 5: Limitation of Liability Cap Asymmetry
            elif clause.clause_type == "limitation_of_liability":
                rf = RiskFinding(
                    id=f"risk-{uuid.uuid4().hex[:8]}",
                    title="Capped Liability for Counterparty Breach",
                    severity=RiskSeverity.MODERATE,
                    detected_issue="The counterparty's financial liability is strictly limited (e.g. to fees paid in the last 1-3 months).",
                    why_it_matters="If the counterparty causes severe disruption, data loss, or breaches confidentiality, your financial recovery is constrained.",
                    potential_user_impact="Limited legal remedy or recovery in case of gross negligence or operational default.",
                    source_clause_id=clause.id,
                    source_text=clause.source.snippet,
                    page_number=clause.source.page,
                    suggested_lawyer_question="Is the liability limitation mutual, and does it preserve uncapped liability for confidentiality and gross negligence?"
                )
                risks.append(rf)
                breakdown[RiskSeverity.MODERATE.value] += 1

            # Check 6: Exclusive Jurisdiction in Distant City
            elif clause.clause_type == "governing_law" and ("exclusive jurisdiction" in t or "courts of" in t):
                rf = RiskFinding(
                    id=f"risk-{uuid.uuid4().hex[:8]}",
                    title="Designated Exclusive Judicial Forum",
                    severity=RiskSeverity.INFORMATIONAL,
                    detected_issue="Exclusive dispute resolution is designated to courts of a specific city or jurisdiction.",
                    why_it_matters="Litigating or filing claims will require hiring counsel and appearing in that specific geographical forum.",
                    potential_user_impact="Increased logistical and travel expenses if litigation or court intervention becomes necessary.",
                    source_clause_id=clause.id,
                    source_text=clause.source.snippet,
                    page_number=clause.source.page,
                    suggested_lawyer_question="Does this jurisdiction choice pose significant practical inconvenience or cost hurdles for me?"
                )
                risks.append(rf)
                breakdown[RiskSeverity.INFORMATIONAL.value] += 1

        # Calculate weighted composite risk score (0 to 100)
        # Critical = 30 pts, High Attention = 15 pts, Moderate = 8 pts, Informational = 2 pts
        raw_score = (
            breakdown[RiskSeverity.CRITICAL.value] * 30 +
            breakdown[RiskSeverity.HIGH_ATTENTION.value] * 18 +
            breakdown[RiskSeverity.MODERATE.value] * 9 +
            breakdown[RiskSeverity.INFORMATIONAL.value] * 3
        )
        risk_score = min(max(raw_score, 12 if clauses else 0), 96)

        return risks, risk_score, breakdown
