import uuid
import re
from typing import List
from app.models.schemas import Clause, ObligationItem, ObligationStatus

class ObligationTrackerService:
    @staticmethod
    def extract_obligations(clauses: List[Clause]) -> List[ObligationItem]:
        obligations: List[ObligationItem] = []
        
        for clause in clauses:
            t = clause.original_text.lower()
            
            # Check 1: Notice of Termination
            if clause.clause_type == "termination":
                notice_match = re.search(r"(\d+)\s*(?:days?|months?)\s*(?:prior|written)?\s*notice", clause.original_text, re.IGNORECASE)
                days = notice_match.group(1) if notice_match else "30"
                unit = "months" if "month" in clause.original_text.lower() else "days"
                obligations.append(ObligationItem(
                    id=f"ob-{uuid.uuid4().hex[:8]}",
                    task=f"Serve written notice at least {days} {unit} prior to intending to terminate agreement",
                    responsible_party="Either Party",
                    deadline=f"{days} {unit} before exit",
                    source_clause="Termination & Notice Provision",
                    page_number=clause.source.page,
                    consequence_of_breach="Premature exit without notice may result in forfeiture of deposit or salary in lieu of notice",
                    status=ObligationStatus.PENDING
                ))

            # Check 2: Payment / Rent Obligation
            elif clause.clause_type in ["payment_terms", "security_deposit"]:
                day_match = re.search(r"(?:on or before|by|prior to)\s*(?:the)?\s*(\d{1,2}(?:st|nd|rd|th)?)\s*(?:day)?\s*(?:of each month)?", clause.original_text, re.IGNORECASE)
                deadline_str = f"By the {day_match.group(1)} of every calendar month" if day_match else "Per agreed invoice schedule"
                obligations.append(ObligationItem(
                    id=f"ob-{uuid.uuid4().hex[:8]}",
                    task="Disburse agreed payments/fees on or before the due date",
                    responsible_party="Paying Party / User",
                    deadline=deadline_str,
                    source_clause="Payment & Consideration Clause",
                    page_number=clause.source.page,
                    consequence_of_breach="Interest charge on overdue amounts, late fees, or contractual default proceedings",
                    status=ObligationStatus.PENDING
                ))

            # Check 3: Return of Company Property / Vacating Premise
            elif any(w in t for w in ["return of materials", "return of property", "vacate", "handover", "surrender"]):
                day_match = re.search(r"within\s*(\d+)\s*(?:business)?\s*days", clause.original_text, re.IGNORECASE)
                deadline_str = f"Within {day_match.group(1)} days of termination" if day_match else "Promptly upon termination"
                obligations.append(ObligationItem(
                    id=f"ob-{uuid.uuid4().hex[:8]}",
                    task="Return all proprietary assets, confidential files, devices, or keys to counterparty",
                    responsible_party="User / Departing Party",
                    deadline=deadline_str,
                    source_clause="Post-Termination Covenants & Asset Handover",
                    page_number=clause.source.page,
                    consequence_of_breach="Withholding of final settlement, retention of deposit, or legal action for conversion",
                    status=ObligationStatus.PENDING
                ))

            # Check 4: Confidentiality maintenance
            elif clause.clause_type == "confidentiality":
                obligations.append(ObligationItem(
                    id=f"ob-{uuid.uuid4().hex[:8]}",
                    task="Maintain strict confidentiality over all proprietary data and trade secrets",
                    responsible_party="All Parties (Mutual)",
                    deadline="Ongoing (Survives termination for 2-5 years)",
                    source_clause="Confidentiality & Non-Disclosure Clause",
                    page_number=clause.source.page,
                    consequence_of_breach="Immediate injunctive relief, damages claim, and loss of contractual rights",
                    status=ObligationStatus.IN_PROGRESS
                ))

            # Check 5: Statutory Data Protection & Breach Notification
            elif clause.clause_type == "data_privacy":
                obligations.append(ObligationItem(
                    id=f"ob-{uuid.uuid4().hex[:8]}",
                    task="Promptly report any suspected data breach or security incident to the data fiduciary",
                    responsible_party="Data Processor / User",
                    deadline="Within 24 to 72 hours of discovery",
                    source_clause="Data Protection & Incident Reporting",
                    page_number=clause.source.page,
                    consequence_of_breach="Regulatory fines under the Digital Personal Data Protection (DPDP) framework",
                    status=ObligationStatus.PENDING
                ))

        # Fallback if few obligations extracted
        if len(obligations) < 3 and clauses:
            first_clause = clauses[0]
            obligations.append(ObligationItem(
                id=f"ob-{uuid.uuid4().hex[:8]}",
                task="Comply with all statutory regulations and contractual representations outlined in this agreement",
                responsible_party="Both Parties",
                deadline="Throughout contract tenure",
                source_clause=first_clause.title,
                page_number=first_clause.source.page,
                consequence_of_breach="Breach of contract actionable under the Indian Contract Act",
                status=ObligationStatus.PENDING
            ))

        return obligations
