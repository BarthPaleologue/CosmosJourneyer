//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { degreesToRadians, durationToSeconds, getOrbitalPeriod } from "@cosmos-journeyer/physics";

import { getVestaSystemModel } from "../universe/customSystems/vesta";
import type { PersistentEntityModel } from "./persistentEntityModel";
import type { PersistentEntityRegistry } from "./persistentEntityRegistry";

import teapotPath from "@assets/utahTeapot/teapot.glb";

export function addAuthoredEntityModels(registry: PersistentEntityRegistry) {
    const vestaSystem = getVestaSystemModel();
    registry.register(vestaSystem.coordinates, getVestaAuthoredEntityModels());
}

export function getVestaAuthoredEntityModels() {
    const vestaSystem = getVestaSystemModel();
    const vesta = vestaSystem.stellarObjects[0];
    const aphrodite = vestaSystem.planets[1];
    const melpomene = vestaSystem.planets[2];
    const phileas = vestaSystem.satellites[1];
    const newJulesVerne = vestaSystem.orbitalFacilities[0];

    const kagareUplinkOrbitRadius = vesta.radius * 3;

    return [
        {
            type: "orbital",
            content: {
                type: "simpleAsset",
                url: teapotPath,
            },
            orbitalObject: {
                type: "custom",
                id: "teapot",
                name: "Unassuming teapot",
                mass: 0.5,
                orbit: {
                    parentIds: [melpomene.id],
                    semiMajorAxis: 4.2 * melpomene.radius,
                    eccentricity: 0.2,
                    argumentOfPeriapsis: 0,
                    initialMeanAnomaly: 0,
                    longitudeOfAscendingNode: 0,
                    inclination: degreesToRadians(22),
                    p: 2,
                },
                rotation: {
                    axialTilt: degreesToRadians(67),
                    siderealPeriod: durationToSeconds({ minutes: 4, seconds: 23 }),
                    spinAxisAzimuth: 0,
                    initialRotationAngle: 0,
                },
            },
        },
        {
            type: "grounded",
            name: "Philea's journey",
            content: {
                type: "diaryDiscussion",
                entry: {
                    author: "Philea",
                    content: `Bonjour tout le monde !
                    C'est mon premier journal de voyage depuis mon départ de ${newJulesVerne.name} hier. 
                    Je me suis dis qu'il vallait mieux commencer pas trop loin au cas où je me plante.
                    Et quoi de mieux qu'une lune qui porte presque mon nom pour commencer, la coincidence est trop belle !
                    J'ai déployé la balise partagé en orbite, tout s'est bien passé jusqu'ici, 
                    je repasserai dans quelques mois pour voir si vous l'avez trouvé.
                    Je comptais rester 80 jours à la surface pour faire le tour complet autour d'${aphrodite.name}, mais je crains de m'ennuyer d'ici peu.
                    J'imagine que j'irai plutôt voir Ananke de mes propres yeux. Wadid y est allé la semaine dernière je ne veux pas rester en reste.`,
                },
                reactions: [
                    {
                        author: "Ray T.",
                        content: `Salutations Philea.
                        J'ai bien trouvé ton message, bievenue. 
                        Je me dois de te signaler que ta balise est réglée incorrectement et émet bien plus fort que prévu.
                        J'ai pu repérer le signal depuis l'autre bout du système solaire.
                        Cordialement,
                        Ray T.`,
                    },
                ],
            },
            location: {
                objectId: phileas.id,
                latitude: 0,
                longitude: 0,
                groundDeltaHeight: 0,
            },
        },
        {
            type: "orbital",
            content: {
                type: "uplink",
            },
            orbitalObject: {
                type: "custom",
                id: "kagareUplink",
                name: "Kagare uplink",
                mass: 1000e3, // idea: try estimate the mass of the thing from material density and volume
                orbit: {
                    parentIds: [vesta.id],
                    semiMajorAxis: kagareUplinkOrbitRadius,
                    eccentricity: 0,
                    inclination: degreesToRadians(90),
                    argumentOfPeriapsis: 0,
                    initialMeanAnomaly: 0,
                    longitudeOfAscendingNode: 0,
                    p: 2,
                },
                rotation: {
                    axialTilt: 0,
                    spinAxisAzimuth: 0,
                    initialRotationAngle: 0,
                    siderealPeriod: getOrbitalPeriod(kagareUplinkOrbitRadius, vesta.mass),
                },
            },
        },
    ] as const satisfies Array<PersistentEntityModel>;
}
