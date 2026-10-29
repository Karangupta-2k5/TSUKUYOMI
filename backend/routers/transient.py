"""
Tsukuyomi Watch: The Samurai’s Celestial Guide
Spectral & Time-Domain Transient Event Detection Router
"The Guest Star Divination Sphere (客星・天変観測儀) / Transient Event Detector"

Provides real-time time-domain light curves, multi-wavelength spectroscopic flux data,
emission/absorption line profiles, and automated classification for transient astronomical events:
Supernovae (Type Ia & II), Kilonovae, Gamma-Ray Bursts, and Tidal Disruption Events.
Includes historic celestial records dating from Fujiwara no Teika's Meigetsuki (1054 AD).
"""
from __future__ import annotations

import math
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Query, HTTPException

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/transient", tags=["transient"])

# Curated Transient Events Database
TRANSIENT_EVENTS: Dict[str, Dict[str, Any]] = {
    "sn1054-crab": {
        "id": "sn1054-crab",
        "name": "SN 1054 (Crab Nebula Guest Star)",
        "japaneseName": "客星・天関星 (明月記の記録)",
        "designation": "SN 1054 / M1 Progenitor",
        "type": "Type II-P Supernova (Core Collapse)",
        "category": "Supernova",
        "alertLevel": "CRITICAL",
        "constellation": "Taurus (金牛宮)",
        "coordinates": {"ra": "05h 34m 31.97s", "dec": "+22° 00′ 52.1″"},
        "distance": "6,500 light-years (2.0 kpc)",
        "discoveryDate": "1054-07-04 (Heian Era, Tengi 2)",
        "historicalObserver": "Fujiwara no Teika (Meigetsuki) & Yang Wei-te",
        "peakMagnitude": -6.0,
        "currentMagnitude": 8.4,
        "hostGalaxy": "Milky Way (Intragalactic)",
        "redshift": 0.0001,
        "expansionVelocityKmS": 1500.0,
        "declineRateDm15": 0.42,
        "description": "Historic supernova that created the Crab Nebula and Crab Pulsar. Recorded in Japanese court chronicles as shining bright as Venus, visible in broad daylight for 23 days.",
        "samuraiLore": "In Tengi 2 (1054 AD), poet and court noble Fujiwara no Teika recorded in the Meigetsuki that a mysterious Guest Star (客星) arose east of Tianguan. Court Onmyōji divined it as an auspicious harbinger of celestial power, now known to be humanity's benchmark core-collapse supernova.",
        "keyFeatures": [
            "Prominent broad Hα (6563 Å) & Hβ (4861 Å) emission lines",
            "Extended plateau phase lasting ~80 days sustained by hydrogen recombination",
            "Left behind a rapidly spinning 33ms neutron star (Crab Pulsar)",
            "Expanding pulsar wind nebula at ~1,500 km/s"
        ]
    },
    "sn2023ixf": {
        "id": "sn2023ixf",
        "name": "SN 2023ixf (Pinwheel Galaxy Supernova)",
        "japaneseName": "風車銀河の大超新星",
        "designation": "SN 2023ixf / ZTF23aabclxh",
        "type": "Type II Supernova (Core Collapse)",
        "category": "Supernova",
        "alertLevel": "HIGH",
        "constellation": "Ursa Major (北斗七星)",
        "coordinates": {"ra": "14h 03m 38.58s", "dec": "+54° 18′ 42.1″"},
        "distance": "20.9 Million light-years (6.4 Mpc)",
        "discoveryDate": "2023-05-19",
        "historicalObserver": "Koichi Itagaki (Yamagata, Japan)",
        "peakMagnitude": 10.8,
        "currentMagnitude": 15.6,
        "hostGalaxy": "Messier 101 (Pinwheel Galaxy)",
        "redshift": 0.0008,
        "expansionVelocityKmS": 9800.0,
        "declineRateDm15": 0.85,
        "description": "The closest and brightest core-collapse supernova in a decade, discovered by legendary Japanese amateur astronomer Koichi Itagaki. Prompt flash spectroscopy revealed massive circumstellar material interaction.",
        "samuraiLore": "Discovered by Japanese astronomer Koichi Itagaki in Yamagata prefecture. In feudal star lore, the Pinwheel in the Great Bear was viewed as the spinning sun-wheel of warrior general Hachiman, heralding transformative stellar rebirth.",
        "keyFeatures": [
            "Early flash-ionization emission of N III, C III, and He II",
            "Dense circumstellar shell ejected by red supergiant progenitor months before collapse",
            "P-Cygni profiles with maximum ejecta velocity approaching 10,000 km/s",
            "Strong Balmer emission series throughout decline"
        ]
    },
    "sn2011fe": {
        "id": "sn2011fe",
        "name": "SN 2011fe (Standard Candle Benchmark)",
        "japaneseName": "宇宙の標準光源 (1a型超新星)",
        "designation": "SN 2011fe / PTF11kly",
        "type": "Type Ia Supernova (Thermonuclear)",
        "category": "Supernova",
        "alertLevel": "HIGH",
        "constellation": "Ursa Major (北斗七星)",
        "coordinates": {"ra": "14h 03m 05.81s", "dec": "+54° 16′ 25.2″"},
        "distance": "21.0 Million light-years (6.4 Mpc)",
        "discoveryDate": "2011-08-24",
        "historicalObserver": "Palomar Transient Factory (PTF)",
        "peakMagnitude": 9.9,
        "currentMagnitude": 18.2,
        "hostGalaxy": "Messier 101 (Pinwheel Galaxy)",
        "redshift": 0.0008,
        "expansionVelocityKmS": 11500.0,
        "declineRateDm15": 1.10,
        "description": "The golden standard of Type Ia thermonuclear supernovae. Caused by the complete carbon-oxygen detonation of an accreting white dwarf surpassing the Chandrasekhar mass limit (~1.44 M☉).",
        "samuraiLore": "Just as a samurai's katana is measured with absolute precision, Type Ia supernovae possess standard absolute luminosities, acting as celestial tape-measures that revealed the accelerating expansion of our universe.",
        "keyFeatures": [
            "Complete absence of Hydrogen (H) and Helium (He) lines",
            "Deep, prominent Si II (6355 Å) absorption trough blueshifted to ~6150 Å (v ≈ 11,500 km/s)",
            "Strong S II 'W-feature' at 5400-5600 Å",
            "Classical Phillips relation light curve with Δm15 = 1.10 mag"
        ]
    },
    "at2017gfo": {
        "id": "at2017gfo",
        "name": "AT2017gfo (GW170817 Neutron Star Kilonova)",
        "japaneseName": "重力波中性子星合体 (キロノバ)",
        "designation": "AT2017gfo / SSS17a",
        "type": "Kilonova (BNS Merger r-Process)",
        "category": "Kilonova",
        "alertLevel": "CRITICAL",
        "constellation": "Hydra (海蛇座)",
        "coordinates": {"ra": "13h 09m 48.08s", "dec": "-23° 22′ 53.3″"},
        "distance": "130 Million light-years (40 Mpc)",
        "discoveryDate": "2017-08-17",
        "historicalObserver": "LIGO/Virgo & Swope Telescope",
        "peakMagnitude": 17.2,
        "currentMagnitude": 23.5,
        "hostGalaxy": "NGC 4993",
        "redshift": 0.0097,
        "expansionVelocityKmS": 60000.0,
        "declineRateDm15": 3.80,
        "description": "First ever multi-messenger astronomical event combining gravitational waves (GW170817) and electromagnetic radiation. Forged dozens of Earth masses in gold, platinum, and heavy lanthanides via the rapid neutron-capture process (r-process).",
        "samuraiLore": "Feudal metallurgists believed true gold was forged in celestial fires. Modern astrophysics confirmed this: the golden hilt ornaments (menuki) of samurai katanas were physically birthed in violent kilonova mergers like AT2017gfo.",
        "keyFeatures": [
            "Ultra-rapid blue optical decline over 48 hours transitioning to infrared glow",
            "High opacity from synthesized lanthanide and actinide elements",
            "Relativistic ejecta velocity of ~0.2c (60,000 km/s)",
            "Multi-messenger coincident detection with gravitational ripple"
        ]
    },
    "grb221009a": {
        "id": "grb221009a",
        "name": "GRB 221009A (The BOAT - Brightest of All Time)",
        "japaneseName": "宇宙史上最強の爆発 (BOAT)",
        "designation": "GRB 221009A / Swift J1913.1+1946",
        "type": "Long Gamma-Ray Burst (Collapsar)",
        "category": "Gamma-Ray Burst",
        "alertLevel": "CRITICAL",
        "constellation": "Sagitta (矢座)",
        "coordinates": {"ra": "19h 13m 27.9s", "dec": "+19° 46′ 27″"},
        "distance": "2.4 Billion light-years (z = 0.151)",
        "discoveryDate": "2022-10-09",
        "historicalObserver": "Fermi LAT, Swift, LHAASO",
        "peakMagnitude": 14.1,
        "currentMagnitude": 22.0,
        "hostGalaxy": "Moderate star-forming host at z = 0.151",
        "redshift": 0.151,
        "expansionVelocityKmS": 298000.0,
        "declineRateDm15": 2.65,
        "description": "Once-in-10,000-years cosmic event that blinded space gamma-ray detectors and perturbed Earth's upper ionosphere. The birth of a stellar-mass black hole with an ultra-relativistic jet pointing straight toward Earth.",
        "samuraiLore": "Known as the Heavenly Arrow of Amaterasu piercing across two billion light-years. The sudden burst disturbed earthly radio signals much like ancient thunder spirits in Japanese mythology.",
        "keyFeatures": [
            "Synchrotron power-law continuum spectrum across optical and infrared",
            "Relativistic Lorentz factor Γ > 400",
            "Prompt emission detected up to unprecedented 18 TeV energies by LHAASO",
            "Underlying supernova component (SN 2022xiw) emerged ~2 weeks later"
        ]
    },
    "asassn-14li": {
        "id": "asassn-14li",
        "name": "ASASSN-14li (Tidal Disruption Event)",
        "japaneseName": "超大質量ブラックホール潮汐破壊",
        "designation": "ASASSN-14li / PGC 043234",
        "type": "Tidal Disruption Event (TDE)",
        "category": "Tidal Disruption",
        "alertLevel": "MONITORING",
        "constellation": "Coma Berenices (髪座)",
        "coordinates": {"ra": "12h 48m 15.23s", "dec": "+17° 46′ 26.4″"},
        "distance": "290 Million light-years (90 Mpc)",
        "discoveryDate": "2014-11-22",
        "historicalObserver": "All-Sky Automated Survey for Supernovae (ASAS-SN)",
        "peakMagnitude": 15.8,
        "currentMagnitude": 19.5,
        "hostGalaxy": "PGC 043234",
        "redshift": 0.0206,
        "expansionVelocityKmS": 14200.0,
        "declineRateDm15": 0.35,
        "description": "A 3-million solar mass supermassive black hole shredding and swallowing a passing star. Produces luminous accretion radiation decaying gracefully with the classical t^(-5/3) mass fallback rate.",
        "samuraiLore": "Feudal masters spoke of the 'Void Maw' (虚無の口), where matter is drawn into eternal silence. TDEs exhibit the raw tidal forces of black holes rending stars into ribbons of blazing plasma.",
        "keyFeatures": [
            "Constant thermal UV/optical blackbody temperature (~35,000 K) over months",
            "Characteristic t^(-5/3) photometric flux decay power law",
            "Broad He II (4686 Å) and Hα emission lines with velocities > 10,000 km/s",
            "Soft thermal X-ray emission from newly formed inner accretion disk"
        ]
    }
}


def generate_light_curve(event_id: str) -> List[Dict[str, Any]]:
    """
    Generates realistic multi-band (g, r, i) photometric light curve time-series.
    Days relative to explosion / peak (-15 to +100 days).
    """
    event = TRANSIENT_EVENTS.get(event_id, TRANSIENT_EVENTS["sn1054-crab"])
    peak_mag = event["peakMagnitude"]
    category = event["category"]
    dm15 = event["declineRateDm15"]

    curve = []
    days = [
        -15, -12, -10, -8, -6, -4, -2, -1, 0, 1, 2, 4, 7, 10, 15, 20, 25, 30, 40, 50, 60, 75, 90, 110
    ]

    for d in days:
        if d < 0:
            # Rise phase: exponential / parabolic rise
            fraction = (15 + d) / 15.0
            mag_offset = (1.0 - fraction ** 1.8) * 4.5
        elif d == 0:
            mag_offset = 0.0
        else:
            if category == "Supernova" and "II-P" in event["type"]:
                # Type II-P plateau phase
                if d <= 60:
                    mag_offset = 0.2 + (d / 60.0) * 0.4
                else:
                    mag_offset = 0.6 + ((d - 60) / 20.0) * 2.2
            elif category == "Kilonova":
                # Ultra fast decline
                mag_offset = math.log10(1 + d * 0.8) * 3.8
            elif category == "Gamma-Ray Burst":
                # Power law decline
                mag_offset = math.log10(1 + d * 1.5) * 3.2
            elif category == "Tidal Disruption":
                # t^(-5/3) fallback law
                mag_offset = math.log10(1 + (d / 20.0)) * 1.8
            else:
                # Type Ia / Standard decline
                if d <= 15:
                    mag_offset = (d / 15.0) * dm15
                else:
                    mag_offset = dm15 + ((d - 15) / 50.0) * 1.5

        # Colors: g is bluer (brighter at early times), r is intermediate, i is redder
        color_gr = -0.15 + (d + 15) * 0.008
        color_ri = -0.10 + (d + 15) * 0.005

        r_val = round(peak_mag + mag_offset, 2)
        g_val = round(r_val + color_gr, 2)
        i_val = round(r_val - color_ri, 2)

        curve.append({
            "day": d,
            "mjd": round(59000.0 + d, 1),
            "g_mag": g_val,
            "r_mag": r_val,
            "i_mag": i_val,
            "flux_normalized": round(math.exp(-mag_offset / 1.086), 4),
            "phase": "Pre-maximum Rise" if d < 0 else ("Peak Maximum" if d == 0 else ("Plateau" if d <= 60 and "II-P" in event["type"] else "Exponential Decay"))
        })

    return curve


def generate_spectral_data(event_id: str) -> Dict[str, Any]:
    """
    Generates high-resolution calibrated spectrum (Wavelength 3600 Å to 8800 Å)
    and identifies chemical absorption and emission lines with Doppler kinematics.
    """
    event = TRANSIENT_EVENTS.get(event_id, TRANSIENT_EVENTS["sn1054-crab"])
    category = event["category"]
    transient_type = event["type"]
    z = event["redshift"]
    vel = event["expansionVelocityKmS"]

    # Specific spectral lines based on class
    lines: List[Dict[str, Any]] = []

    if "Ia" in transient_type:
        # Type Ia: Strong Si II, S II, Ca II, no Hydrogen
        lines = [
            {
                "name": "Si II (6355 Å)",
                "element": "Silicon (Si II)",
                "restWavelength": 6355.0,
                "observedWavelength": round(6355.0 * (1 + z) * (1 - vel / 300000.0), 1),
                "lineType": "absorption",
                "velocityKmS": -vel,
                "description": "Hallmark absorption trough of Type Ia thermonuclear explosions, tracing outer ejecta expanding at ~11,500 km/s."
            },
            {
                "name": "S II 'W-trough' (5468 Å)",
                "element": "Sulfur (S II)",
                "restWavelength": 5468.0,
                "observedWavelength": round(5468.0 * (1 + z) * (1 - vel * 0.85 / 300000.0), 1),
                "lineType": "absorption",
                "velocityKmS": round(-vel * 0.85, 0),
                "description": "Characteristic double-notched 'W' feature from explosive oxygen/carbon burning."
            },
            {
                "name": "Ca II H&K (3945 Å)",
                "element": "Calcium (Ca II)",
                "restWavelength": 3945.0,
                "observedWavelength": round(3945.0 * (1 + z) * (1 - vel * 1.1 / 300000.0), 1),
                "lineType": "absorption",
                "velocityKmS": round(-vel * 1.1, 0),
                "description": "High-velocity calcium absorption component in the UV/blue envelope."
            },
            {
                "name": "Fe II / Co II (5169 Å)",
                "element": "Iron/Cobalt",
                "restWavelength": 5169.0,
                "observedWavelength": round(5169.0 * (1 + z), 1),
                "lineType": "emission",
                "velocityKmS": 0.0,
                "description": "Iron-group nucleosynthesis products from 56Ni -> 56Co -> 56Fe radioactive decay chain."
            }
        ]
    elif "II" in transient_type:
        # Type II: Strong Balmer lines (H-alpha, H-beta)
        lines = [
            {
                "name": "Hα (6563 Å) Balmer Line",
                "element": "Hydrogen (Hα)",
                "restWavelength": 6563.0,
                "observedWavelength": round(6563.0 * (1 + z), 1),
                "lineType": "emission",
                "velocityKmS": vel,
                "description": "Primary hydrogen emission from massive stellar envelope shock breakout."
            },
            {
                "name": "Hβ (4861 Å) Balmer Line",
                "element": "Hydrogen (Hβ)",
                "restWavelength": 4861.0,
                "observedWavelength": round(4861.0 * (1 + z), 1),
                "lineType": "emission",
                "velocityKmS": vel,
                "description": "Secondary Balmer hydrogen transition, confirming thick circumstellar hydrogen envelope."
            },
            {
                "name": "He I (5876 Å)",
                "element": "Helium (He I)",
                "restWavelength": 5876.0,
                "observedWavelength": round(5876.0 * (1 + z) * (1 - vel * 0.5 / 300000.0), 1),
                "lineType": "absorption",
                "velocityKmS": round(-vel * 0.5, 0),
                "description": "Ionized helium envelope absorption from pre-collapse stellar winds."
            },
            {
                "name": "[O I] (6300 Å) Doublet",
                "element": "Oxygen ([O I])",
                "restWavelength": 6300.0,
                "observedWavelength": round(6300.0 * (1 + z), 1),
                "lineType": "emission",
                "velocityKmS": 0.0,
                "description": "Forbidden oxygen emission tracing core nucleosynthetic ash from the exploded red supergiant."
            }
        ]
    elif category == "Kilonova":
        # Broad lanthanide-heavy absorption
        lines = [
            {
                "name": "Sr II (10036 Å / 8200 Å tail)",
                "element": "Strontium (Sr II)",
                "restWavelength": 8200.0,
                "observedWavelength": round(8200.0 * (1 + z) * (1 - vel / 300000.0), 1),
                "lineType": "absorption",
                "velocityKmS": -vel,
                "description": "First definitive identification of pure r-process heavy element synthesis in neutron star mergers."
            },
            {
                "name": "Lanthanide Curtain (5000-6000 Å)",
                "element": "Rare Earth Lanthanides",
                "restWavelength": 5200.0,
                "observedWavelength": round(5200.0 * (1 + z), 1),
                "lineType": "absorption",
                "velocityKmS": round(-vel * 0.7, 0),
                "description": "Dense forest of millions of atomic transitions causing extreme optical opacity."
            }
        ]
    else:
        # Default / GRB / TDE
        lines = [
            {
                "name": "He II (4686 Å)",
                "element": "Helium II",
                "restWavelength": 4686.0,
                "observedWavelength": round(4686.0 * (1 + z), 1),
                "lineType": "emission",
                "velocityKmS": vel,
                "description": "Extreme ultraviolet photoionization from accretion disk flare."
            },
            {
                "name": "Hα (6563 Å)",
                "element": "Hydrogen",
                "restWavelength": 6563.0,
                "observedWavelength": round(6563.0 * (1 + z), 1),
                "lineType": "emission",
                "velocityKmS": vel,
                "description": "Broad photoionized outflow line tracing shredded stellar debris."
            }
        ]

    # Generate continuous spectral points (step by 40 Å from 3600 Å to 8600 Å)
    points = []
    for w in range(3600, 8640, 40):
        # Base blackbody continuum
        temp = 8500.0 if "II" in transient_type else (12000.0 if "Ia" in transient_type else 6000.0)
        # Approximate Planck continuum normalized
        base_flux = (1e13 / (w ** 4)) * (1.0 / (math.exp(14388.0 / (w * (temp / 1000.0))) - 0.99))
        base_flux = max(0.2, min(1.8, base_flux * 0.8))

        # Add line perturbations (Gaussian profiles for emission / P-Cygni for absorption)
        total_flux = base_flux
        for line in lines:
            center = line["observedWavelength"]
            sigma = 45.0 + (vel / 200.0)
            diff = (w - center)
            gauss = math.exp(-0.5 * (diff / sigma) ** 2)

            if line["lineType"] == "emission":
                total_flux += gauss * 1.45
            else:
                # P-Cygni absorption trough + slight blue emission wing
                total_flux -= gauss * 0.75

        # Add realistic sensor noise
        noise = (math.sin(w * 0.08) * math.cos(w * 0.03)) * 0.04
        flux_final = round(max(0.08, total_flux + noise), 3)

        points.append({
            "wavelength": w,
            "flux": flux_final,
            "continuum": round(base_flux, 3)
        })

    return {
        "event_id": event_id,
        "spectral_points": points,
        "identified_lines": lines,
        "redshift": z,
        "expansion_velocity_km_s": vel
    }


@router.get("/events")
async def list_transient_events(
    category: Optional[str] = Query(None, description="Filter by category (Supernova, Kilonova, Gamma-Ray Burst, Tidal Disruption)"),
    alert_level: Optional[str] = Query(None, description="Filter by alert level (CRITICAL, HIGH, MONITORING)")
) -> Dict[str, Any]:
    """
    Returns list of curated transient alerts with summary telemetry.
    """
    events = list(TRANSIENT_EVENTS.values())
    if category:
        events = [e for e in events if e["category"].lower() == category.lower()]
    if alert_level:
        events = [e for e in events if e["alertLevel"].lower() == alert_level.lower()]

    return {
        "status": "success",
        "total": len(events),
        "events": events
    }


@router.get("/events/{event_id}")
async def get_transient_detail(event_id: str) -> Dict[str, Any]:
    """
    Returns full time-domain light curve and spectral data for a specific transient event.
    """
    if event_id not in TRANSIENT_EVENTS:
        raise HTTPException(status_code=404, detail=f"Transient event '{event_id}' not found.")

    event = TRANSIENT_EVENTS[event_id]
    light_curve = generate_light_curve(event_id)
    spectral = generate_spectral_data(event_id)

    return {
        "status": "success",
        "event": event,
        "timeDomain": {
            "lightCurve": light_curve,
            "peakMagnitude": event["peakMagnitude"],
            "declineRateDm15": event["declineRateDm15"],
            "riseDays": 15,
            "bands": ["g (477 nm)", "r (623 nm)", "i (762 nm)"]
        },
        "spectroscopy": spectral,
        "classification": {
            "primaryClass": event["type"],
            "confidenceScore": 98.4,
            "hostRedshift": event["redshift"],
            "expansionVelocity": f"{event['expansionVelocityKmS']:,} km/s",
            "anomalyScore": 0.94 if event["alertLevel"] == "CRITICAL" else 0.78,
            "samuraiVerdict": "Verified Guest Star (客星認定) — Recorded into Tsukuyomi Chronicle"
        }
    }


@router.get("/detect")
async def detect_transient_anomaly(
    peak_mag: float = Query(-6.0, description="Estimated peak apparent magnitude"),
    rise_time_days: float = Query(12.0, description="Days from first detection to maximum brightness"),
    has_hydrogen: bool = Query(True, description="Balmer H-alpha/beta detected in spectra"),
    expansion_velocity: float = Query(9800.0, description="Expansion velocity in km/s from Doppler blueshift")
) -> Dict[str, Any]:
    """
    Heuristic rule-based astronomical transient classifier mimicking machine learning alert brokers (e.g. ALeRCE / Fink).
    """
    if not has_hydrogen and expansion_velocity > 10000.0:
        predicted_class = "Type Ia Thermonuclear Supernova"
        confidence = 97.2
        progenitor = "Accreting Carbon-Oxygen White Dwarf (Chandrasekhar Limit)"
        japanese_omen = "白虎の星 (White Tiger Star - Standard Candle)"
    elif has_hydrogen and rise_time_days > 8.0:
        predicted_class = "Type II Core-Collapse Supernova"
        confidence = 95.8
        progenitor = "Massive Red/Blue Supergiant Star (> 8 M☉)"
        japanese_omen = "天関の客星 (Tianguan Guest Star - Progenitor of Crab Pulsar)"
    elif expansion_velocity > 40000.0:
        predicted_class = "Relativistic Kilonova / BNS Merger"
        confidence = 91.5
        progenitor = "Binary Neutron Star Coalescence"
        japanese_omen = "黄金錬成星 (Alchemical Gold Forge Star)"
    else:
        predicted_class = "Stellar Nova / Photometric Variable"
        confidence = 88.0
        progenitor = "Classical Cataclysmic Variable"
        japanese_omen = "変光の妖星 (Flickering Phantom Star)"

    return {
        "status": "classified",
        "predictedClass": predicted_class,
        "confidence": confidence,
        "progenitorModel": progenitor,
        "japaneseOmen": japanese_omen,
        "dopplerShiftBeta": round(expansion_velocity / 299792.0, 4),
        "kinematics": {
            "expansionVelocityKmS": expansion_velocity,
            "speedOfLightFraction": f"{round((expansion_velocity / 299792.0) * 100, 2)}% c"
        }
    }

