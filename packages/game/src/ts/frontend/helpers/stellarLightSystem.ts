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

import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";

import type { Camera } from "@babylonjs/core/Cameras/camera";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { CascadedShadowGenerator } from "@babylonjs/core/Lights/Shadows/cascadedShadowGenerator";
import type { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";

import type { AtmosphereUniforms } from "../postProcesses/atmosphere/atmosphereUniforms";
import type { CelestialBody } from "../universe/architecture/orbitalObject";

export class StellarLightSystem {
    private readonly stellarObjects: Array<{
        transform: TransformNode;
        light: DirectionalLight;
        shadowGenerator: CascadedShadowGenerator;
    }> = [];

    private readonly lights: Array<DirectionalLight> = [];

    private readonly scene: Scene;

    private readonly ambientLight: HemisphericLight;

    private readonly skyLightIntensity = 0.2;

    private readonly planetShineIntensity = 0.3;

    constructor(scene: Scene) {
        this.scene = scene;

        this.ambientLight = new HemisphericLight("ambientLight", Vector3.Zero(), this.scene);
        this.ambientLight.intensity = 0.02;
    }

    public registerStellarObject(transform: TransformNode, color: Color3) {
        const light = new DirectionalLight(`${transform.name}Light`, Vector3.Down(), this.scene);
        light.diffuse.copyFrom(color);

        const shadowGenerator = new CascadedShadowGenerator(2048, light);
        shadowGenerator.shadowMaxZ = 1e3;
        shadowGenerator.lambda = 0.95;
        shadowGenerator.usePercentageCloserFiltering = true;
        shadowGenerator.filteringQuality = CascadedShadowGenerator.QUALITY_HIGH;

        this.stellarObjects.push({ transform, light, shadowGenerator });
        this.lights.push(light);
    }

    public addShadowCaster(mesh: TransformNode | AbstractMesh) {
        for (const { shadowGenerator } of this.stellarObjects) {
            if (mesh instanceof AbstractMesh) {
                shadowGenerator.addShadowCaster(mesh);
            } else {
                for (const childMesh of mesh.getChildMeshes()) {
                    shadowGenerator.addShadowCaster(childMesh);
                }
            }
        }
    }

    public addShadowCasters(meshes: ReadonlyArray<TransformNode | AbstractMesh>) {
        for (const mesh of meshes) {
            this.addShadowCaster(mesh);
        }
    }

    public update(camera: Camera, nearestCelestialBody: CelestialBody) {
        const cameraPosition = camera.globalPosition;
        const overallDirectionToLight = Vector3.Zero();
        for (const { transform, light } of this.stellarObjects) {
            const newDirection = cameraPosition.subtract(transform.getAbsolutePosition()).normalize();
            light.direction.copyFrom(newDirection);
            overallDirectionToLight.addInPlace(newDirection.scale(light.intensity));
        }
        overallDirectionToLight.normalize().negateInPlace();

        let atmosphere: AtmosphereUniforms | null = null;
        if (
            nearestCelestialBody.type === "telluricPlanet" ||
            nearestCelestialBody.type === "gasPlanet" ||
            nearestCelestialBody.type === "telluricSatellite"
        ) {
            atmosphere = nearestCelestialBody.atmosphereUniforms;
        }

        if (atmosphere === null) {
            // gentle ambient lighting from the starry sky
            this.ambientLight.direction.copyFrom(overallDirectionToLight);
            this.ambientLight.intensity = 0.02;
            this.ambientLight.diffuse.copyFromFloats(1, 1, 1);
            return;
        }

        const bodyToCamera = cameraPosition.subtract(nearestCelestialBody.getTransform().position);
        const distanceToBody = bodyToCamera.length();
        const upDirection = bodyToCamera.scaleInPlace(1 / distanceToBody);

        const heightAboveSurface = distanceToBody - nearestCelestialBody.getBoundingRadius();
        const atmosphereDensity = Math.exp(-heightAboveSurface / atmosphere.rayleighHeight);
        const lightExtinction = Math.max(upDirection.dot(overallDirectionToLight), 0.0);

        if (distanceToBody < atmosphere.atmosphereRadius) {
            // ambient light from the sky
            this.ambientLight.direction.copyFrom(upDirection);
            this.ambientLight.intensity = this.skyLightIntensity * atmosphereDensity * lightExtinction;
        } else {
            // planet shine
            const bodyViewFraction =
                0.5 * (1 - Math.sqrt(1 - (nearestCelestialBody.getBoundingRadius() / distanceToBody) ** 2));
            this.ambientLight.direction.copyFrom(upDirection.negate());
            this.ambientLight.intensity = this.planetShineIntensity * bodyViewFraction * lightExtinction;
        }

        this.ambientLight.diffuse.copyFromFloats(0.6, 0.7, 0.8);
    }

    public getLights(): Array<DirectionalLight> {
        return this.lights;
    }

    public dispose() {
        for (const { light, shadowGenerator } of this.stellarObjects) {
            light.dispose();
            shadowGenerator.dispose();
        }
        this.stellarObjects.length = 0;
        this.lights.length = 0;
        this.ambientLight.dispose();
    }
}
