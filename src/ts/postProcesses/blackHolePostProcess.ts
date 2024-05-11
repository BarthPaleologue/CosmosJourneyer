//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import blackHoleFragment from "../../shaders/blackhole.glsl";
import { ObjectPostProcess } from "./objectPostProcess";
import { Assets } from "../assets";
import { Effect } from "@babylonjs/core/Materials/effect";
import { getForwardDirection } from "../uberCore/transforms/basicTransform";
import { Matrix, Quaternion } from "@babylonjs/core/Maths/math";
import { BlackHole } from "../stellarObjects/blackHole/blackHole";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { ObjectUniformNames, setObjectUniforms } from "./uniforms/objectUniforms";
import { CameraUniformNames, setCameraUniforms } from "./uniforms/cameraUniforms";
import { SamplerUniformNames, setSamplerUniforms } from "./uniforms/samplerUniforms";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Constants } from "@babylonjs/core/Engines/constants";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { Scene } from "@babylonjs/core/scene";

export type BlackHoleUniforms = {
    accretionDiskRadius: number;
    rotationPeriod: number;
    warpingMinkowskiFactor: number;
    time: number;
};

export class BlackHolePostProcess extends PostProcess implements ObjectPostProcess {
    readonly blackHoleUniforms: BlackHoleUniforms;
    readonly object: BlackHole;

    private activeCamera: Camera | null = null;

    constructor(blackHole: BlackHole, scene: Scene, starfieldRotation: Quaternion) {
        const shaderName = "blackhole";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = blackHoleFragment;
        }

        const blackHoleUniforms: BlackHoleUniforms = {
            accretionDiskRadius: blackHole.model.physicalProperties.accretionDiskRadius,
            rotationPeriod: 1.5,
            warpingMinkowskiFactor: 2.0,
            time: 0
        };

        const BlackHoleUniformNames = {
            STARFIELD_ROTATION: "starfieldRotation",
            TIME: "time",
            SCHWARZSCHILD_RADIUS: "schwarzschildRadius",
            FRAME_DRAGGING_FACTOR: "frameDraggingFactor",
            ACCRETION_DISK_RADIUS: "accretionDiskRadius",
            WARPING_MINKOWSKI_FACTOR: "warpingMinkowskiFactor",
            ROTATION_PERIOD: "rotationPeriod",
            ROTATION_AXIS: "rotationAxis",
            FORWARD_AXIS: "forwardAxis"
        };

        const uniforms: string[] = [...Object.values(ObjectUniformNames), ...Object.values(CameraUniformNames), ...Object.values(BlackHoleUniformNames)];

        const BlackHoleSamplerNames = {
            STARFIELD_TEXTURE: "starfieldTexture"
        };

        const samplers: string[] = [...Object.values(SamplerUniformNames), ...Object.values(BlackHoleSamplerNames)];

        super(blackHole.name, shaderName, uniforms, samplers, 1, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, null, Constants.TEXTURETYPE_HALF_FLOAT);

        this.object = blackHole;
        this.blackHoleUniforms = blackHoleUniforms;

        this.onActivateObservable.add((camera) => {
            this.activeCamera = camera;
        });

        this.onApplyObservable.add((effect) => {
            if (this.activeCamera === null) {
                throw new Error("Camera is null");
            }

            setCameraUniforms(effect, this.activeCamera);
            setObjectUniforms(effect, blackHole);

            const rotationMatrix = new Matrix();
            starfieldRotation.toRotationMatrix(rotationMatrix);
            effect.setMatrix(BlackHoleUniformNames.STARFIELD_ROTATION, rotationMatrix);

            effect.setFloat(BlackHoleUniformNames.TIME, blackHoleUniforms.time % (blackHoleUniforms.rotationPeriod * 10000));
            effect.setFloat(BlackHoleUniformNames.SCHWARZSCHILD_RADIUS, blackHole.model.getSchwarzschildRadius());
            effect.setFloat(BlackHoleUniformNames.FRAME_DRAGGING_FACTOR, blackHole.model.getKerrMetricA() / blackHole.model.physicalProperties.mass);
            effect.setFloat(BlackHoleUniformNames.ACCRETION_DISK_RADIUS, blackHoleUniforms.accretionDiskRadius);
            effect.setFloat(BlackHoleUniformNames.WARPING_MINKOWSKI_FACTOR, blackHoleUniforms.warpingMinkowskiFactor);
            effect.setFloat(BlackHoleUniformNames.ROTATION_PERIOD, blackHoleUniforms.rotationPeriod);
            effect.setVector3(BlackHoleUniformNames.ROTATION_AXIS, blackHole.getRotationAxis());
            effect.setVector3(BlackHoleUniformNames.FORWARD_AXIS, getForwardDirection(blackHole.getTransform()));

            setSamplerUniforms(effect, this.activeCamera, scene);
            effect.setTexture(BlackHoleSamplerNames.STARFIELD_TEXTURE, Assets.STAR_FIELD);
        });
    }

    public update(deltaSeconds: number): void {
        this.blackHoleUniforms.time += deltaSeconds;
    }
}
