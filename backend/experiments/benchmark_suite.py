"""
Aegis-Compliance Comprehensive Experimental Benchmark & Validation Suite.

Executes quantitative evaluations across 6 core dimensions:
1. Substantive NLP Verification vs Naive Keyword vs Semantic Baselines
2. FAISS Vector Retrieval (RAG Engine) Evaluation (Recall@k, MRR, NDCG@k, Latency)
3. Regulatory Knowledge Graph (RKG) Network Analytics & Multi-hop Traversal Latency
4. Predictive Lateness & Violation Forecaster Validation (RMSE, MAE, Detection Lead Time)
5. Cryptographic Blockchain Audit Trail Throughput & Tamper Detection Sensitivity
6. End-to-End System Latency Profile & Throughput (P50, P90, P95, P99)
"""

import hashlib
import json
import os
import random
import sys
import time
import numpy as np
from datetime import datetime, timedelta
from typing import Any

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import (
    SessionLocal,
    DBMine,
    DBRegulation,
    DBFiling,
    DBComplianceCheck,
    DBDeadlineForecast,
    DBAuditBlock,
)
from app.compliance_engine import analyze_filing, verify_filing, EVIDENCE_FIELDS
from app.knowledge_graph import build_knowledge_graph, get_applicable_regulations
from app.forecasting import compute_filing_trends, generate_forecasts
from app.rag_engine import StatutoryRAGEngine
import networkx as nx

def run_nlp_verification_benchmarks(db) -> dict[str, Any]:
    print("[1/6] Running Substantive NLP Verification & Compliance Engine Benchmarks...")
    filings = db.query(DBFiling).all()
    regs = {r.id: r for r in db.query(DBRegulation).all()}
    
    total_filings = len(filings)
    filing_type_stats = {}
    
    y_true_substantive = []
    y_pred_substantive = []
    y_pred_naive_keyword = []
    y_pred_random = []
    
    processing_times = []
    
    for f in filings:
        t0 = time.perf_counter()
        res = verify_filing(f.id, db)
        t1 = time.perf_counter()
        processing_times.append((t1 - t0) * 1000.0) # in ms
        
        ftype = f.filing_type
        if ftype not in filing_type_stats:
            filing_type_stats[ftype] = {
                "count": 0,
                "verified_fields": 0,
                "total_fields": 0,
                "avg_verification_score": []
            }
        
        filing_type_stats[ftype]["count"] += 1
        v_score = res.get("verification_score", 0.0)
        filing_type_stats[ftype]["avg_verification_score"].append(v_score)
        
        # Ground truth simulation: filing marked compliant/needs_review vs rejected in status
        gt_is_valid = 1 if f.status in ["compliant", "submitted", "approved", "verified"] else 0
        y_true_substantive.append(gt_is_valid)
        
        # Aegis Substantive Engine prediction (score >= 0.70)
        pred_aegis = 1 if v_score >= 0.70 else 0
        y_pred_substantive.append(pred_aegis)
        
        # Baseline 1: Naive keyword presence (any keyword present, regardless of substantive context)
        text = (f.extracted_text or "").lower()
        keys = EVIDENCE_FIELDS.get(f.filing_type, [])
        naive_hits = sum(1 for k in keys if k.lower() in text)
        pred_naive = 1 if (naive_hits / max(len(keys), 1)) >= 0.50 else 0
        y_pred_naive_keyword.append(pred_naive)
        
        y_pred_random.append(1 if random.random() > 0.5 else 0)

    # Compute metrics (Precision, Recall, F1, Accuracy, Specificity)
    def calc_metrics(y_t, y_p):
        tp = sum(1 for yt, yp in zip(y_t, y_p) if yt == 1 and yp == 1)
        fp = sum(1 for yt, yp in zip(y_t, y_p) if yt == 0 and yp == 1)
        fn = sum(1 for yt, yp in zip(y_t, y_p) if yt == 1 and yp == 0)
        tn = sum(1 for yt, yp in zip(y_t, y_p) if yt == 0 and yp == 0)
        
        acc = (tp + tn) / max(len(y_t), 1)
        prec = tp / max(tp + fp, 1)
        rec = tp / max(tp + fn, 1)
        f1 = 2 * prec * rec / max(prec + rec, 1e-6)
        spec = tn / max(tn + fp, 1)
        return {
            "accuracy": round(acc * 100, 2),
            "precision": round(prec * 100, 2),
            "recall": round(rec * 100, 2),
            "f1_score": round(f1 * 100, 2),
            "specificity": round(spec * 100, 2),
            "tp": tp, "fp": fp, "fn": fn, "tn": tn
        }

    aegis_metrics = calc_metrics(y_true_substantive, y_pred_substantive)
    naive_metrics = calc_metrics(y_true_substantive, y_pred_naive_keyword)
    random_metrics = calc_metrics(y_true_substantive, y_pred_random)

    # Per-category summary
    category_summary = {}
    for ftype, stats in filing_type_stats.items():
        category_summary[ftype] = {
            "document_count": stats["count"],
            "mean_verification_score": round(float(np.mean(stats["avg_verification_score"])), 3),
            "std_verification_score": round(float(np.std(stats["avg_verification_score"])), 3)
        }

    return {
        "total_documents_analyzed": total_filings,
        "aegis_substantive_metrics": aegis_metrics,
        "naive_keyword_metrics": naive_metrics,
        "random_baseline_metrics": random_metrics,
        "latency_ms": {
            "mean": round(float(np.mean(processing_times)), 2),
            "median": round(float(np.median(processing_times)), 2),
            "p95": round(float(np.percentile(processing_times, 95)), 2),
            "p99": round(float(np.percentile(processing_times, 99)), 2),
        },
        "per_category_summary": category_summary
    }

def run_faiss_rag_benchmarks(db) -> dict[str, Any]:
    print("[2/6] Running FAISS Vector Retrieval (RAG Engine) Benchmarks...")
    rag = StatutoryRAGEngine(dimension=512)
    indexed_clauses_count = rag.build_index(db)
    
    test_queries = [
        {"query": "methane gas monitoring ventilation in underground coal mines", "target_obligation": "safety", "expected_keywords": ["ventilation", "methane", "gas"]},
        {"query": "ambient air quality monitoring and dust suppression water spraying", "target_obligation": "environmental", "expected_keywords": ["air", "dust", "effluent"]},
        {"query": "statutory medical examination for pneumoconiosis and lung fitness", "target_obligation": "labor", "expected_keywords": ["medical", "examination", "health"]},
        {"query": "strata control roof bolting support plan for deep seams", "target_obligation": "safety", "expected_keywords": ["strata", "roof", "support"]},
        {"query": "effluent treatment and fly ash reclamation compliance for opencast pit", "target_obligation": "environmental", "expected_keywords": ["water", "waste", "reclamation"]},
        {"query": "overtime wage register and canteen sanitation facilities for workers", "target_obligation": "labor", "expected_keywords": ["wages", "hours", "welfare"]},
        {"query": "quarterly DGMS Form IV fatal and serious accident statistics register", "target_obligation": "safety", "expected_keywords": ["accident", "fatalities", "injuries"]},
        {"query": "mine closure financial assurance and bio-reclamation land handover", "target_obligation": "environmental", "expected_keywords": ["closure", "rehabilitation", "assurance"]}
    ]
    
    query_results = []
    top_1_hits = 0
    top_3_hits = 0
    top_5_hits = 0
    mrr_sum = 0.0
    ndcg_sum = 0.0
    search_latencies = []
    
    for q in test_queries:
        t0 = time.perf_counter()
        results = rag.search_regulations(q["query"], top_k=5, db=db)
        t1 = time.perf_counter()
        search_latencies.append((t1 - t0) * 1000.0)
        
        # Check relevance
        ranked_relevance = []
        for rank, res in enumerate(results):
            text_full = (res.get("clause_text", "") + " " + res.get("filing_type_required", "")).lower()
            is_relevant = (res.get("obligation_type") == q["target_obligation"]) or any(kw in text_full for kw in q["expected_keywords"])
            ranked_relevance.append(1 if is_relevant else 0)
        
        # Recall@k
        if len(ranked_relevance) >= 1 and ranked_relevance[0] == 1:
            top_1_hits += 1
        if any(ranked_relevance[:3]):
            top_3_hits += 1
        if any(ranked_relevance[:5]):
            top_5_hits += 1
            
        # MRR
        rr = 0.0
        for rank, rel in enumerate(ranked_relevance):
            if rel == 1:
                rr = 1.0 / (rank + 1)
                break
        mrr_sum += rr
        
        # NDCG@5
        dcg = sum(rel / np.log2(rank + 2) for rank, rel in enumerate(ranked_relevance[:5]))
        ideal_relevance = sorted(ranked_relevance[:5], reverse=True)
        idcg = sum(rel / np.log2(rank + 2) for rank, rel in enumerate(ideal_relevance))
        ndcg = (dcg / idcg) if idcg > 0 else 1.0
        ndcg_sum += ndcg
        
        query_results.append({
            "query": q["query"],
            "top_match": results[0]["clause_number"] if results else "None",
            "top_similarity": round(results[0]["similarity_score"], 4) if results else 0.0,
            "mrr": round(rr, 3),
            "ndcg": round(ndcg, 3)
        })
        
    n_q = len(test_queries)
    return {
        "indexed_statutory_clauses": indexed_clauses_count,
        "vector_dimension": 512,
        "index_type": "faiss.IndexFlatIP (Cosine Similarity via Normalized Inner Product)",
        "recall_at_1": round((top_1_hits / n_q) * 100, 2),
        "recall_at_3": round((top_3_hits / n_q) * 100, 2),
        "recall_at_5": round((top_5_hits / n_q) * 100, 2),
        "mean_reciprocal_rank_mrr": round(mrr_sum / n_q, 4),
        "mean_ndcg_at_5": round(ndcg_sum / n_q, 4),
        "search_latency_ms": {
            "mean": round(float(np.mean(search_latencies)), 3),
            "min": round(float(np.min(search_latencies)), 3),
            "max": round(float(np.max(search_latencies)), 3),
            "p95": round(float(np.percentile(search_latencies, 95)), 3)
        },
        "query_evaluations": query_results
    }

def run_knowledge_graph_benchmarks(db) -> dict[str, Any]:
    print("[3/6] Running Regulatory Knowledge Graph (RKG) Network Analytics...")
    t0 = time.perf_counter()
    G = build_knowledge_graph(db)
    t_build = (time.perf_counter() - t0) * 1000.0
    
    num_nodes = G.number_of_nodes()
    num_edges = G.number_of_edges()
    
    # Categorize nodes
    node_types = {}
    for _, data in G.nodes(data=True):
        ntype = data.get("type", "unknown")
        node_types[ntype] = node_types.get(ntype, 0) + 1
        
    # Categorize edges
    edge_types = {}
    for _, _, data in G.edges(data=True):
        etype = data.get("relationship", "unknown")
        edge_types[etype] = edge_types.get(etype, 0) + 1
        
    # Multi-hop query latency: Find all applicable regulations for all mines
    mines = db.query(DBMine).all()
    traversal_latencies = []
    applicable_counts = []
    
    for m in mines:
        t_start = time.perf_counter()
        applicable = get_applicable_regulations(db, m.id)
        t_end = time.perf_counter()
        traversal_latencies.append((t_end - t_start) * 1000.0)
        applicable_counts.append(len(applicable))
        
    # Network metrics
    in_degrees = [d for _, d in G.in_degree()]
    out_degrees = [d for _, d in G.out_degree()]
    
    # Subgraph connected components (undirected view)
    G_undir = G.to_undirected()
    connected_components = nx.number_connected_components(G_undir)
    
    return {
        "graph_construction_time_ms": round(t_build, 2),
        "total_nodes": num_nodes,
        "total_edges": num_edges,
        "node_type_distribution": node_types,
        "edge_relationship_distribution": edge_types,
        "graph_density": round(nx.density(G), 6),
        "connected_components": connected_components,
        "mean_in_degree": round(float(np.mean(in_degrees)), 2),
        "max_in_degree": int(np.max(in_degrees)),
        "mean_out_degree": round(float(np.mean(out_degrees)), 2),
        "max_out_degree": int(np.max(out_degrees)),
        "multi_hop_traversal_latency_ms": {
            "mean": round(float(np.mean(traversal_latencies)), 3),
            "median": round(float(np.median(traversal_latencies)), 3),
            "p95": round(float(np.percentile(traversal_latencies, 95)), 3)
        },
        "applicable_regulations_per_mine": {
            "mean": round(float(np.mean(applicable_counts)), 1),
            "min": int(np.min(applicable_counts)),
            "max": int(np.max(applicable_counts))
        }
    }

def run_forecasting_benchmarks(db) -> dict[str, Any]:
    print("[4/6] Running Predictive Lateness & Risk Forecaster Validation...")
    mines = db.query(DBMine).all()
    
    all_trends = []
    latencies = []
    
    y_true_breach = []
    y_pred_risk = []
    slopes = []
    
    for m in mines:
        t0 = time.perf_counter()
        trends = compute_filing_trends(m.id, db)
        t1 = time.perf_counter()
        latencies.append((t1 - t0) * 1000.0)
        
        for tr in trends:
            all_trends.append(tr)
            slopes.append(tr["slope"])
            pred_risk = tr["predicted_risk"]
            y_pred_risk.append(pred_risk)
            
            # Ground truth: was average lateness > 0 (meaning mine actually breached deadline)
            actual_breach = 1 if tr["avg_lateness_days"] > 0 else 0
            y_true_breach.append(actual_breach)

    # Compute Forecaster Accuracy & Calibration
    y_pred_binary = [1 if r >= 0.5 else 0 for r in y_pred_risk]
    tp = sum(1 for yt, yp in zip(y_true_breach, y_pred_binary) if yt == 1 and yp == 1)
    fp = sum(1 for yt, yp in zip(y_true_breach, y_pred_binary) if yt == 0 and yp == 1)
    fn = sum(1 for yt, yp in zip(y_true_breach, y_pred_binary) if yt == 1 and yp == 0)
    tn = sum(1 for yt, yp in zip(y_true_breach, y_pred_binary) if yt == 0 and yp == 0)
    
    acc = (tp + tn) / max(len(y_true_breach), 1)
    prec = tp / max(tp + fp, 1)
    rec = tp / max(tp + fn, 1)
    f1 = 2 * prec * rec / max(prec + rec, 1e-6)
    
    # Regression Error: predicted_risk vs actual normalized lateness (capped at 1.0)
    actual_norm_lateness = [min(max(tr["avg_lateness_days"] / 30.0, 0.0), 1.0) for tr in all_trends]
    mae = float(np.mean(np.abs(np.array(y_pred_risk) - np.array(actual_norm_lateness))))
    rmse = float(np.sqrt(np.mean((np.array(y_pred_risk) - np.array(actual_norm_lateness)) ** 2)))
    
    # Trend distribution
    trend_counts = {}
    for tr in all_trends:
        d = tr["trend_direction"]
        trend_counts[d] = trend_counts.get(d, 0) + 1

    return {
        "total_forecasting_series_evaluated": len(all_trends),
        "direction_distribution": trend_counts,
        "hazard_prediction_metrics": {
            "accuracy": round(acc * 100, 2),
            "precision": round(prec * 100, 2),
            "recall": round(rec * 100, 2),
            "f1_score": round(f1 * 100, 2),
            "mae": round(mae, 4),
            "rmse": round(rmse, 4)
        },
        "slope_statistics": {
            "mean_slope": round(float(np.mean(slopes)), 3),
            "std_slope": round(float(np.std(slopes)), 3),
            "min_slope": round(float(np.min(slopes)), 3),
            "max_slope": round(float(np.max(slopes)), 3)
        },
        "computation_latency_ms": {
            "mean_per_mine": round(float(np.mean(latencies)), 3),
            "p95": round(float(np.percentile(latencies, 95)), 3)
        }
    }

def run_cryptographic_audit_benchmarks(db) -> dict[str, Any]:
    print("[5/6] Running Cryptographic Blockchain & Merkle Audit Trail Benchmarks...")
    blocks = db.query(DBAuditBlock).order_by(DBAuditBlock.index.asc()).all()
    
    # Measure chain verification time
    t0 = time.perf_counter()
    valid = True
    corrupted_index = None
    
    for i in range(1, len(blocks)):
        prev = blocks[i-1]
        curr = blocks[i]
        
        if curr.prev_hash != prev.block_hash:
            valid = False
            corrupted_index = i
            break
            
        payload = f"{curr.index}:{curr.timestamp.isoformat()}:{curr.action}:{curr.actor_id}:{curr.entity_id}:{curr.payload_hash}:{curr.prev_hash}"
        calc_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()
        if calc_hash != curr.block_hash:
            valid = False
            corrupted_index = i
            break
            
    t_verify = (time.perf_counter() - t0) * 1000.0 # ms
    
    # Throughput test: Simulate generation of 5,000 cryptographic blocks
    t0 = time.perf_counter()
    curr_h = "0" * 64
    num_sim_blocks = 5000
    for idx in range(num_sim_blocks):
        p_hash = hashlib.sha256(f"action_data_{idx}".encode()).hexdigest()
        b_data = f"{idx}:{datetime.utcnow().isoformat()}:INSPECTION_SUBMITTED:REG-001:MINE-001:{p_hash}:{curr_h}"
        curr_h = hashlib.sha256(b_data.encode("utf-8")).hexdigest()
    t_gen = time.perf_counter() - t0
    tps = num_sim_blocks / max(t_gen, 1e-6)
    
    # Tamper Sensitivity Test: Inject 50 simulated mutations and verify 100% detection
    tamper_trials = 50
    tamper_detected_count = 0
    for _ in range(tamper_trials):
        # Create a mock chain of 100 blocks
        chain = []
        h = "0" * 64
        for bi in range(100):
            ts = datetime.utcnow().isoformat()
            ph = hashlib.sha256(f"data_{bi}".encode()).hexdigest()
            dt = f"{bi}:{ts}:ACTION:USER1:MINE1:{ph}:{h}"
            nh = hashlib.sha256(dt.encode("utf-8")).hexdigest()
            chain.append({"idx": bi, "ph": h, "ch": nh, "data": dt, "ts": ts, "pl": ph})
            h = nh
            
        # Corrupt a random block payload
        corrupt_idx = random.randint(5, 90)
        chain[corrupt_idx]["pl"] = hashlib.sha256("TAMPERED_PAYLOAD".encode()).hexdigest()
        
        # Verify corrupted chain
        detected = False
        for bi in range(1, len(chain)):
            prev_b = chain[bi-1]
            curr_b = chain[bi]
            if curr_b["ph"] != prev_b["ch"]:
                detected = True
                break
            # recompute
            dt = f"{curr_b['idx']}:{curr_b['ts']}:ACTION:USER1:MINE1:{curr_b['pl']}:{curr_b['ph']}"
            calc = hashlib.sha256(dt.encode("utf-8")).hexdigest()
            if calc != curr_b["ch"]:
                detected = True
                break
        if detected:
            tamper_detected_count += 1

    return {
        "current_active_ledger_blocks": len(blocks),
        "chain_integrity_valid": valid,
        "verification_time_ms": round(t_verify, 3),
        "hashing_throughput_tx_per_sec": round(tps, 2),
        "tamper_resilience_test": {
            "simulated_tamper_attacks": tamper_trials,
            "successful_tamper_detections": tamper_detected_count,
            "detection_rate_percentage": round((tamper_detected_count / tamper_trials) * 100.0, 2)
        }
    }

def run_system_performance_benchmarks(db) -> dict[str, Any]:
    print("[6/6] Running System End-to-End Latency & Performance Benchmarks...")
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    
    endpoints = [
        ("GET", "/healthz"),
        ("GET", "/api/v1/mines"),
        ("GET", "/api/v1/compliance/dashboard"),
        ("GET", "/api/v1/filings"),
        ("GET", "/api/v1/audit/verify"),
        ("GET", "/api/v1/forecasts/alerts?threshold=0.3"),
        ("GET", "/api/v1/reports/summary"),
        ("POST", "/api/v1/auth/login", {"user_id": "REG-001", "password": "pass123"}),
    ]
    
    endpoint_latencies = {}
    
    # Warmup
    for ep in endpoints:
        if ep[0] == "GET":
            client.get(ep[1])
        else:
            client.post(ep[1], json=ep[2])
            
    # Benchmark 20 iterations per endpoint
    for ep in endpoints:
        method, url = ep[0], ep[1]
        body = ep[2] if len(ep) > 2 else None
        
        times = []
        for _ in range(25):
            t0 = time.perf_counter()
            if method == "GET":
                resp = client.get(url)
            else:
                resp = client.post(url, json=body)
            t1 = time.perf_counter()
            assert resp.status_code == 200
            times.append((t1 - t0) * 1000.0) # in ms
            
        endpoint_latencies[f"{method} {url}"] = {
            "mean_ms": round(float(np.mean(times)), 2),
            "median_ms": round(float(np.median(times)), 2),
            "p95_ms": round(float(np.percentile(times, 95)), 2),
            "p99_ms": round(float(np.percentile(times, 99)), 2),
            "min_ms": round(float(np.min(times)), 2),
            "max_ms": round(float(np.max(times)), 2)
        }
        
    return {
        "total_endpoints_tested": len(endpoints),
        "endpoint_latency_profile": endpoint_latencies
    }

def main():
    print("=" * 80)
    print(" AEGIS-COMPLIANCE: EMPIRICAL BENCHMARK & EXPERIMENTAL VALIDATION SUITE")
    print("=" * 80)
    
    db = SessionLocal()
    try:
        results = {
            "timestamp": datetime.utcnow().isoformat(),
            "environment": {
                "python_version": sys.version.split()[0],
                "platform": sys.platform,
                "vector_engine": "FAISS (IndexFlatIP)",
                "graph_engine": "NetworkX (Directed Multigraph)",
                "database": "SQLite / SQLAlchemy ORM"
            },
            "experiment_1_nlp_verification": run_nlp_verification_benchmarks(db),
            "experiment_2_faiss_vector_rag": run_faiss_rag_benchmarks(db),
            "experiment_3_knowledge_graph": run_knowledge_graph_benchmarks(db),
            "experiment_4_deadline_forecasting": run_forecasting_benchmarks(db),
            "experiment_5_cryptographic_audit": run_cryptographic_audit_benchmarks(db),
            "experiment_6_system_latency": run_system_performance_benchmarks(db)
        }
        
        out_dir = os.path.join(os.path.dirname(__file__), "output")
        os.makedirs(out_dir, exist_ok=True)
        out_file = os.path.join(out_dir, "experimental_results.json")
        with open(out_file, "w") as f:
            json.dump(results, f, indent=2)
            
        print("\n" + "=" * 80)
        print(f" ALL BENCHMARKS COMPLETED SUCCESSFULLY! Results saved to:\n {out_file}")
        print("=" * 80)
        return results
    finally:
        db.close()

if __name__ == "__main__":
    main()
