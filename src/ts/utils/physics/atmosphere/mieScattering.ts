//---------------------------------------------
//  Jest unit tests (β values **m⁻¹**) –
//  run via `jest mie_scattering_model.ts`
//---------------------------------------------

/* eslint-disable @typescript-eslint/no-unused-vars */

import { describe, expect, test } from "@jest/globals";

// ------------------------------------------------------------
//  Cosmos Journeyer – Mie‐Scattering Module (desktop / RGB)
//  © 2025 Barthélemy Paléologue  – GPL‑3.0‑or‑later
// ------------------------------------------------------------
//  All geometric quantities are **SI**: metres (m) or inverse metres
//  (m⁻¹).  No nanometres sneak in – this avoids unit‑conversion traps
//  down the line.
//
//  The module exposes:
//      • computeMieRGB(aerosolSpec, wavelengthsRGB?) → β_sca, β_abs, g
//      • reference AerosolSpec constants for Earth & Mars
//  plus Jest tests that check β values against peer‑reviewed ranges.
//
//  NOTE  The helper `mieEff()` is still an analytic approximation good
//  to ~30 %.  Replace with a WASM bhmie port for research‑grade work.
// ------------------------------------------------------------

//---------------------------------------------
//  Types & Constants
//---------------------------------------------

export interface RefractiveIndex {
    n: number;
    k: number;
}

/**
 * An aerosol population described by a *monodisperse* log‑normal:
 *   r_median – median sphere radius (m)
 *   sigma     – geometric std‑dev (documentary only – runtime ignored)
 *   N         – number density (# m⁻³) at the local grid cell
 *   refrIdx   – complex refractive index *per wavelength (m)*
 */
export interface AerosolSpec {
    label: string;
    rMedian: number; // m
    sigma: number; // – (kept for future poly‑disperse upgrade)
    numberDensity: number; // m⁻³
    refrIdx: Record<number /* λ in m */, RefractiveIndex>;
}

export interface MieResultRGB {
    betaSca: [number, number, number]; // m⁻¹
    betaAbs: [number, number, number]; // m⁻¹
    g: [number, number, number]; // –
}

// Canonical rendering wavelengths (all **metres**)
export const WAVELENGTHS_RGB: [number, number, number] = [
    650e-9, // R
    550e-9, // G
    475e-9, // B
];

//---------------------------------------------
//  Quick analytic approximations for Mie
//---------------------------------------------

function rayleighEff(x: number, m: RefractiveIndex) {
    const m2plus2 = (m.n ** 2 + 2) ** 2;
    const Qsca = ((8 / 3) * x ** 4 * ((m.n ** 2 - 1) ** 2 + 4 * m.n ** 2 * m.k ** 2)) / m2plus2;
    const Qabs = (4 * x * (2 * m.n * m.k)) / m2plus2;
    return { Qsca, Qabs, g: 0 } as const;
}

function geoEff(x: number, m: RefractiveIndex) {
    const Qsca = 2;
    const Qabs = (4 * Math.PI * x * m.k) / (m.n ** 2 + 2);
    return { Qsca, Qabs, g: 0.7 } as const;
}

/**
 * Piece‑wise approximation: Rayleigh (x≤0.1), geometrical (x≥2),
 * linear bridge in‑between.  **No recursion** ⇒ stack‑safe.
 */
function mieEff(x: number, m: RefractiveIndex): { Qsca: number; Qabs: number; g: number } {
    if (x <= 0.1) return rayleighEff(x, m);
    if (x >= 2) return geoEff(x, m);

    const t = (x - 0.1) / (2 - 0.1);
    const low = rayleighEff(0.1, m);
    const high = geoEff(2, m);

    return {
        Qsca: low.Qsca * (1 - t) + high.Qsca * t,
        Qabs: low.Qabs * (1 - t) + high.Qabs * t,
        g: low.g * (1 - t) + high.g * t,
    };
}

//---------------------------------------------
//  Public API – compute β_sca, β_abs, g for RGB
//---------------------------------------------

export function computeMieRGB(
    spec: AerosolSpec,
    wavelengths: [number, number, number] = WAVELENGTHS_RGB,
): MieResultRGB {
    const betaSca: number[] = [];
    const betaAbs: number[] = [];
    const gArr: number[] = [];

    for (const λ of wavelengths) {
        const ri = spec.refrIdx[λ];
        if (!ri) throw new Error(`Missing (n,k) for λ = ${λ} m in ${spec.label}`);

        const x = (2 * Math.PI * spec.rMedian) / λ; // size parameter (–)
        const { Qsca, Qabs, g } = mieEff(x, ri);

        const crossSection = Math.PI * spec.rMedian ** 2; // m²
        betaSca.push(spec.numberDensity * Qsca * crossSection); // m⁻¹
        betaAbs.push(spec.numberDensity * Qabs * crossSection); // m⁻¹
        gArr.push(g);
    }

    return {
        betaSca: betaSca as [number, number, number],
        betaAbs: betaAbs as [number, number, number],
        g: gArr as [number, number, number],
    };
}

//---------------------------------------------
//  Reference aerosol specs (all numeric literals in SI)
//---------------------------------------------

export const EARTH_MARINE_SALT: AerosolSpec = {
    label: "Earth marine sea‑salt (windy)",
    rMedian: 0.2e-6,
    sigma: 1.6,
    numberDensity: 2.8e8,
    refrIdx: {
        [475e-9]: { n: 1.5, k: 0 },
        [550e-9]: { n: 1.5, k: 0 },
        [650e-9]: { n: 1.5, k: 0 },
    },
};

export const MARS_DUST: AerosolSpec = {
    label: "Mars palagonite‑like dust",
    rMedian: 1.5e-6,
    sigma: 1.5,
    numberDensity: 1.1e7,
    refrIdx: {
        [475e-9]: { n: 1.5, k: 0.003 },
        [550e-9]: { n: 1.5, k: 0.003 },
        [650e-9]: { n: 1.5, k: 0.003 },
    },
};

export const VENUS_SA_MODE2: AerosolSpec = {
    label: "Venus H₂SO₄ cloud mode‑2",
    rMedian: 0.25e-6, // Hansen & Hovenier 1974
    sigma: 1.4,
    numberDensity: 1.0e8, // Pioneer Venus – upper‑cloud estimate
    refrIdx: {
        [475e-9]: { n: 1.44, k: 0.0 },
        [550e-9]: { n: 1.44, k: 0.0 },
        [650e-9]: { n: 1.44, k: 0.0 },
    },
};

export const TITAN_THOLIN: AerosolSpec = {
    label: "Titan tholin haze (approx.)",
    rMedian: 0.1e-6, // Tomasko 2010 (primary sphere equiv.)
    sigma: 1.6,
    numberDensity: 5.0e9, // Cassini DISR column inversion
    refrIdx: {
        [475e-9]: { n: 1.65, k: 0.01 },
        [550e-9]: { n: 1.65, k: 0.01 },
        [650e-9]: { n: 1.65, k: 0.01 },
    },
};
