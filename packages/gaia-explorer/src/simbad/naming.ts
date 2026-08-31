const GREEK: Readonly<Record<string, string>> = {
    alf: "Alpha",
    bet: "Beta",
    gam: "Gamma",
    del: "Delta",
    eps: "Epsilon",
    zet: "Zeta",
    eta: "Eta",
    the: "Theta",
    iot: "Iota",
    kap: "Kappa",
    lam: "Lambda",
    mu: "Mu",
    nu: "Nu",
    xi: "Xi",
    omi: "Omicron",
    pi: "Pi",
    rho: "Rho",
    sig: "Sigma",
    tau: "Tau",
    ups: "Upsilon",
    phi: "Phi",
    chi: "Chi",
    psi: "Psi",
    ome: "Omega",
};
const CONST: Readonly<Record<string, string>> = {
    And: "Andromedae",
    Ant: "Antliae",
    Aps: "Apodis",
    Aql: "Aquilae",
    Aqr: "Aquarii",
    Ara: "Arae",
    Ari: "Arietis",
    Aur: "Aurigae",
    Boo: "Bootis",
    CMa: "Canis Majoris",
    CMi: "Canis Minoris",
    CVn: "Canum Venaticorum",
    Cae: "Caeli",
    Cam: "Camelopardalis",
    Cap: "Capricorni",
    Car: "Carinae",
    Cas: "Cassiopeiae",
    Cen: "Centauri",
    Cep: "Cephei",
    Cet: "Ceti",
    Cha: "Chamaeleontis",
    Cir: "Circini",
    Cnc: "Cancri",
    Col: "Columbae",
    Com: "Comae Berenices",
    CrA: "Coronae Australis",
    CrB: "Coronae Borealis",
    Crt: "Crateris",
    Cru: "Crucis",
    Crv: "Corvi",
    Cyg: "Cygni",
    Del: "Delphini",
    Dor: "Doradus",
    Dra: "Draconis",
    Equ: "Equulei",
    Eri: "Eridani",
    For: "Fornacis",
    Gem: "Geminorum",
    Gru: "Gruis",
    Her: "Herculis",
    Hor: "Horologii",
    Hya: "Hydrae",
    Hyi: "Hydri",
    Ind: "Indi",
    Lac: "Lacertae",
    Leo: "Leonis",
    LMi: "Leonis Minoris",
    Lep: "Leporis",
    Lib: "Librae",
    Lup: "Lupi",
    Lyn: "Lyncis",
    Lyr: "Lyrae",
    Men: "Mensae",
    Mic: "Microscopii",
    Mon: "Monocerotis",
    Mus: "Muscae",
    Nor: "Normae",
    Oct: "Octantis",
    Oph: "Ophiuchi",
    Ori: "Orionis",
    Pav: "Pavonis",
    Peg: "Pegasi",
    Per: "Persei",
    Phe: "Phoenicis",
    Pic: "Pictoris",
    PsA: "Piscis Austrini",
    Psc: "Piscium",
    Pup: "Puppis",
    Pyx: "Pyxidis",
    Ret: "Reticuli",
    Scl: "Sculptoris",
    Sco: "Scorpii",
    Sct: "Scuti",
    Ser: "Serpentis",
    Sex: "Sextantis",
    Sge: "Sagittae",
    Sgr: "Sagittarii",
    Tau: "Tauri",
    Tel: "Telescopii",
    TrA: "Trianguli Australis",
    Tri: "Trianguli",
    Tuc: "Tucanae",
    UMa: "Ursae Majoris",
    UMi: "Ursae Minoris",
    Vel: "Velorum",
    Vir: "Virginis",
    Vol: "Volantis",
    Vul: "Vulpeculae",
};
export function expandBayerFlamsteed(raw: string): string | undefined {
    const parts = raw
        .replace(/^(?:\*|V\*|\*\*|Cl\*)\s*/, "")
        .trim()
        .split(/\s+/);
    const first = parts[0];
    const constellation = parts[1];
    if (first === undefined || constellation === undefined) {
        return undefined;
    }
    const genitive = CONST[constellation];
    if (genitive === undefined) {
        return undefined;
    }
    let head: string | undefined;
    if (/^\d+$/.test(first)) {
        head = first;
    } else {
        const bayer = /^([A-Za-z]{3})(\d{0,2})$/.exec(first);
        const abbreviation = bayer?.[1];
        const greek = abbreviation === undefined ? undefined : GREEK[abbreviation.toLowerCase()];
        if (greek !== undefined) {
            head = `${greek}${bayer?.[2] ?? ""}`;
        }
    }
    if (head === undefined) {
        return undefined;
    }
    return `${head} ${genitive} ${parts.slice(2).join(" ")}`.trim();
}
type ScoredName = readonly [score: number, label: string];
function scoreCatalogName(name: string): ScoredName {
    if (/^G(?:J|LIESE)\s*\d+\w*$/i.test(name)) {
        return [88, name.replace(/^GLIESE\s*/i, "GJ ").toUpperCase()];
    }
    if (/^HR\s*\d+$/i.test(name)) {
        return [84, name];
    }
    if (/^HD\s*\d+$/i.test(name)) {
        return [82, name];
    }
    if (/^HIP\s*\d+$/i.test(name)) {
        return [80, name];
    }
    if (/^(?:BD|CD|CPD)\s*[+-]?\s*\d+\s*\d+$/i.test(name)) {
        return [70, name];
    }
    if (/^(?:LHS|LP|LTT|L|WOLF|ROSS|G)\s+[-\d ]+\w*$/i.test(name)) {
        return [68, name];
    }
    if (/^TYC\s*\d+-\d+-\d+$/i.test(name)) {
        return [60, name];
    }
    if (/^2MASS\s+/i.test(name)) {
        return [30, name];
    }
    return [40, name];
}
function scoreIdentifier(raw: string): ScoredName | undefined {
    const candidate = raw
        .replace(/^(?:\*|V\*|\*\*|Cl\*)\s*/, "")
        .replace(/\s+/g, " ")
        .trim();
    const properName = /^NAME(-IAU)?\s+(.+)$/i.exec(candidate);
    const clean = properName?.[2]?.trim() ?? candidate;
    if (clean === "") {
        return undefined;
    }
    if (properName !== null) {
        return [properName[1] === undefined ? 120 : 130, clean];
    }
    const expanded = expandBayerFlamsteed(clean);
    return expanded === undefined ? scoreCatalogName(clean) : [110, expanded];
}
export function chooseBestName(mainId: string | null, ids: ReadonlyArray<string>, fallback: string): string {
    let best: ScoredName = [-1, fallback];
    for (const raw of [mainId ?? "", ...ids, fallback]) {
        const scored = scoreIdentifier(raw);
        if (scored === undefined) {
            continue;
        }
        if (scored[0] > best[0]) {
            best = scored;
        }
    }
    return best[1];
}
