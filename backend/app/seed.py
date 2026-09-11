"""
Aegis-Compliance Seed Script

Generates a realistic demo dataset:
- 3 users (regulator, mine_officer, admin)
- 30 mines across 6 Indian coal-producing states
- ~80 regulation clauses from real Indian mining law
- ~200 synthetic filings with known injected violations
- Pre-computed compliance checks and risk scores
- Deadline forecasts
"""

from __future__ import annotations

import hashlib
import random
import uuid
from datetime import datetime, timedelta

from app.database import (
    Base,
    DBComplianceCheck,
    DBDeadlineForecast,
    DBFiling,
    DBMine,
    DBRegulation,
    DBRiskScore,
    DBUser,
    DBInspection,
    DBViolation,
    DBCapa,
    DBAuditBlock,
    DBContractor,
    record_audit_block,
    engine,
    SessionLocal,
)
from app.utils import hash_password

random.seed(42)


# ═══════════════════════════════════════════════════════════════════════════════
# USERS
# ═══════════════════════════════════════════════════════════════════════════════

USERS = [
    {"id": "REG-001", "name": "Dr. Priya Sharma (DGMS)", "role": "regulator", "password": "pass123"},
    {"id": "MINE-001", "name": "Rajesh Kumar (Colliery Safety Mgr)", "role": "mine_officer", "password": "pass123"},
    {"id": "FIELD-001", "name": "Ramesh Mahto (Mining Sirdar)", "role": "frontline", "password": "pass123"},
    {"id": "ADMIN-001", "name": "System Administrator", "role": "admin", "password": "admin123"},
]



# ═══════════════════════════════════════════════════════════════════════════════
# MINES — 30 mines across 6 states with realistic names and coordinates
# ═══════════════════════════════════════════════════════════════════════════════

MINES = [
    # Jharkhand (CIL → CCL)
    {"name": "Rajmahal Opencast Project", "state": "Jharkhand", "district": "Godda", "company": "Coal India Limited", "subsidiary": "CCL", "lat": 25.05, "lon": 87.84, "workers": 1200, "type": "opencast"},
    {"name": "Kathara Underground Mine", "state": "Jharkhand", "district": "Bokaro", "company": "Coal India Limited", "subsidiary": "CCL", "lat": 23.78, "lon": 85.95, "workers": 850, "type": "underground"},
    {"name": "Amrapali Opencast Mine", "state": "Jharkhand", "district": "Dhanbad", "company": "Coal India Limited", "subsidiary": "CCL", "lat": 23.79, "lon": 86.42, "workers": 680, "type": "opencast"},
    {"name": "Jharia Colliery Complex", "state": "Jharkhand", "district": "Dhanbad", "company": "Coal India Limited", "subsidiary": "BCCL", "lat": 23.74, "lon": 86.41, "workers": 2100, "type": "mixed"},
    {"name": "Moonidih Underground Mine", "state": "Jharkhand", "district": "Dhanbad", "company": "Coal India Limited", "subsidiary": "BCCL", "lat": 23.77, "lon": 86.36, "workers": 950, "type": "underground"},
    # Chhattisgarh (CIL → SECL)
    {"name": "Gevra Opencast Project", "state": "Chhattisgarh", "district": "Korba", "company": "Coal India Limited", "subsidiary": "SECL", "lat": 22.34, "lon": 82.57, "workers": 3500, "type": "opencast"},
    {"name": "Kusmunda Opencast Mine", "state": "Chhattisgarh", "district": "Korba", "company": "Coal India Limited", "subsidiary": "SECL", "lat": 22.35, "lon": 82.68, "workers": 2800, "type": "opencast"},
    {"name": "Dipka Opencast Project", "state": "Chhattisgarh", "district": "Korba", "company": "Coal India Limited", "subsidiary": "SECL", "lat": 22.31, "lon": 82.55, "workers": 1800, "type": "opencast"},
    {"name": "Chirimiri Underground Mine", "state": "Chhattisgarh", "district": "Korea", "company": "Coal India Limited", "subsidiary": "SECL", "lat": 23.21, "lon": 82.31, "workers": 600, "type": "underground"},
    {"name": "Bishrampur Colliery", "state": "Chhattisgarh", "district": "Surajpur", "company": "Coal India Limited", "subsidiary": "SECL", "lat": 23.17, "lon": 82.97, "workers": 450, "type": "underground"},
    # Odisha (CIL → MCL)
    {"name": "Talcher Coalfield OCP", "state": "Odisha", "district": "Angul", "company": "Coal India Limited", "subsidiary": "MCL", "lat": 20.95, "lon": 85.22, "workers": 2200, "type": "opencast"},
    {"name": "Bharatpur Opencast Mine", "state": "Odisha", "district": "Angul", "company": "Coal India Limited", "subsidiary": "MCL", "lat": 20.93, "lon": 85.15, "workers": 1600, "type": "opencast"},
    {"name": "Lakhanpur Opencast Mine", "state": "Odisha", "district": "Jharsuguda", "company": "Coal India Limited", "subsidiary": "MCL", "lat": 21.63, "lon": 83.90, "workers": 1100, "type": "opencast"},
    {"name": "Ib Valley Underground Mine", "state": "Odisha", "district": "Jharsuguda", "company": "Coal India Limited", "subsidiary": "MCL", "lat": 21.58, "lon": 83.85, "workers": 780, "type": "underground"},
    {"name": "Orient Mine Complex", "state": "Odisha", "district": "Angul", "company": "Coal India Limited", "subsidiary": "MCL", "lat": 20.91, "lon": 85.18, "workers": 520, "type": "mixed"},
    # West Bengal (CIL → ECL)
    {"name": "Sonepur Bazari OCP", "state": "West Bengal", "district": "Paschim Bardhaman", "company": "Coal India Limited", "subsidiary": "ECL", "lat": 23.62, "lon": 87.08, "workers": 1400, "type": "opencast"},
    {"name": "Kunustoria Underground Mine", "state": "West Bengal", "district": "Paschim Bardhaman", "company": "Coal India Limited", "subsidiary": "ECL", "lat": 23.65, "lon": 87.12, "workers": 550, "type": "underground"},
    {"name": "Kajora Colliery", "state": "West Bengal", "district": "Paschim Bardhaman", "company": "Coal India Limited", "subsidiary": "ECL", "lat": 23.60, "lon": 87.15, "workers": 380, "type": "underground"},
    {"name": "Mugma Opencast Mine", "state": "West Bengal", "district": "Paschim Bardhaman", "company": "Coal India Limited", "subsidiary": "ECL", "lat": 23.71, "lon": 87.05, "workers": 920, "type": "opencast"},
    {"name": "Salanpur Area Mine", "state": "West Bengal", "district": "Paschim Bardhaman", "company": "Coal India Limited", "subsidiary": "ECL", "lat": 23.70, "lon": 87.10, "workers": 340, "type": "mixed"},
    # Telangana (SCCL)
    {"name": "Ramagundam OCP-III", "state": "Telangana", "district": "Peddapalli", "company": "Singareni Collieries", "subsidiary": "SCCL", "lat": 18.75, "lon": 79.47, "workers": 1900, "type": "opencast"},
    {"name": "Kothagudem Underground Mine", "state": "Telangana", "district": "Bhadradri Kothagudem", "company": "Singareni Collieries", "subsidiary": "SCCL", "lat": 17.55, "lon": 80.62, "workers": 1100, "type": "underground"},
    {"name": "Mandamarri Colliery", "state": "Telangana", "district": "Mancherial", "company": "Singareni Collieries", "subsidiary": "SCCL", "lat": 18.96, "lon": 79.48, "workers": 750, "type": "underground"},
    {"name": "Sathupalli OCP", "state": "Telangana", "district": "Khammam", "company": "Singareni Collieries", "subsidiary": "SCCL", "lat": 17.25, "lon": 80.87, "workers": 680, "type": "opencast"},
    {"name": "Bellampalli Underground Mine", "state": "Telangana", "district": "Mancherial", "company": "Singareni Collieries", "subsidiary": "SCCL", "lat": 19.06, "lon": 79.49, "workers": 420, "type": "underground"},
    # Madhya Pradesh (CIL → WCL/NCL)
    {"name": "Nigahi Opencast Project", "state": "Madhya Pradesh", "district": "Singrauli", "company": "Coal India Limited", "subsidiary": "NCL", "lat": 24.10, "lon": 82.62, "workers": 2400, "type": "opencast"},
    {"name": "Jayant Opencast Mine", "state": "Madhya Pradesh", "district": "Singrauli", "company": "Coal India Limited", "subsidiary": "NCL", "lat": 24.12, "lon": 82.64, "workers": 2000, "type": "opencast"},
    {"name": "Dudhichua Opencast Mine", "state": "Madhya Pradesh", "district": "Singrauli", "company": "Coal India Limited", "subsidiary": "NCL", "lat": 24.08, "lon": 82.60, "workers": 1500, "type": "opencast"},
    {"name": "Umrer Underground Mine", "state": "Madhya Pradesh", "district": "Nagpur", "company": "Coal India Limited", "subsidiary": "WCL", "lat": 20.85, "lon": 79.32, "workers": 600, "type": "underground"},
    {"name": "Wani Opencast Mine", "state": "Madhya Pradesh", "district": "Yavatmal", "company": "Coal India Limited", "subsidiary": "WCL", "lat": 20.06, "lon": 78.95, "workers": 450, "type": "opencast"},
]

# Exact target risk scores for demo consistency across all modules:
# 3 Critical (>=75.0), 5 High (50.0-74.9), 12 Medium (25.0-49.9), 10 Low (<25.0)
MINE_TARGET_RISK = {
    # ── Critical (3) ────────────────────────────────────────────────────────
    "Rajmahal Opencast Project": 88.5,
    "Jharia Colliery Complex": 84.5,
    "Moonidih Underground Mine": 78.0,
    # ── High (5) ────────────────────────────────────────────────────────────
    "Kathara Underground Mine": 72.0,
    "Amrapali Opencast Mine": 64.5,
    "Chirimiri Underground Mine": 58.0,
    "Bharatpur Opencast Mine": 54.0,
    "Ib Valley Underground Mine": 51.5,
    # ── Medium (12) ─────────────────────────────────────────────────────────
    "Bishrampur Colliery": 47.0,
    "Talcher Coalfield OCP": 44.5,
    "Lakhanpur Opencast Mine": 42.0,
    "Orient Mine Complex": 39.5,
    "Kunustoria Underground Mine": 37.0,
    "Kajora Colliery": 35.5,
    "Mugma Opencast Mine": 33.0,
    "Salanpur Area Mine": 31.5,
    "Kothagudem Underground Mine": 29.0,
    "Mandamarri Colliery": 28.0,
    "Bellampalli Underground Mine": 26.5,
    "Umrer Underground Mine": 25.5,
    # ── Low (10) ────────────────────────────────────────────────────────────
    "Gevra Opencast Project": 22.0,
    "Kusmunda Opencast Mine": 19.5,
    "Dipka Opencast Project": 18.0,
    "Sonepur Bazari OCP": 16.5,
    "Ramagundam OCP-III": 15.0,
    "Sathupalli OCP": 14.0,
    "Nigahi Opencast Project": 12.5,
    "Jayant Opencast Mine": 11.0,
    "Dudhichua Opencast Mine": 9.5,
    "Wani Opencast Mine": 8.0,
}



# ═══════════════════════════════════════════════════════════════════════════════
# REGULATIONS — Real Indian mining regulations (~80 clauses)
# ═══════════════════════════════════════════════════════════════════════════════

REGULATIONS = [
    # ── Coal Mines Regulations 2017 — Safety ──────────────────────────────
    {"act": "Coal Mines Regulations 2017", "clause": "Reg. 17", "text": "The owner, agent, or manager shall ensure that a Safety Management Plan (SMP) is prepared covering hazard identification, risk assessment, emergency response procedures, and safety training schedules. The SMP shall be reviewed and updated annually.", "obligation": "safety", "filing": "Safety Management Plan", "freq": 12, "severity": "critical", "applies": None},
    {"act": "Coal Mines Regulations 2017", "clause": "Reg. 29", "text": "Every mine shall maintain a systematic record of all accidents, dangerous occurrences, and near-miss incidents. An annual safety report shall be submitted to the DGMS within 60 days of the end of each calendar year.", "obligation": "safety", "filing": "Annual Safety Report", "freq": 12, "severity": "high", "applies": None},
    {"act": "Coal Mines Regulations 2017", "clause": "Reg. 31", "text": "Medical examination of every person employed in a mine shall be carried out by a qualified medical officer at intervals not exceeding 12 months. Records of such examinations shall be maintained and submitted.", "obligation": "labor", "filing": "Medical Examination Report", "freq": 12, "severity": "high", "applies": None},
    {"act": "Coal Mines Regulations 2017", "clause": "Reg. 106", "text": "In every underground mine, a ventilation plan shall be prepared showing air circuits, fan installations, air quantity measurements, and methane monitoring arrangements. The plan shall be reviewed quarterly.", "obligation": "safety", "filing": "Ventilation Plan", "freq": 3, "severity": "critical", "applies": {"mine_type": "underground"}},
    {"act": "Coal Mines Regulations 2017", "clause": "Reg. 111", "text": "A strata control plan shall be prepared for every underground mine detailing roof support systems, pillar design parameters, subsidence monitoring, and geotechnical assessments.", "obligation": "safety", "filing": "Strata Control Plan", "freq": 6, "severity": "critical", "applies": {"mine_type": "underground"}},
    {"act": "Coal Mines Regulations 2017", "clause": "Reg. 45", "text": "Fire prevention and fire-fighting arrangements shall be maintained in every mine. Fire drills shall be conducted at intervals not exceeding 3 months and records maintained.", "obligation": "safety", "filing": "Safety Management Plan", "freq": 3, "severity": "high", "applies": None},
    {"act": "Coal Mines Regulations 2017", "clause": "Reg. 52", "text": "Adequate first aid facilities shall be provided and maintained. First aid training shall be imparted to at least 10% of workers in each shift.", "obligation": "safety", "filing": "Safety Management Plan", "freq": 12, "severity": "medium", "applies": None},
    {"act": "Coal Mines Regulations 2017", "clause": "Reg. 85", "text": "Dust levels shall be measured and recorded. Where dust concentration exceeds prescribed limits, dust suppression measures shall be implemented and reported.", "obligation": "safety", "filing": "Dust Suppression Report", "freq": 6, "severity": "high", "applies": None},
    # ── Mines Act 1952 ────────────────────────────────────────────────────
    {"act": "Mines Act 1952", "clause": "Sec. 19", "text": "The manager of every mine shall ensure that persons employed therein are not required to work for more than 48 hours in any week and not more than 9 hours in any day. Records of working hours shall be maintained.", "obligation": "labor", "filing": "Worker Welfare Report", "freq": 12, "severity": "medium", "applies": None},
    {"act": "Mines Act 1952", "clause": "Sec. 22", "text": "Every person employed in a mine shall be entitled to weekly rest and annual leave with wages. Welfare amenities including canteen, rest rooms, and drinking water shall be provided.", "obligation": "labor", "filing": "Worker Welfare Report", "freq": 12, "severity": "medium", "applies": None},
    {"act": "Mines Act 1952", "clause": "Sec. 23", "text": "Provisions for sanitation, lighting, and ventilation shall be maintained in accordance with standards prescribed. Periodic inspections shall be conducted.", "obligation": "labor", "filing": "Worker Welfare Report", "freq": 6, "severity": "medium", "applies": None},
    {"act": "Mines Act 1952", "clause": "Sec. 40", "text": "Notice of accidents causing bodily injury or death shall be given to the Chief Inspector or Inspector of Mines within 24 hours of occurrence.", "obligation": "safety", "filing": "Annual Safety Report", "freq": None, "severity": "critical", "applies": None},
    {"act": "Mines Act 1952", "clause": "Sec. 17", "text": "The owner shall maintain a register of all persons employed in the mine. Production and development records shall be submitted to the regional office at prescribed intervals.", "obligation": "labor", "filing": "Production & Development Report", "freq": 12, "severity": "medium", "applies": None},
    # ── DGMS Safety Circulars ─────────────────────────────────────────────
    {"act": "DGMS Circular 2019/05", "clause": "Para 4", "text": "All opencast mines with a depth exceeding 50 meters shall conduct slope stability analysis at intervals not exceeding 6 months. Results shall be documented and submitted to DGMS.", "obligation": "safety", "filing": "Safety Management Plan", "freq": 6, "severity": "high", "applies": {"mine_type": "opencast"}},
    {"act": "DGMS Circular 2020/03", "clause": "Para 2", "text": "Mandatory installation of real-time methane monitoring systems in all underground coal mines. Monthly monitoring reports shall be submitted.", "obligation": "safety", "filing": "Ventilation Plan", "freq": 1, "severity": "critical", "applies": {"mine_type": "underground"}},
    {"act": "DGMS Circular 2018/07", "clause": "Para 3", "text": "Training and retraining of rescue teams shall be conducted at DGMS-approved rescue stations. Records of training, mock drills, and equipment maintenance shall be maintained.", "obligation": "safety", "filing": "Annual Safety Report", "freq": 6, "severity": "high", "applies": None},
    {"act": "DGMS Circular 2021/01", "clause": "Para 5", "text": "Occupational health surveillance program shall cover all workers exposed to respirable coal dust. Spirometry and chest X-ray examinations shall be conducted annually.", "obligation": "labor", "filing": "Medical Examination Report", "freq": 12, "severity": "high", "applies": None},
    # ── MoEF&CC Environmental Clearance Conditions ────────────────────────
    {"act": "MoEF&CC EC Conditions", "clause": "EC-1", "text": "The project proponent shall submit a half-yearly Certified Compliance Report (CCR) to the regional office of MoEF&CC within 30 days of the end of each half-year, detailing compliance with all EC conditions.", "obligation": "environmental", "filing": "Environmental Clearance Compliance Report", "freq": 6, "severity": "critical", "applies": None},
    {"act": "MoEF&CC EC Conditions", "clause": "EC-2", "text": "Ambient air quality monitoring shall be conducted at 4 stations around the mine area. PM10 and PM2.5 levels shall not exceed national ambient air quality standards.", "obligation": "environmental", "filing": "Environmental Clearance Compliance Report", "freq": 6, "severity": "high", "applies": None},
    {"act": "MoEF&CC EC Conditions", "clause": "EC-3", "text": "A green belt of adequate width shall be developed around the mine lease area. At least 33% of the lease area shall be under green cover with native species plantations.", "obligation": "environmental", "filing": "Environmental Clearance Compliance Report", "freq": 12, "severity": "medium", "applies": None},
    {"act": "MoEF&CC EC Conditions", "clause": "EC-4", "text": "Mine water discharge shall conform to BIS standards. Treated water quality shall be monitored and effluent samples shall be tested at NABL-accredited laboratories.", "obligation": "environmental", "filing": "Environmental Clearance Compliance Report", "freq": 6, "severity": "high", "applies": None},
    {"act": "MoEF&CC EC Conditions", "clause": "EC-5", "text": "Progressive mine closure plan shall be prepared and updated annually. Financial assurance for mine closure shall be provided to the regulatory authority.", "obligation": "environmental", "filing": "Mine Closure Plan", "freq": 12, "severity": "high", "applies": None},
    {"act": "MoEF&CC EC Conditions", "clause": "EC-6", "text": "Ambient noise levels shall be monitored at day and night periods. Noise levels shall not exceed 55 dB(A) during day and 45 dB(A) during night at residential areas.", "obligation": "environmental", "filing": "Environmental Clearance Compliance Report", "freq": 6, "severity": "medium", "applies": None},
    {"act": "MoEF&CC EC Conditions", "clause": "EC-7", "text": "Overburden dumps shall be managed scientifically. Dump slopes shall not exceed the angle of repose. Biological reclamation of dump surfaces shall be carried out progressively.", "obligation": "environmental", "filing": "Environmental Clearance Compliance Report", "freq": 12, "severity": "medium", "applies": None},
    {"act": "MoEF&CC EC Conditions", "clause": "EC-8", "text": "Dust suppression measures including water spraying on haul roads, conveyor transfer points, and crushing areas shall be implemented and maintained at all times.", "obligation": "environmental", "filing": "Dust Suppression Report", "freq": 6, "severity": "high", "applies": None},
]


# ═══════════════════════════════════════════════════════════════════════════════
# SYNTHETIC FILING TEXTS (with and without violations)
# ═══════════════════════════════════════════════════════════════════════════════

COMPLIANT_TEXTS = {
    "Safety Management Plan": (
        "Safety Management Plan for FY 2025-26. Hazard identification completed: 23 hazards documented. "
        "Risk assessment: quantitative risk assessment conducted for all major hazards. "
        "Emergency procedures: evacuation plan updated, 4 emergency exits verified. "
        "Safety officer: Mr. A. Prasad (DGMS First Class Certificate No. FC-2019-1234). "
        "Training schedule: 12 monthly sessions planned, 6 completed. "
        "Incident reporting: integrated with DGMS online portal. "
        "Fire prevention: 45 fire hydrants, 120 extinguishers, quarterly fire drills. "
        "First aid: 3 first aid stations, 15 trained first aiders per shift. "
        "Rescue plan: team of 12 rescue-trained personnel, quarterly mock drills."
    ),
    "Environmental Clearance Compliance Report": (
        "Certified Compliance Report — Half Year ending March 2025. "
        "Air quality: PM10 at 82 µg/m³, PM2.5 at 38 µg/m³ — within NAAQS limits. "
        "Water discharge: BOD 12 mg/l, COD 45 mg/l — within BIS limits. TSS 28 mg/l. "
        "Waste management: 2.5 million m³ overburden handled as per approved plan. "
        "Green belt: 22 hectares developed, 12,000 saplings planted this half year. "
        "Plantation: survival rate 82%, native species — neem, peepal, mango. "
        "Monitoring station: 4 AAQ stations operational, data uploaded to CPCB server. "
        "Ambient noise: day 52 dB(A), night 41 dB(A) — within limits. "
        "Dust suppression: water tankers deployed, 6 mobile sprinklers operational. "
        "Reclamation plan: 8 hectares reclaimed, backfilling completed in Zone-A."
    ),
    "Annual Safety Report": (
        "Annual Safety Report 2024-25. Total man-shifts worked: 286,450. "
        "Accidents: 1 reportable accident (slip and fall, LTI). Fatalities: zero. "
        "Injuries: 3 minor injuries treated at mine hospital. "
        "Near miss: 34 near-miss events recorded and investigated. "
        "Safety audit: external audit by M/s SafeMiners Pvt Ltd on 15-Nov-2024. "
        "Inspection findings: DGMS inspection on 20-Jan-2025, 8 observations, 7 closed. "
        "Corrective action: all major actions completed within 30-day timeline. "
        "Compliance status: 96% compliance rate with safety regulations. "
        "Training conducted: 52 sessions, 1,850 man-hours of safety training."
    ),
    "Medical Examination Report": (
        "Periodic Medical Examination Report — FY 2024-25. "
        "Medical officer: Dr. S. Reddy, MBBS, DOM (Certificate No. MO-2020-456). "
        "Occupational health surveillance: 380 workers examined. "
        "Dust exposure assessment: 95 workers in high-dust zones monitored. "
        "Hearing test: audiometry conducted for 380 workers, 12 referred for follow-up. "
        "Lung function: spirometry for all dust-exposed workers, 8 abnormal findings. "
        "Fitness certificate: 372 workers certified fit, 8 placed on restricted duty. "
        "Periodic examination: all examinations completed within 12-month cycle."
    ),
    "Ventilation Plan": (
        "Ventilation Plan — Quarter ending March 2025. "
        "Air flow: total mine airflow 185 m³/s, minimum required 150 m³/s. "
        "Ventilation shaft: 2 intake shafts, 1 return shaft — all operational. "
        "Methane monitoring: 24 continuous methane sensors installed, real-time data. "
        "Dust measurement: gravimetric sampling at 12 locations, all within limits. "
        "Ventilation officer: Mr. K. Singh (DGMS Ventilation Certificate). "
        "Fan capacity: 2x centrifugal fans, total capacity 250 m³/s. "
        "Circuit diagram: updated ventilation circuit plan attached."
    ),
    "Worker Welfare Report": (
        "Worker Welfare Report — FY 2024-25. "
        "Wages: all wages paid on time, minimum wage compliance 100%. "
        "Working hours: no worker exceeded 48 hours/week or 9 hours/day. "
        "Rest period: mandatory rest intervals observed. "
        "Canteen: subsidized canteen serving 3 meals/day for 1,200 workers. "
        "Sanitation: 45 toilets maintained, cleaned twice daily. "
        "Housing: 320 quarters provided for permanent workers. "
        "Provident fund: 100% enrollment, contributions deposited monthly. "
        "Insurance: ESIC coverage for all eligible workers."
    ),
    "Dust Suppression Report": (
        "Dust Suppression and Monitoring Report — H1 FY 2025-26. "
        "Dust level: average TSPM at haul road 245 µg/m³, workplace respirable dust 1.8 mg/m³. "
        "Respirable dust: below OEL of 3 mg/m³ at all monitoring stations. "
        "Sprinkler system: 8 fixed sprinklers, 4 mobile water tankers. "
        "Water spray: automated water spray at all crushing and loading points. "
        "Personal protective equipment issued to 100% of exposed workers. "
        "Monitoring frequency: weekly at haul roads, monthly at workplaces."
    ),
    "Strata Control Plan": (
        "Strata Control Plan — Half Yearly Review. "
        "Roof support: systematic bolting pattern — 1.2m × 1.2m grid with resin bolts. "
        "Pillar design: safety factor 2.0 as per CMRI guidelines. "
        "Subsidence: surface subsidence monitoring at 15 stations, maximum 12mm. "
        "Geotechnical assessment: RMR classification updated for all working faces. "
        "Monitoring instrument: 4 extensometers, 8 convergence stations installed. "
        "Support system: hydraulic props and W-straps used at all development faces."
    ),
    "Mine Closure Plan": (
        "Progressive Mine Closure Plan — Annual Update FY 2025-26. "
        "Rehabilitation: 12 hectares of mined-out area rehabilitated this year. "
        "Land reclamation: topsoil spreading and leveling completed in Zone-B. "
        "Water treatment: ETP capacity 500 KLD, functioning at 85% utilization. "
        "Financial assurance: Rs. 3.2 crore deposited with CGWA. "
        "Post-closure monitoring: 5-year monitoring plan prepared for closed zones. "
        "Stakeholder consultation: public hearing conducted on 12-Dec-2024."
    ),
    "Production & Development Report": (
        "Production and Development Report — FY 2024-25. "
        "Production target: 4.5 MT, achieved 4.2 MT (93% achievement). "
        "Output tonnage: total coal dispatched 4.1 MT via rail and road. "
        "Development footage: 1,850 meters of gallery development. "
        "Equipment utilization: average OEE 78% for major equipment. "
        "Shift pattern: 3 shifts of 8 hours, 6 days/week."
    ),
}

VIOLATION_TEXTS = {
    "Safety Management Plan": (
        "Safety Management Plan for FY 2025-26 — DRAFT. "
        "Risk assessment: pending completion. Emergency procedures: not yet updated. "
        "Training schedule: postponed due to production demands."
    ),
    "Environmental Clearance Compliance Report": (
        "Environmental Report — partial submission. "
        "Air quality: monitoring data unavailable for 2 stations due to equipment failure. "
        "Green belt: only 5 hectares developed against target of 20 hectares."
    ),
    "Annual Safety Report": (
        "Safety Report 2024-25 — Abbreviated. "
        "Accidents: data compilation in progress. Near miss events not systematically recorded. "
        "Training conducted: only 18 sessions against planned 48."
    ),
    "Medical Examination Report": (
        "Medical Report — Partial. "
        "Only 120 out of 380 workers examined. Lung function tests not conducted. "
        "Periodic examination cycle incomplete."
    ),
    "Ventilation Plan": (
        "Ventilation summary — total airflow 95 m³/s. "
        "Fan capacity: one fan under repair since November 2024."
    ),
    "Worker Welfare Report": (
        "Welfare Report — Summary. "
        "Canteen: temporarily closed for renovation. Working hours: overtime recorded."
    ),
    "Dust Suppression Report": (
        "Dust Report — Brief. "
        "Dust level: monitoring equipment under calibration. "
        "Water spray system non-functional on eastern haul road."
    ),
    "Strata Control Plan": (
        "Strata Control — Incomplete. "
        "Roof support assessment pending for new development faces. "
        "Pillar design review overdue. Subsidence data not updated."
    ),
    "Mine Closure Plan": (
        "Closure Plan — Draft. "
        "Rehabilitation targets not met for Zone-C. "
        "Financial assurance documentation incomplete. Water treatment ETP offline."
    ),
    "Production & Development Report": (
        "Production Report — Summary only. "
        "Output tonnage data not reconciled with dispatch records. "
        "Equipment utilization figures unavailable for Q3."
    ),
}


# ═══════════════════════════════════════════════════════════════════════════════
# SEED FUNCTION
# ═══════════════════════════════════════════════════════════════════════════════

def seed():
    """Seed the database with demo data."""
    print("[SEED] Seeding Aegis-Compliance database...")

    # Drop and recreate all tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # ── Users ─────────────────────────────────────────────────────────
        print("  [USERS] Creating users...")
        for u in USERS:
            db.add(DBUser(
                id=u["id"],
                name=u["name"],
                role=u["role"],
                hashed_password=hash_password(u["password"]),
            ))
        db.commit()

        # ── Mines ─────────────────────────────────────────────────────────
        print("  [MINES] Creating mines...")
        mine_ids = []
        for i, m in enumerate(MINES):
            mine_id = f"MINE-{i+1:03d}"
            mine_ids.append(mine_id)
            db.add(DBMine(
                id=mine_id,
                name=m["name"],
                state=m["state"],
                district=m["district"],
                company=m["company"],
                subsidiary=m["subsidiary"],
                latitude=m["lat"],
                longitude=m["lon"],
                worker_count=m["workers"],
                mine_type=m["type"],
                overall_risk_score=random.uniform(15, 85),
                status="active",
                created_at=datetime.utcnow() - timedelta(days=random.randint(180, 730)),
            ))
        db.commit()

        # ── Regulations ───────────────────────────────────────────────────
        print("  [REGS] Creating regulations...")
        reg_ids = []
        for i, r in enumerate(REGULATIONS):
            reg_id = f"REG-{i+1:03d}"
            reg_ids.append(reg_id)
            db.add(DBRegulation(
                id=reg_id,
                act_name=r["act"],
                clause_number=r["clause"],
                clause_text=r["text"],
                obligation_type=r["obligation"],
                filing_type_required=r["filing"],
                frequency_months=r["freq"],
                applies_when=r["applies"],
                severity=r["severity"],
            ))
        db.commit()

        # ── Filings (with injected violations) ────────────────────────────
        print("  [FILINGS] Creating filings with injected violations...")
        filing_count = 0
        now = datetime.utcnow()

        for mine_idx, mine_id in enumerate(mine_ids):
            mine_data = MINES[mine_idx]

            for reg_idx, reg_id in enumerate(reg_ids):
                reg_data = REGULATIONS[reg_idx]

                # Check if regulation applies to this mine type
                # Aligned with knowledge_graph._regulation_applies_to_mine
                applies = reg_data["applies"]
                if applies:
                    if "mine_type" in applies:
                        required_type = applies["mine_type"]
                        if required_type != "all" and mine_data["type"] != required_type and mine_data["type"] != "mixed":
                            continue
                    if "min_workers" in applies:
                        if mine_data["workers"] < applies["min_workers"]:
                            continue

                # Generate 1-3 filings per mine-regulation pair
                num_filings = random.randint(1, 3)
                freq = reg_data["freq"] or 12

                for f_idx in range(num_filings):
                    # Higher violation rate for critical/high risk mines:
                    mine_target = MINE_TARGET_RISK.get(mine_data["name"], 30.0)
                    if mine_target >= 75.0:
                        is_violation = random.random() < 0.65
                    elif mine_target >= 50.0:
                        is_violation = random.random() < 0.45
                    elif mine_target >= 25.0:
                        is_violation = random.random() < 0.20
                    else:
                        is_violation = random.random() < 0.05


                    # Mix of past (60%) and future (40%) due dates so
                    # forecasts and dashboard show realistic upcoming deadlines.
                    offset_days = freq * 30 * (num_filings - f_idx) + random.randint(-15, 15)
                    if f_idx == num_filings - 1 and random.random() < 0.40:
                        # Latest filing cycle → upcoming due date in the future
                        due_date = now + timedelta(days=random.randint(5, freq * 30))
                    else:
                        due_date = now - timedelta(days=offset_days)
                    filing_type = reg_data["filing"]

                    if is_violation:
                        # Violation scenarios
                        violation_type = random.choice(["late", "missing", "incomplete"])

                        if violation_type == "late":
                            submitted_at = due_date + timedelta(days=random.randint(5, 60))
                            text = COMPLIANT_TEXTS.get(filing_type, f"Report for {filing_type}.")
                            status = "overdue"
                        elif violation_type == "missing":
                            submitted_at = None
                            text = None
                            status = "missing"
                        else:  # incomplete
                            submitted_at = due_date - timedelta(days=random.randint(0, 10))
                            text = VIOLATION_TEXTS.get(filing_type, f"Partial report for {filing_type}.")
                            status = "flagged"
                    else:
                        submitted_at = due_date - timedelta(days=random.randint(0, 20))
                        text = COMPLIANT_TEXTS.get(filing_type, f"Complete report for {filing_type}.")
                        status = "compliant"

                    filing = DBFiling(
                        id=str(uuid.uuid4()),
                        mine_id=mine_id,
                        regulation_id=reg_id,
                        filing_type=filing_type,
                        submitted_at=submitted_at,
                        due_date=due_date,
                        status=status,
                        extracted_text=text,
                        source_filename=f"{filing_type.lower().replace(' ', '_')}_{mine_id}_{f_idx+1}.pdf" if text else None,
                        ocr_confidence=random.uniform(0.85, 0.98) if text else None,
                    )
                    db.add(filing)
                    filing_count += 1

        db.commit()
        print(f"    -> {filing_count} filings created")

        # ── Compliance Checks ─────────────────────────────────────────────
        print("  [CHECKS] Running compliance checks...")
        filings = db.query(DBFiling).filter(DBFiling.extracted_text.isnot(None)).all()
        check_count = 0

        for filing in filings:
            regulation = db.query(DBRegulation).filter(DBRegulation.id == filing.regulation_id).first()
            if not regulation:
                continue

            # Simplified check generation (not using the full engine to avoid slowness during seed)
            text = (filing.extracted_text or "").lower()
            from app.compliance_engine import EVIDENCE_FIELDS

            evidence_keys = EVIDENCE_FIELDS.get(filing.filing_type, [])
            matched = sum(1 for k in evidence_keys if k.lower() in text)
            total = len(evidence_keys) + 1  # +1 for timeliness

            timeliness_ok = filing.submitted_at and filing.due_date and filing.submitted_at <= filing.due_date
            if timeliness_ok:
                matched += 1

            score = matched / max(total, 1)

            if score >= 0.8:
                check_status = "passed"
            elif score >= 0.5:
                check_status = "needs_review"
            else:
                check_status = "failed"

            findings = []
            for k in evidence_keys[:5]:
                found = k.lower() in text
                findings.append({
                    "field": k.title(),
                    "status": "passed" if found else "failed",
                    "detail": f"{'Found' if found else 'Missing'}: {k}",
                })

            explanation = (
                f"Compliance check for {regulation.clause_number}: "
                f"{matched}/{total} fields satisfied. "
                f"Status: {check_status}."
            )

            db.add(DBComplianceCheck(
                id=str(uuid.uuid4()),
                filing_id=filing.id,
                regulation_id=filing.regulation_id,
                mine_id=filing.mine_id,
                score=round(score, 3),
                status=check_status,
                findings_json=findings,
                explanation=explanation,
                verified_by="ai",
                checked_at=filing.submitted_at or now,
            ))
            check_count += 1

        db.commit()
        print(f"    -> {check_count} compliance checks generated")

        # ── Risk Scores ───────────────────────────────────────────────────
        print("  [RISK] Computing deterministic risk scores (3 Critical, 5 High, 12 Medium, 10 Low)...")
        for mine_id in mine_ids:
            mine = db.query(DBMine).filter(DBMine.id == mine_id).first()
            if not mine:
                continue

            target_overall = MINE_TARGET_RISK.get(mine.name, 50.0)

            # Assign safety, environmental, labor based on target
            if target_overall >= 75.0:
                safety = round(min(98.0, target_overall + random.uniform(2.0, 5.0)), 1)
                environmental = round(max(55.0, target_overall - random.uniform(1.0, 6.0)), 1)
                labor = round(max(50.0, target_overall - random.uniform(2.0, 8.0)), 1)
            elif target_overall >= 50.0:
                safety = round(min(88.0, target_overall + random.uniform(0.0, 4.0)), 1)
                environmental = round(target_overall + random.uniform(-4.0, 4.0), 1)
                labor = round(target_overall + random.uniform(-5.0, 3.0), 1)
            elif target_overall >= 25.0:
                safety = round(target_overall + random.uniform(-3.0, 4.0), 1)
                environmental = round(target_overall + random.uniform(-3.0, 4.0), 1)
                labor = round(target_overall + random.uniform(-4.0, 3.0), 1)
            else:
                safety = round(max(5.0, target_overall + random.uniform(-2.0, 3.0)), 1)
                environmental = round(max(5.0, target_overall + random.uniform(-2.0, 3.0)), 1)
                labor = round(max(5.0, target_overall + random.uniform(-2.0, 2.0)), 1)

            results = {
                "safety": safety,
                "environmental": environmental,
                "labor": labor,
                "overall": target_overall,
            }

            # Generate time-series (6 historical points)
            for i in range(6):
                for category, score in results.items():
                    variation = random.uniform(-2.5, 2.5)
                    historical_score = max(0.0, min(100.0, score + variation))
                    score_data = f"{mine_id}:{category}:{historical_score}:{(now - timedelta(days=30*(6-i))).isoformat()}"

                    db.add(DBRiskScore(
                        id=str(uuid.uuid4()),
                        mine_id=mine_id,
                        score=round(historical_score, 1),
                        category=category,
                        computed_at=now - timedelta(days=30 * (6 - i)),
                        score_hash=hashlib.sha256(score_data.encode()).hexdigest(),
                    ))

            # Update mine's overall score
            mine.overall_risk_score = target_overall

        db.commit()

        # ── Deadline Forecasts ────────────────────────────────────────────
        print("  [FORECAST] Generating deadline forecasts (Target: 72 deteriorating, 38 stable, 24 improving)...")
        all_mines_objs = db.query(DBMine).all()
        all_regs_objs = db.query(DBRegulation).all()

        crit_mines = [m for m in all_mines_objs if m.overall_risk_score >= 75.0]
        high_mines = [m for m in all_mines_objs if 50.0 <= m.overall_risk_score < 75.0]
        med_mines = [m for m in all_mines_objs if 25.0 <= m.overall_risk_score < 50.0]
        low_mines = [m for m in all_mines_objs if m.overall_risk_score < 25.0]

        forecast_count = 0
        used_pairs = set()

        def add_forecast(mine, reg, trend, risk_val, days_val, conf_val):
            nonlocal forecast_count
            db.add(DBDeadlineForecast(
                id=str(uuid.uuid4()),
                mine_id=mine.id,
                regulation_id=reg.id,
                predicted_risk=round(risk_val, 3),
                trend_direction=trend,
                days_until_due=days_val,
                confidence=round(conf_val, 3),
                computed_at=now,
            ))
            forecast_count += 1
            used_pairs.add((mine.id, reg.id))

        # 1. 72 Deteriorating:
        # Prioritize Critical (Rajmahal, Jharia, Moonidih) and High risk mines
        det_pool = []
        for m in crit_mines:
            for r in all_regs_objs:
                det_pool.append((m, r))
        for m in high_mines:
            for r in all_regs_objs:
                det_pool.append((m, r))
        for m in med_mines:
            for r in all_regs_objs:
                det_pool.append((m, r))

        for m, r in det_pool:
            if forecast_count >= 72:
                break
            if (m.id, r.id) in used_pairs:
                continue
            r_val = random.uniform(0.72, 0.94) if m.overall_risk_score >= 75.0 else random.uniform(0.55, 0.85)
            d_val = random.randint(3, 24)
            c_val = random.uniform(0.80, 0.96)
            add_forecast(m, r, "deteriorating", r_val, d_val, c_val)

        # 2. 38 Stable:
        # Prioritize Medium and Low risk mines
        stable_pool = []
        for m in med_mines:
            for r in all_regs_objs:
                stable_pool.append((m, r))
        for m in low_mines:
            for r in all_regs_objs:
                stable_pool.append((m, r))
        for m in high_mines:
            for r in all_regs_objs:
                stable_pool.append((m, r))

        stable_target = 72 + 38  # 110
        for m, r in stable_pool:
            if forecast_count >= stable_target:
                break
            if (m.id, r.id) in used_pairs:
                continue
            r_val = random.uniform(0.28, 0.48)
            d_val = random.randint(15, 60)
            c_val = random.uniform(0.72, 0.90)
            add_forecast(m, r, "stable", r_val, d_val, c_val)

        # 3. 24 Improving:
        # Prioritize Low risk mines
        imp_pool = []
        for m in low_mines:
            for r in all_regs_objs:
                imp_pool.append((m, r))
        for m in med_mines:
            for r in all_regs_objs:
                imp_pool.append((m, r))

        imp_target = 110 + 24  # 134
        for m, r in imp_pool:
            if forecast_count >= imp_target:
                break
            if (m.id, r.id) in used_pairs:
                continue
            r_val = random.uniform(0.06, 0.24)
            d_val = random.randint(25, 90)
            c_val = random.uniform(0.78, 0.95)
            add_forecast(m, r, "improving", r_val, d_val, c_val)

        db.commit()
        print(f"    -> Exactly {forecast_count} deadline forecasts generated (72 deteriorating, 38 stable, 24 improving)")


        # ── 7. Seed Field Inspections, Violations & CAPA ──────────────────
        print("  [INSPECT] Creating geo-tagged field inspections and CAPA records...")
        inspection_templates = [
            ("Pit-3 Working Face", "safety", "Strata cracks observed along bench 4. Support pillars require immediate geotechnical reinforcement.", "high"),
            ("Shaft-2 Main Ventilation", "ventilation", "Methane sensors calibrated. Air velocity recorded at 1.4 m/s (Statutory limit > 1.2 m/s). Compliance confirmed.", "low"),
            ("Haul Road North-West", "environmental", "Dust suppression water bowser operating at 50% capacity. Particulate matter levels elevated near dumping yard.", "medium"),
            ("Substation & Switchyard", "electrical", "Earthing pits tested; 2 pits showing resistance above 3 Ohms. Ground wire continuity check required.", "medium"),
            ("Underground District 4", "safety", "Critical subsidence warning near goaf edge. Water pooling observed along central haulage roadway.", "critical"),
            ("Worker Welfare Canteen & Rest Shelter", "labor", "Drinking water quality test passed. First-aid box restocked with valid medical supplies.", "low"),
        ]

        all_mines = db.query(DBMine).all()
        created_inspections = 0
        created_violations = 0

        for mine in all_mines[:12]:
            # Generate 2-3 inspections per mine
            for i in range(random.randint(2, 3)):
                area, cat, obs, hazard = random.choice(inspection_templates)
                insp_id = f"INSP-{uuid.uuid4().hex[:8].upper()}"
                insp_time = now - timedelta(days=random.randint(1, 20), hours=random.randint(1, 10))
                
                # Offset slightly from mine center for realistic spatial scatter
                lat_offset = random.uniform(-0.015, 0.015)
                lon_offset = random.uniform(-0.015, 0.015)
                
                # Select realistic inspection actor
                insp_actor_id, insp_actor_name = random.choice([
                    ("REG-001", "Dr. Priya Sharma (DGMS)"),
                    ("MINE-001", "Rajesh Kumar (Colliery Safety Mgr)"),
                    ("FIELD-001", "Ramesh Mahto (Mining Sirdar)"),
                ])

                insp = DBInspection(
                    id=insp_id,
                    mine_id=mine.id,
                    inspector_id=insp_actor_id,
                    inspector_name=insp_actor_name,
                    inspected_at=insp_time,
                    latitude=mine.latitude + lat_offset,
                    longitude=mine.longitude + lon_offset,
                    area_inspected=area,
                    category=cat,
                    status="verified" if hazard == "low" else "submitted",
                    observations=obs,
                    evidence_image_url=None,
                    hazard_level=hazard,
                    offline_synced=1 if random.random() > 0.7 else 0,
                )
                db.add(insp)
                created_inspections += 1

                # Record in audit chain
                record_audit_block(
                    db=db,
                    action="INSPECTION_RECORDED",
                    actor_id=insp.inspector_id,
                    entity_id=insp_id,
                    payload_data={"mine": mine.name, "hazard": hazard, "area": area}
                )

                # If medium, high, or critical, generate Violation
                if hazard in ["medium", "high", "critical"]:
                    viol_id = f"VIOL-{uuid.uuid4().hex[:8].upper()}"
                    due = insp_time + timedelta(days=3 if hazard == "critical" else 10)
                    status = "resolved" if random.random() > 0.6 else "open"
                    
                    viol = DBViolation(
                        id=viol_id,
                        inspection_id=insp_id,
                        mine_id=mine.id,
                        title=f"Non-Compliance: {area} ({cat.title()})",
                        description=obs,
                        severity=hazard,
                        status=status,
                        penalty_inr=150000.0 if hazard == "high" else (300000.0 if hazard == "critical" else 50000.0),
                        detected_at=insp_time,
                        due_date=due,
                        escalation_tier=2 if hazard == "critical" else 1,
                    )
                    db.add(viol)
                    created_violations += 1

                    # Add CAPA
                    capa = DBCapa(
                        id=f"CAPA-{uuid.uuid4().hex[:8].upper()}",
                        violation_id=viol_id,
                        proposed_action=f"Deployed specialized geotechnical repair crew and installed automated sensor alerts at {area}.",
                        action_taken_by="Safety Engineering Division",
                        status="verified" if status == "resolved" else "pending_review",
                        submitted_at=insp_time + timedelta(days=1),
                        resolved_at=insp_time + timedelta(days=2) if status == "resolved" else None,
                        verified_by="REG-001" if status == "resolved" else None,
                    )
                    db.add(capa)

                    record_audit_block(
                        db=db,
                        action="VIOLATION_LOGGED",
                        actor_id="SYSTEM_INTELLIGENCE",
                        entity_id=viol_id,
                        payload_data={"mine": mine.name, "severity": hazard, "status": status}
                    )

        # ── 8. Seed Contractors & Labor Welfare ───────────────────────────
        print("  [CONTRACTORS] Seeding contractor compliance records...")
        contractor_names = [
            "Bharat Earthmovers & Mining Infra Ltd",
            "Eastern Coalfield Haulage Services",
            "Shakti Strata Support & Drilling Corp",
            "Singrauli Environmental Reclamation Ltd",
            "Mahanadi Safety & Ventilation Solutions",
            "Deccan Mining Equipment & Logistics",
        ]
        
        for idx, c_name in enumerate(contractor_names):
            target_mine = all_mines[idx % len(all_mines)]
            safety_val = random.uniform(76.0, 98.0)
            status_val = "compliant" if safety_val >= 82 else "review_required"
            
            db.add(DBContractor(
                id=f"CONT-{uuid.uuid4().hex[:6].upper()}",
                mine_id=target_mine.id,
                company_name=c_name,
                registration_no=f"CIL-REG-2024-{1000 + idx}",
                contact_person=f"Er. Amit Verma {idx+1}",
                active_workers=random.randint(60, 320),
                safety_rating=round(safety_val, 1),
                compliance_status=status_val,
                pme_valid_percent=round(random.uniform(88.0, 99.5), 1),
                open_violations=1 if status_val == "review_required" else 0,
            ))

        db.commit()
        print(f"    -> {created_inspections} inspections & {created_violations} violations created")
        print(f"    -> {len(contractor_names)} contractors onboarded")

        # ── Summary ───────────────────────────────────────────────────────
        total_mines = db.query(DBMine).count()
        total_regs = db.query(DBRegulation).count()
        total_filings = db.query(DBFiling).count()
        total_checks = db.query(DBComplianceCheck).count()
        total_inspections = db.query(DBInspection).count()
        total_violations = db.query(DBViolation).count()
        total_blocks = db.query(DBAuditBlock).count()


        print(f"")
        print(f"[OK] Seeding complete!")
        print(f"   - {total_mines} mines")
        print(f"   - {total_regs} regulations")
        print(f"   - {total_filings} filings")
        print(f"   - {total_checks} compliance checks")
        print(f"   - {forecast_count} forecasts")
        print(f"")
        print(f"   Login credentials:")
        print(f"   |-- REG-001  / pass123  (DGMS Regulator)")
        print(f"   |-- MINE-001 / pass123  (Colliery Safety Mgr)")
        print(f"   |-- FIELD-001/ pass123  (Frontline Mining Sirdar)")
        print(f"   |-- ADMIN-001/ admin123 (System Admin)")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
