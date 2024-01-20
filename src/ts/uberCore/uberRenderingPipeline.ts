//  This file is part of CosmosJourneyer
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

import { Camera } from "@babylonjs/core/Cameras/camera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { PostProcessRenderPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipeline";

export class UberRenderingPipeline extends PostProcessRenderPipeline {
    constructor(name: string, engine: Engine) {
        super(engine, name);
    }

    attachToCamera(camera: Camera) {
        this._attachCameras([camera], false);
    }

    detachCamera(camera: Camera) {
        this._detachCameras([camera]);
    }

    detachCameras() {
        this._detachCameras(this.cameras);
    }

    public override dispose() {
        this.detachCameras();
        super.dispose();
    }
}
