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

import type { NodeMaterialConnectionPoint } from "@babylonjs/core";
import { NodeMaterial } from "@babylonjs/core/Materials/Node/nodeMaterial";
import type { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Vector3, Vector4 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import {
    abs,
    add,
    distance,
    dot,
    f,
    instanceAttribute,
    length,
    mix,
    mul,
    normalize,
    oneMinus,
    outputFragColor,
    outputVertexPosition,
    pbr,
    remap,
    smoothstep,
    splitVec,
    sub,
    swizzle,
    textureTriPlanarSample,
    transformDirection,
    transformPosition,
    uniformCameraPosition,
    uniformTexture2d,
    uniformView,
    uniformViewProjection,
    uniformWorld,
    vec,
    vertexAttribute,
} from "babylonjs-shading-language";

import type { TelluricPlanetModel } from "@/backend/universe/orbitalObjects/telluricPlanetModel";
import type { TelluricSatelliteModel } from "@/backend/universe/orbitalObjects/telluricSatelliteModel";

import type { TerrainTextures } from "@/frontend/assets/textures/terrains";
import { lerp } from "@/frontend/helpers/animations/interpolations";

import {
    mixTriPlanarSamples,
    triangleWave3d,
    triPlanarMaterial,
    type TriPlanarMaterialSamples,
} from "@/utils/bslExtensions";
import { celsiusToKelvin, kelvinToCelsius } from "@/utils/physics/unitConversions";
import { assertUnreachable, type DeepReadonly } from "@/utils/types";

type WorldType =
    /** World with atmosphere and liquid water */
    | "wet"
    /** World with atmosphere but no liquid water */
    | "dry"
    /** World without atmosphere */
    | "airless";

export class TelluricPlanetMaterial2 {
    private readonly material: NodeMaterial;

    constructor(
        planetModel: DeepReadonly<TelluricPlanetModel> | DeepReadonly<TelluricSatelliteModel>,
        textures: {
            grass: TerrainTextures;
            sand: TerrainTextures;
            rock: TerrainTextures;
            snow: TerrainTextures;
            noise: Texture;
        },
        scene: Scene,
    ) {
        this.material = new NodeMaterial("TelluricPlanetMaterial", scene);

        const position = vertexAttribute("position");
        const normal = vertexAttribute("normal");

        // Node material hack: we store the chunk position in the instance color attribute of the mesh
        const chunkPosition = splitVec(instanceAttribute("instanceColor")).xyzOut;

        const world = uniformWorld();
        const positionW = transformPosition(world, position);
        const normalW = transformDirection(world, normal);

        const viewProjection = uniformViewProjection();
        const positionClipSpace = transformPosition(viewProjection, positionW);

        const vertexOutput = outputVertexPosition(positionClipSpace);

        const positionPlanetSpace = add(position, chunkPosition);
        const normalPlanetSpace = normal;
        const gravityUpPlanetSpace = normalize(positionPlanetSpace);

        const northPlanetSpace = vec(Vector3.Up());
        const cosLatitude = dot(gravityUpPlanetSpace, northPlanetSpace); // [-1, 1]
        const equatorFactor = oneMinus(abs(cosLatitude)); // 1 at equator, 0 at poles
        const elevationAboveSeaLevel = sub(
            length(positionPlanetSpace),
            f(planetModel.radius + (planetModel.ocean?.depth ?? 0)),
        );

        const poleTemperature = planetModel.temperature.min;
        const equatorTemperature = planetModel.temperature.max;

        console.log("temperature range", kelvinToCelsius(poleTemperature), kelvinToCelsius(equatorTemperature));

        const canHaveLiquidWater = planetModel.ocean !== null;

        const seaLevelTemperature = mix(f(poleTemperature), f(equatorTemperature), equatorFactor);
        const atmosphereStrength = 0.7; // will be a parameter
        const temperatureHeightFalloff = lerp(0.0, 0.0065, atmosphereStrength); // K per meter
        console.log("temperature height falloff", temperatureHeightFalloff * 1000, "K/km");
        const altitudeCooling = mul(elevationAboveSeaLevel, f(temperatureHeightFalloff));
        const temperature = sub(seaLevelTemperature, altitudeCooling);

        const samplePointPlanetSpace = triangleWave3d(positionPlanetSpace, new Vector3(-132.0, 17.0, 53.0), 2048.0);

        const cameraPosition = uniformCameraPosition();
        const distanceToCamera = distance(swizzle(positionW, "xyz"), cameraPosition);

        // Fade normals in the distance to smooth visual noise
        const normalStrength = oneMinus(smoothstep(f(300), f(350), distanceToCamera));

        let worldType: WorldType = "airless";
        if (canHaveLiquidWater) {
            worldType = "wet";
        } else if (planetModel.atmosphere !== null) {
            worldType = "dry";
        }

        let finalSamples: TriPlanarMaterialSamples;
        switch (worldType) {
            case "wet":
                finalSamples = this.sampleWetWorld(
                    samplePointPlanetSpace,
                    normalPlanetSpace,
                    gravityUpPlanetSpace,
                    temperature,
                    normalStrength,
                    elevationAboveSeaLevel,
                    planetModel.ocean?.depth,
                    textures,
                );
                break;
            case "airless":
                finalSamples = this.sampleAirlessWorld(
                    samplePointPlanetSpace,
                    normalPlanetSpace,
                    gravityUpPlanetSpace,
                    normalStrength,
                    temperature,
                    planetModel.composition["h2o"] ?? 0,
                    textures,
                );
                break;
            case "dry":
                finalSamples = this.sampleDryWorld(
                    samplePointPlanetSpace,
                    normalPlanetSpace,
                    gravityUpPlanetSpace,
                    temperature,
                    planetModel.atmosphere !== null ? f(planetModel.atmosphere.pressure) : f(0),
                    normalStrength,
                    textures,
                );
                break;
            default:
                assertUnreachable(worldType);
        }

        const finalNormalW = transformDirection(world, finalSamples.normal);

        const view = uniformView();
        const pbrShading = pbr(
            finalSamples.metallic,
            finalSamples.roughness,
            normalW,
            view,
            cameraPosition,
            positionW,
            {
                albedoRgb: finalSamples.albedo,
                perturbedNormal: finalNormalW,
            },
        );

        const fragOutput = outputFragColor(pbrShading.lighting);

        this.material.addOutputNode(vertexOutput);
        this.material.addOutputNode(fragOutput);
        this.material.build();
    }

    private sampleAirlessWorld(
        samplePointPlanetSpace: NodeMaterialConnectionPoint,
        normalPlanetSpace: NodeMaterialConnectionPoint,
        gravityUpPlanetSpace: NodeMaterialConnectionPoint,
        normalStrength: NodeMaterialConnectionPoint,
        temperature: NodeMaterialConnectionPoint,
        iceMassFraction: number,
        textures: {
            rock: TerrainTextures;
            snow: TerrainTextures;
            noise: Texture;
        },
    ) {
        const rockSamples = triPlanarMaterial(textures.rock, mul(samplePointPlanetSpace, f(0.1)), normalPlanetSpace, {
            normalStrength,
        });

        const snowSamples = triPlanarMaterial(textures.snow, mul(samplePointPlanetSpace, f(0.1)), normalPlanetSpace, {
            normalStrength,
        });

        const noiseTexture = uniformTexture2d(textures.noise).source;
        const noiseSample = textureTriPlanarSample(
            noiseTexture,
            mul(samplePointPlanetSpace, f(0.0009)),
            normalPlanetSpace,
        );
        const noiseValue = dot(noiseSample.rgba, vec(new Vector4(0.5, 0.25, 0.125, 0.0625)));

        const detailedFlatnessNormal = normalize(mix(rockSamples.normal, normalPlanetSpace, f(0.9)));
        const detailedFlatness = dot(detailedFlatnessNormal, gravityUpPlanetSpace);
        const flatnessFactorOffset = remap(noiseValue, [0, 1], [-0.2, 0.2]);
        const flatnessFactor = smoothstep(f(0.85), f(1.0), add(detailedFlatness, flatnessFactorOffset));

        const iceSublimationTemperature = f(170); // in Kelvin
        const temperatureFactorOffset = remap(noiseValue, [0, 1], [-1, 1]);
        const temperatureFactor = smoothstep(
            iceSublimationTemperature,
            add(iceSublimationTemperature, f(10)),
            add(temperature, temperatureFactorOffset),
        );

        const flatSamples = mixTriPlanarSamples(snowSamples, rockSamples, temperatureFactor);

        return mixTriPlanarSamples(rockSamples, flatSamples, flatnessFactor);
    }

    private sampleWetWorld(
        samplePointPlanetSpace: NodeMaterialConnectionPoint,
        normalPlanetSpace: NodeMaterialConnectionPoint,
        gravityUpPlanetSpace: NodeMaterialConnectionPoint,
        temperature: NodeMaterialConnectionPoint,
        normalStrength: NodeMaterialConnectionPoint,
        elevationAboveSeaLevel: NodeMaterialConnectionPoint,
        oceanDepth: number | undefined,
        textures: {
            grass: TerrainTextures;
            sand: TerrainTextures;
            rock: TerrainTextures;
            snow: TerrainTextures;
            noise: Texture;
        },
    ): TriPlanarMaterialSamples {
        const grassSamples = triPlanarMaterial(textures.grass, mul(samplePointPlanetSpace, f(0.1)), normalPlanetSpace, {
            normalStrength,
        });

        const rockSamples = triPlanarMaterial(textures.rock, mul(samplePointPlanetSpace, f(0.1)), normalPlanetSpace, {
            normalStrength,
        });

        const snowSamples = triPlanarMaterial(textures.snow, mul(samplePointPlanetSpace, f(0.1)), normalPlanetSpace, {
            normalStrength,
        });

        const sandSamples = triPlanarMaterial(textures.sand, mul(samplePointPlanetSpace, f(0.1)), normalPlanetSpace, {
            normalStrength,
        });

        const noiseTexture = uniformTexture2d(textures.noise).source;
        const noiseSample = textureTriPlanarSample(
            noiseTexture,
            mul(samplePointPlanetSpace, f(0.0009)),
            normalPlanetSpace,
        );
        const noiseValue = dot(noiseSample.rgba, vec(new Vector4(0.5, 0.25, 0.125, 0.0625)));

        const wetnessSample = textureTriPlanarSample(
            noiseTexture,
            mul(gravityUpPlanetSpace, f(0.1)),
            gravityUpPlanetSpace,
        );
        const wetnessValue = dot(wetnessSample.rgba, vec(new Vector4(0.5, 0.25, 0.125, 0.0625)));
        const wetnessThreshold = 0.45;
        const wetnessStd = 0.02;
        let wetnessFactor = smoothstep(
            f(wetnessThreshold - wetnessStd),
            f(wetnessThreshold + wetnessStd),
            wetnessValue,
        );
        // high temperature cutoff
        wetnessFactor = mul(
            wetnessFactor,
            oneMinus(smoothstep(f(celsiusToKelvin(35)), f(celsiusToKelvin(45)), temperature)),
        );

        const temperatureFactorOffset = remap(noiseValue, [0, 1], [-1, 1]);
        const temperatureFactor = smoothstep(f(272.95), f(273.05), add(temperature, temperatureFactorOffset));

        const detailedFlatnessNormal = normalize(mix(rockSamples.normal, normalPlanetSpace, f(0.9)));
        const detailedFlatness = dot(detailedFlatnessNormal, gravityUpPlanetSpace);
        const flatnessFactorOffset = remap(noiseValue, [0, 1], [-0.2, 0.2]);
        const flatnessFactor = smoothstep(f(0.85), f(1.0), add(detailedFlatness, flatnessFactorOffset));

        let flatSamples = grassSamples;
        if (oceanDepth !== undefined) {
            const beachElevationSpan = 100;
            const beachElevationStart = f(-beachElevationSpan / 2);
            const beachElevationEnd = f(beachElevationSpan / 2);
            const beachWeight = mul(
                smoothstep(beachElevationStart, f(0), elevationAboveSeaLevel),
                oneMinus(smoothstep(f(0), beachElevationEnd, elevationAboveSeaLevel)),
            );
            flatSamples = mixTriPlanarSamples(flatSamples, sandSamples, beachWeight);
        }

        flatSamples = mixTriPlanarSamples(sandSamples, grassSamples, wetnessFactor);

        flatSamples = mixTriPlanarSamples(snowSamples, flatSamples, temperatureFactor);

        return mixTriPlanarSamples(rockSamples, flatSamples, flatnessFactor);
    }

    private sampleDryWorld(
        samplePointPlanetSpace: NodeMaterialConnectionPoint,
        normalPlanetSpace: NodeMaterialConnectionPoint,
        gravityUpPlanetSpace: NodeMaterialConnectionPoint,
        temperature: NodeMaterialConnectionPoint,
        pressure: NodeMaterialConnectionPoint,
        normalStrength: NodeMaterialConnectionPoint,
        textures: {
            sand: TerrainTextures;
            rock: TerrainTextures;
            snow: TerrainTextures;
            noise: Texture;
        },
    ): TriPlanarMaterialSamples {
        const rockSamples = triPlanarMaterial(textures.rock, mul(samplePointPlanetSpace, f(0.1)), normalPlanetSpace, {
            normalStrength,
        });

        const snowSamples = triPlanarMaterial(textures.snow, mul(samplePointPlanetSpace, f(0.1)), normalPlanetSpace, {
            normalStrength,
        });

        const sandSamples = triPlanarMaterial(textures.sand, mul(samplePointPlanetSpace, f(0.1)), normalPlanetSpace, {
            normalStrength,
        });

        const noiseTexture = uniformTexture2d(textures.noise).source;
        const noiseSample = textureTriPlanarSample(
            noiseTexture,
            mul(samplePointPlanetSpace, f(0.0009)),
            normalPlanetSpace,
        );
        const noiseValue = dot(noiseSample.rgba, vec(new Vector4(0.5, 0.25, 0.125, 0.0625)));

        const temperatureFactorOffset = remap(noiseValue, [0, 1], [-1, 1]);
        const temperatureFactor = smoothstep(f(272.95), f(273.05), add(temperature, temperatureFactorOffset));

        const detailedFlatnessNormal = normalize(mix(rockSamples.normal, normalPlanetSpace, f(0.9)));
        const detailedFlatness = dot(detailedFlatnessNormal, gravityUpPlanetSpace);
        const flatnessFactorOffset = remap(noiseValue, [0, 1], [-0.2, 0.2]);
        const flatnessFactor = smoothstep(f(0.85), f(1.0), add(detailedFlatness, flatnessFactorOffset));

        const flatSamples = mixTriPlanarSamples(snowSamples, sandSamples, temperatureFactor);

        return mixTriPlanarSamples(rockSamples, flatSamples, flatnessFactor);
    }

    get() {
        return this.material;
    }

    dispose() {
        this.material.dispose();
    }
}
