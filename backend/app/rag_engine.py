"""
FAISS Vector Database & Groq API RAG Engine for Indian Coal Mining Regulations.

Provides:
1. FAISS IndexFlatIP vector indexing of statutory regulations (CMR 2017, Mines Act 1952, DGMS circulars, etc.)
2. Top-k semantic legal clause retrieval
3. Groq API integration (LLaMA-3) for high-speed, grounded regulatory intelligence
4. Smart fallback synthesis if Groq API key is not supplied
"""

from __future__ import annotations

import os
import re
import numpy as np
from typing import Any, Optional
from sqlalchemy.orm import Session

import faiss
from sklearn.feature_extraction.text import TfidfVectorizer

from app.database import DBRegulation, SessionLocal


class StatutoryRAGEngine:
    def __init__(self, dimension: int = 512):
        self.dimension = dimension
        self.vectorizer = TfidfVectorizer(
            max_features=dimension,
            stop_words="english",
            ngram_range=(1, 2),
            norm="l2",
        )
        self.index: Optional[faiss.IndexFlatIP] = None
        self.clauses: list[dict[str, Any]] = []
        self._is_indexed = False

    def build_index(self, db: Session) -> int:
        """Fetch all regulatory clauses from DB and build FAISS vector index."""
        regs = db.query(DBRegulation).all()
        if not regs:
            return 0

        self.clauses = []
        corpus = []
        for reg in regs:
            text_repr = (
                f"{reg.act_name} {reg.clause_number} {reg.obligation_type} "
                f"{reg.filing_type_required} {reg.clause_text} severity:{reg.severity}"
            )
            corpus.append(text_repr)
            self.clauses.append({
                "id": reg.id,
                "act_name": reg.act_name,
                "clause_number": reg.clause_number,
                "obligation_type": reg.obligation_type,
                "filing_type_required": reg.filing_type_required,
                "clause_text": reg.clause_text,
                "severity": reg.severity,
                "applies_when": reg.applies_when,
            })

        # Fit TF-IDF and convert to dense float32 array
        tfidf_matrix = self.vectorizer.fit_transform(corpus).toarray().astype("float32")
        
        # In case actual features are less than dimension, pad with zeros
        actual_features = tfidf_matrix.shape[1]
        if actual_features < self.dimension:
            padding = np.zeros((tfidf_matrix.shape[0], self.dimension - actual_features), dtype="float32")
            tfidf_matrix = np.hstack([tfidf_matrix, padding])
        elif actual_features > self.dimension:
            tfidf_matrix = tfidf_matrix[:, :self.dimension]

        # Normalize vectors for cosine similarity (Inner Product)
        faiss.normalize_L2(tfidf_matrix)

        # Build FAISS IndexFlatIP (Inner Product = Cosine similarity for normalized vectors)
        self.index = faiss.IndexFlatIP(self.dimension)
        self.index.add(tfidf_matrix)
        self._is_indexed = True

        return len(self.clauses)

    def search_regulations(self, query: str, top_k: int = 4, db: Optional[Session] = None) -> list[dict[str, Any]]:
        """Search top-k most relevant regulations in FAISS vector store."""
        if not self._is_indexed:
            if db is None:
                db_session = SessionLocal()
                try:
                    self.build_index(db_session)
                finally:
                    db_session.close()
            else:
                self.build_index(db)

        if not self.index or self.index.ntotal == 0:
            return []

        # Vectorize query
        q_vec = self.vectorizer.transform([query]).toarray().astype("float32")
        actual_features = q_vec.shape[1]
        if actual_features < self.dimension:
            padding = np.zeros((1, self.dimension - actual_features), dtype="float32")
            q_vec = np.hstack([q_vec, padding])
        elif actual_features > self.dimension:
            q_vec = q_vec[:, :self.dimension]

        faiss.normalize_L2(q_vec)

        k = min(top_k, self.index.ntotal)
        scores, indices = self.index.search(q_vec, k)

        results = []
        for rank, idx in enumerate(indices[0]):
            if idx < 0 or idx >= len(self.clauses):
                continue
            clause = self.clauses[idx].copy()
            clause["similarity_score"] = float(scores[0][rank])
            results.append(clause)

        return results

    def query_with_rag(
        self,
        query: str,
        groq_api_key: Optional[str] = None,
        db: Optional[Session] = None,
    ) -> dict[str, Any]:
        """Execute full RAG pipeline: FAISS retrieval + Groq LLM synthesis."""
        top_clauses = self.search_regulations(query, top_k=4, db=db)
        api_key = groq_api_key or os.environ.get("GROQ_API_KEY")

        # Format retrieved context
        context_blocks = []
        for i, c in enumerate(top_clauses, 1):
            context_blocks.append(
                f"[{i}] {c['act_name']} — {c['clause_number']} ({c['obligation_type'].upper()})\n"
                f"Required Filing: {c['filing_type_required']}\n"
                f"Statutory Text: {c['clause_text']}\n"
                f"Severity: {c['severity']}"
            )
        context_str = "\n\n".join(context_blocks)

        sources = [
            {
                "act": c["act_name"],
                "clause": c["clause_number"],
                "filing_type": c["filing_type_required"],
                "score": round(c["similarity_score"], 3),
                "severity": c["severity"],
            }
            for c in top_clauses
        ]

        if not api_key:
            # Try to read from backend/.env or parent .env if not in os.environ
            env_paths = [
                os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
                os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
                os.path.join(os.getcwd(), ".env"),
                os.path.join(os.getcwd(), "backend", ".env"),
            ]
            for ep in env_paths:
                if os.path.exists(ep):
                    with open(ep, "r", encoding="utf-8") as f:
                        for line in f:
                            if line.startswith("GROQ_API_KEY="):
                                api_key = line.strip().split("=", 1)[1].strip().strip('"').strip("'")
                                os.environ["GROQ_API_KEY"] = api_key
                                break
                if api_key:
                    break

        if api_key:
            try:
                from groq import Groq
                client = Groq(api_key=api_key)

                system_prompt = (
                    "You are Aegis-AI, the official Autonomous Statutory Compliance and Regulatory Intelligence "
                    "System developed for the Ministry of Coal, Government of India and the Directorate General of Mines "
                    "Safety (DGMS), Dhanbad for Smart India Hackathon (SIH 2026).\n\n"
                    "Your mission is to provide authoritative, unambiguous statutory guidance across:\n"
                    "1. The Mines Act, 1952 (Sections 22, 22A, 23, 72B, 73 penalties)\n"
                    "2. Coal Mines Regulations, 2017 (CMR 2017 - Safety Management Plans Reg 104, Slope Stability Reg 106, Ventilation Reg 153, Dust Plans Reg 124)\n"
                    "3. DGMS Technical Circulars and Standard Operating Procedures\n"
                    "4. MoEF&CC Environmental Clearance (EC) / SPCB Consent to Operate (CTO) statutory conditions\n"
                    "5. Mines Rules 1955 (Labor welfare, canteen, creche, medical Form O examinations)\n\n"
                    "Guidelines:\n"
                    "- Provide precise citations (Act name, regulation/section number, mandatory submission frequency).\n"
                    "- Note legal penalties for non-compliance (stop-work notices, compounding fees, prosecution under Sec 72B/73).\n"
                    "- Respond clearly with professional markdown structure, bullet points, and actionable colliery compliance steps.\n"
                    "- If the query is in Hindi or Hinglish, answer in clear Hindi/Hinglish with English statutory terms."
                )

                user_prompt = (
                    f"User Query: {query}\n\n"
                    f"--- STATUTORY LEGAL CONTEXT RETRIEVED VIA FAISS VECTOR DATABASE ---\n"
                    f"{context_str}\n\n"
                    "Provide an authoritative, clear, and actionable statutory compliance answer for the mine management/DGMS inspector:"
                )

                candidate_models = [
                    "qwen/qwen3.8-27b",
                    "openai/gpt-oss-120b",
                    "llama-3.3-70b-versatile",
                    "llama-3.1-8b-instant",
                    "groq/compound",
                ]

                answer = None
                used_model = None
                last_err = None

                for model_candidate in candidate_models:
                    try:
                        response = client.chat.completions.create(
                            model=model_candidate,
                            messages=[
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt},
                            ],
                            temperature=0.2,
                            max_tokens=1024,
                        )
                        answer = response.choices[0].message.content
                        used_model = model_candidate
                        break
                    except Exception as model_err:
                        last_err = model_err
                        continue

                if answer:
                    return {
                        "answer": answer,
                        "sources": sources,
                        "confidence": 0.98,
                        "engine": f"Groq Hardware-Accelerated ({used_model}) + FAISS Vector Store",
                    }
                else:
                    raise last_err or Exception("All Groq models failed")

            except Exception as e:
                # Fallback to local synthesis if Groq call encounters error
                error_msg = str(e)
                fallback_answer = self._generate_extractive_fallback(query, top_clauses, note=f"Groq API note: {error_msg}")
                return {
                    "answer": fallback_answer,
                    "sources": sources,
                    "confidence": 0.82,
                    "engine": "FAISS Vector Store (Extractive Fallback)",
                }

        # No Groq API Key provided — use FAISS Extractive Legal Synthesis
        answer = self._generate_extractive_fallback(query, top_clauses)
        return {
            "answer": answer,
            "sources": sources,
            "confidence": 0.85,
            "engine": "FAISS Vector Store (Semantic Extraction)",
        }

    def _generate_extractive_fallback(
        self, query: str, top_clauses: list[dict[str, Any]], note: Optional[str] = None
    ) -> str:
        """Create structured synthesis when Groq API key is absent."""
        if not top_clauses:
            return (
                "No statutory regulations matched your query closely. "
                "Please verify the query terms (e.g. 'Safety Management Plan', 'Reg. 104', 'Air Quality', 'Ventilation')."
            )

        lines = [
            f"### 🛡️ Statutory Regulatory Analysis (FAISS Vector Retrieval)\n",
            f"Based on semantic search over indexed statutory statutes for Indian coal mines, here are the applicable provisions:\n",
        ]

        if note:
            lines.append(f"> [!NOTE]\n> {note}\n")

        for idx, c in enumerate(top_clauses, 1):
            badge = c['severity'].upper()
            lines.append(
                f"#### {idx}. {c['act_name']} — **{c['clause_number']}** `[{badge}]`\n"
                f"* **Category**: {c['obligation_type'].title()}\n"
                f"* **Mandatory Filing**: `{c['filing_type_required']}`\n"
                f"* **Statutory Mandate**: {c['clause_text']}\n"
            )

        lines.append(
            "\n---\n"
            "💡 *Tip: Provide a Groq API Key in settings for dynamic LLaMA-3 multi-turn reasoning and conversational summaries.*"
        )
        return "\n".join(lines)


# Singleton RAG instance
rag_engine = StatutoryRAGEngine()
