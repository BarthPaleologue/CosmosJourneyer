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

import { Constants } from "@babylonjs/core/Engines/constants";
import { Material } from "@babylonjs/core/Materials/material";
import type { InputBlock } from "@babylonjs/core/Materials/Node/Blocks/Input/inputBlock";
import { NodeMaterial } from "@babylonjs/core/Materials/Node/nodeMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Scene } from "@babylonjs/core/scene";
import type { WattsPerSquareMeter } from "@cosmos-journeyer/physics";
import {
    add,
    builtinAttribute,
    div,
    getInstanceData,
    hash11,
    mix,
    mul,
    oneMinus,
    outputFragColor,
    outputVertexPosition,
    pow,
    remap,
    smoothstep,
    splitVec,
    transformPosition,
    uniformElapsedSeconds,
    uniformF32,
    uniformViewProjection,
    uniformWorld,
    vec3,
} from "babylonjs-shading-language";

import { addN, fbm, noise1d } from "@/utils/bslExtensions";

/**
 * Mean visible auroral energy flux of a nominal terrestrial aurora in W/m²,
 * as produced by getAuroralVisibleEnergyFlux (~1e-6 W/m²). Used as the
 * reference point of the shader's intensity mapping.
 */
const REFERENCE_VISIBLE_FLUX = 1e-6;

/**
 * Stateful aurora ribbon material. The visible energy flux drives the
 * brightness and opacity of the ribbons through a square-root mapping
 * compressed against a terrestrial reference flux.
 */
export class AuroraMaterial {
    private readonly material: NodeMaterial;
    private readonly uEnergyFlux: InputBlock;
    private readonly uSeed: InputBlock;

    constructor(scene: Scene, seed: number) {
        this.material = new NodeMaterial("AuroraMaterial", scene);
        this.uEnergyFlux = uniformF32("uEnergyFlux", { defaultValue: 0 });
        this.uSeed = uniformF32("uSeed", { defaultValue: seed });

        const position = builtinAttribute("position");

        const globalWorld = uniformWorld();

        const world0 = builtinAttribute("world0");
        const world1 = builtinAttribute("world1");
        const world2 = builtinAttribute("world2");
        const world3 = builtinAttribute("world3");
        const { instanceID, output: instanceWorld } = getInstanceData(world0, world1, world2, world3, globalWorld);

        const { x, y } = splitVec(position);

        const elapsedSeconds = uniformElapsedSeconds();

        // Fold the seed into the per-ribbon hashes so that size, altitude and
        // animation phase vary with the seed, not only with the instance id.
        const seedOffset = mul(hash11(this.uSeed.output), 1024);
        const ribbonRandom = hash11(add(instanceID, seedOffset));

        const ribbonAltitudeRandom1 = hash11(add(instanceID, seedOffset));
        const ribbonAltitudeRandom2 = hash11(addN([instanceID, seedOffset, 53]));
        const ribbonAltitude = add(80e3, mul(add(ribbonAltitudeRandom1, ribbonAltitudeRandom2), 20e3));

        const heightRandom = hash11(addN([instanceID, seedOffset, 97]));
        const ribbonHeight = add(30e3, mul(pow(heightRandom, 12), 370e3));

        const lengthRandom = hash11(addN([instanceID, seedOffset, 17]));
        const ribbonLength = remap(lengthRandom, [0, 1], [250e3, 750e3]);
        const animatedX = mul(x, ribbonLength);

        const height = add(mul(y, ribbonHeight), ribbonAltitude);

        const omega = add(0.5, remap(ribbonRandom, [0, 1], [-0.2, 0.2]));
        let animatedZ = fbm(noise1d, add(mul(5, x), mul(omega, elapsedSeconds)), 2);
        animatedZ = remap(animatedZ, [0, 1], [-1, 1]);
        animatedZ = mul(animatedZ, 40e3);

        const animatedPosition = vec3({ x: animatedX, y: height, z: animatedZ });

        const viewProjection = uniformViewProjection();

        const positionWorld = transformPosition(instanceWorld, animatedPosition);
        const positionClip = transformPosition(viewProjection, positionWorld);

        const purpleMask = mul(smoothstep(82e3, 88e3, height), oneMinus(smoothstep(96e3, 104e3, height)));
        const blueMask = mul(smoothstep(96e3, 105e3, height), oneMinus(smoothstep(112e3, 125e3, height)));
        const greenMask = mul(smoothstep(96e3, 108e3, height), oneMinus(smoothstep(140e3, 200e3, height)));
        const redMask = mul(smoothstep(160e3, 200e3, height), oneMinus(smoothstep(320e3, 420e3, height)));

        const fragmentColor = addN([
            mul(purpleMask, mul(Color3.FromHexString("#6c5291").toLinearSpace(true), 0.3)),
            mul(greenMask, mul(Color3.FromHexString("#6ADC99").toLinearSpace(true), 0.5)),
            mul(redMask, mul(Color3.FromHexString("#B93A32").toLinearSpace(true), 0.4)),
            mul(blueMask, mul(Color3.FromHexString("#1486dc").toLinearSpace(true), 0.1)),
        ]);

        const striationWeight = remap(oneMinus(smoothstep(120e3, 180e3, height)), [0, 1], [0.5, 1]);

        let fragmentAlpha = mix(1.0, mix(0.2, 1.0, fbm(noise1d, mul(x, 50), 4)), striationWeight);

        // fade bottom
        fragmentAlpha = mul(fragmentAlpha, smoothstep(0.0, 0.3, y));

        // fade top
        fragmentAlpha = mul(fragmentAlpha, oneMinus(smoothstep(0.6, 1.0, y)));

        fragmentAlpha = mul(fragmentAlpha, smoothstep(-0.5, -0.4, x));

        fragmentAlpha = mul(fragmentAlpha, oneMinus(smoothstep(0.4, 0.5, x)));

        // Map the visible energy flux (W/m²) to a brightness multiplier
        const normalizedFlux = div(this.uEnergyFlux.output, REFERENCE_VISIBLE_FLUX);
        const intensity = mul(0.4, normalizedFlux);

        const scaledColor = mul(fragmentColor, intensity);
        const scaledAlpha = mul(fragmentAlpha, intensity);

        this.material.addOutputNode(outputVertexPosition(positionClip));
        this.material.addOutputNode(outputFragColor(scaledColor, { alpha: scaledAlpha }));

        this.material.build();

        this.material.fillMode = Material.TriangleStripDrawMode;
        this.material.backFaceCulling = false;
        this.material.alphaMode = Constants.ALPHA_ADD;
    }

    /**
     * @param flux Mean visible auroral radiant energy flux in W/m². Zero disables the glow.
     */
    public setEnergyFlux(flux: WattsPerSquareMeter): void {
        this.uEnergyFlux.value = flux;
    }

    /** @returns The underlying Babylon material to assign to a mesh. */
    public get(): Material {
        return this.material;
    }

    public dispose(): void {
        this.material.dispose();
    }
}
