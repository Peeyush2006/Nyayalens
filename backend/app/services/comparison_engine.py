import uuid
from typing import List, Dict, Any, Optional
from app.models.schemas import (
    DocumentDetail, ComparisonResult, ClauseComparisonDiff,
    ComparisonCategory, DiffType, Clause
)

class ContractComparisonEngine:
    @staticmethod
    def compare_documents(doc_a: DocumentDetail, doc_b: DocumentDetail) -> ComparisonResult:
        diffs: List[ClauseComparisonDiff] = []
        
        # Build lookup maps by clause type
        a_map: Dict[str, Clause] = {c.clause_type: c for c in doc_a.clauses}
        b_map: Dict[str, Clause] = {c.clause_type: c for c in doc_b.clauses}
        
        all_types = list(dict.fromkeys(list(a_map.keys()) + list(b_map.keys())))
        
        total_changes = 0
        
        for c_type in all_types:
            c_a = a_map.get(c_type)
            c_b = b_map.get(c_type)
            
            category = ContractComparisonEngine._map_category(c_type)
            
            # Case 1: Removed in Doc B
            if c_a and not c_b:
                total_changes += 1
                diffs.append(ClauseComparisonDiff(
                    id=f"diff-{uuid.uuid4().hex[:8]}",
                    category=category,
                    diff_type=DiffType.REMOVED,
                    title=f"{c_a.title} (Removed)",
                    doc_a_clause=c_a.original_text,
                    doc_b_clause=None,
                    what_changed=f"The provision '{c_a.title}' present in {doc_a.filename} was completely removed in {doc_b.filename}.",
                    who_is_affected="Removes protections or covenants previously agreed upon.",
                    what_to_review="Verify whether the omission was intentional and whether it leaves a contractual void regarding this subject matter.",
                    significance="High - Deletion of standard terms alters baseline legal rights."
                ))
            
            # Case 2: Added in Doc B
            elif not c_a and c_b:
                total_changes += 1
                diffs.append(ClauseComparisonDiff(
                    id=f"diff-{uuid.uuid4().hex[:8]}",
                    category=category,
                    diff_type=DiffType.ADDED,
                    title=f"{c_b.title} (New Addition)",
                    doc_a_clause=None,
                    doc_b_clause=c_b.original_text,
                    what_changed=f"A new clause '{c_b.title}' was introduced in {doc_b.filename} that was not present in {doc_a.filename}.",
                    who_is_affected="Imposes new rights, limitations, or obligations on one or both parties.",
                    what_to_review="Review the newly added language carefully to confirm whether it imposes unexpected liabilities or restrictions.",
                    significance="High - Introduces new contractual terms and risk exposures."
                ))
            
            # Case 3: Present in both - check for textual or semantic differences
            elif c_a and c_b:
                is_different, change_notes, affected, review_advice, sig = ContractComparisonEngine._analyze_difference(c_a, c_b)
                if is_different:
                    total_changes += 1
                    diffs.append(ClauseComparisonDiff(
                        id=f"diff-{uuid.uuid4().hex[:8]}",
                        category=category,
                        diff_type=DiffType.MODIFIED,
                        title=f"{c_b.title} (Modified Terms)",
                        doc_a_clause=c_a.original_text,
                        doc_b_clause=c_b.original_text,
                        what_changed=change_notes,
                        who_is_affected=affected,
                        what_to_review=review_advice,
                        significance=sig
                    ))

        # Generate overall executive summary of comparison
        summary = (
            f"Compared '{doc_a.filename}' with '{doc_b.filename}'. "
            f"Identified {total_changes} material differences across "
            f"{len(set(d.category for d in diffs))} key categories. "
            f"Review flagged modifications to notice periods, indemnities, and liability limits."
        )

        return ComparisonResult(
            id=f"comp-{uuid.uuid4().hex[:8]}",
            doc_a_id=doc_a.id,
            doc_a_name=doc_a.filename,
            doc_b_id=doc_b.id,
            doc_b_name=doc_b.filename,
            summary_of_changes=summary,
            total_changes=total_changes,
            diffs=diffs
        )

    @staticmethod
    def _map_category(clause_type: str) -> ComparisonCategory:
        c = clause_type.lower()
        if c in ["payment_terms", "security_deposit"]:
            return ComparisonCategory.FINANCIAL
        elif c in ["termination", "lock_in_period", "term_and_renewal"]:
            return ComparisonCategory.TERMINATION
        elif c in ["indemnification", "limitation_of_liability"]:
            return ComparisonCategory.LIABILITY
        elif c in ["confidentiality", "data_privacy"]:
            return ComparisonCategory.PRIVACY
        elif c in ["dispute_resolution", "governing_law"]:
            return ComparisonCategory.DISPUTE_RESOLUTION
        elif c in ["non_compete", "non_solicitation", "intellectual_property"]:
            return ComparisonCategory.OBLIGATIONS
        return ComparisonCategory.OTHER

    @staticmethod
    def _analyze_difference(c_a: Clause, c_b: Clause):
        text_a = c_a.original_text.strip()
        text_b = c_b.original_text.strip()
        
        # Exact match
        if text_a == text_b:
            return False, "", "", "", ""

        # Specific analysis based on clause type
        if c_a.clause_type == "termination":
            return (
                True,
                "Changes detected in notice requirements, termination grounds, or breach remedy windows.",
                "Affects both parties' exit flexibility and timing constraints.",
                "Compare the number of days of prior written notice required and check for unilateral termination clauses.",
                "Critical - Directly impacts ability to exit the agreement without penalty."
            )
        elif c_a.clause_type == "limitation_of_liability":
            return (
                True,
                "Changes in financial cap amounts, exclusion of consequential damages, or carve-outs.",
                "Affects maximum monetary recovery in the event of contractual breach or negligence.",
                "Confirm whether the liability ceiling applies reciprocally to both parties or disproportionately protects one party.",
                "Critical - Sets the boundaries of financial risk exposure."
            )
        elif c_a.clause_type == "indemnification":
            return (
                True,
                "Modification in the scope of third-party indemnities, defense obligations, or attorney fees.",
                "Shifts legal defense obligations and loss absorption onto the indemnifying party.",
                "Check if indirect or consequential claims are included and whether negligence standards were altered.",
                "High Attention - Potential for open-ended financial liability."
            )
        elif c_a.clause_type in ["payment_terms", "security_deposit"]:
            return (
                True,
                "Adjustments to fee amounts, deposit retention rules, or payment milestone schedules.",
                "Directly alters financial commitments, cash flow deadlines, and default penalties.",
                "Review payment deadlines, invoice dispute procedures, and penalty interest rates.",
                "High Attention - Direct financial impact."
            )
        else:
            return (
                True,
                f"Textual variations detected between the two versions of the {c_a.title}.",
                "Alters the formal definitions or procedural covenants governing this clause.",
                "Examine the redline differences to ensure legal parity is maintained.",
                "Moderate - Revision of contractual wording."
            )
