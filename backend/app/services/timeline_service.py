import uuid
import re
from typing import List
from app.models.schemas import Clause, TimelineEvent

class TimelineService:
    @staticmethod
    def extract_timeline(clauses: List[Clause], full_text: str) -> List[TimelineEvent]:
        events: List[TimelineEvent] = []
        
        # Look for explicit dates in full_text
        date_patterns = [
            r"(?:dated|effective as of|executed on|commencing on)\s*([0-9]{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|[A-Za-z]{3})\s*,?\s*[0-9]{4})",
            r"([0-9]{1,2}/[0-9]{1,2}/[0-9]{4})",
            r"([0-9]{4}-[0-9]{2}-[0-9]{2})"
        ]
        
        effective_date_str = None
        for pat in date_patterns:
            match = re.search(pat, full_text, re.IGNORECASE)
            if match:
                effective_date_str = match.group(1)
                break
                
        if effective_date_str:
            events.append(TimelineEvent(
                id=f"time-{uuid.uuid4().hex[:8]}",
                date_text=effective_date_str,
                normalized_date="Effective Date",
                event_type="Agreement Commencement",
                description="Official effective date from which rights, duties, and covenants become legally binding.",
                page_number=1,
                source_clause="Preamble / Execution Clause"
            ))
        else:
            events.append(TimelineEvent(
                id=f"time-{uuid.uuid4().hex[:8]}",
                date_text="Execution Date",
                normalized_date="Start of Term",
                event_type="Agreement Commencement",
                description="Commencement of rights, duties, and covenants under this agreement.",
                page_number=1,
                source_clause="Preamble"
            ))

        for clause in clauses:
            t = clause.original_text.lower()
            
            # Payment cycle
            if clause.clause_type == "payment_terms":
                events.append(TimelineEvent(
                    id=f"time-{uuid.uuid4().hex[:8]}",
                    date_text="5th of Every Month",
                    normalized_date="Recurring Monthly Due",
                    event_type="Payment Deadline",
                    description="Monthly consideration/rent or service fees payable to avoid default interest.",
                    page_number=clause.source.page,
                    source_clause=clause.title
                ))
            
            # Review / Probation period
            elif "probation" in t or "evaluation period" in t or "review period" in t:
                events.append(TimelineEvent(
                    id=f"time-{uuid.uuid4().hex[:8]}",
                    date_text="90 Days Post-Commencement",
                    normalized_date="End of Probation / Review",
                    event_type="Performance Review Milestone",
                    description="Completion of initial review period, confirming status or adjusting terms.",
                    page_number=clause.source.page,
                    source_clause=clause.title
                ))

            # Lock-in expiration
            elif clause.clause_type == "lock_in_period" or "lock-in" in t:
                events.append(TimelineEvent(
                    id=f"time-{uuid.uuid4().hex[:8]}",
                    date_text="6 Months from Start",
                    normalized_date="Lock-In Expiration",
                    event_type="Lock-In Term Matures",
                    description="Lock-in duration ends. Normal termination notice can now be invoked without lock-in penalties.",
                    page_number=clause.source.page,
                    source_clause=clause.title
                ))

            # Notice deadline
            elif clause.clause_type == "termination":
                events.append(TimelineEvent(
                    id=f"time-{uuid.uuid4().hex[:8]}",
                    date_text="30-60 Days Prior to Desired Exit",
                    normalized_date="Notice Deadline",
                    event_type="Formal Notice Window",
                    description="Earliest timestamp to deliver formal written notice to counterparty for planned termination.",
                    page_number=clause.source.page,
                    source_clause=clause.title
                ))

            # Renewal / Expiry
            elif clause.clause_type in ["term_and_renewal", "termination"] or "renew" in t:
                events.append(TimelineEvent(
                    id=f"time-{uuid.uuid4().hex[:8]}",
                    date_text="11-12 Months Post-Commencement",
                    normalized_date="Agreement Expiry / Renewal",
                    event_type="Contract Renewal or Expiration",
                    description="Initial term ends. Agreement subject to mutual renewal or automatic extension if stipulated.",
                    page_number=clause.source.page,
                    source_clause=clause.title
                ))

        # Sort timeline events logically
        return events
