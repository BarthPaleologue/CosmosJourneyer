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

import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export class EyeTracking {
    /**
     * The position of the left eye in screen space in meters
     */
    private static leftEyePosition = Vector3.Zero();

    /**
     * The position of the right eye in screen space in meters
     */
    private static rightEyePosition = Vector3.Zero();

    readonly socket: WebSocket;

    constructor(host: string, port: number) {
        // Create WebSocket connection.
        this.socket = new WebSocket(`ws://${host}:${port}`);

        // Listen for messages
        this.socket.addEventListener("message", async (e) => {
            const blob = e.data as Blob;

            const buffer = await blob.arrayBuffer();
            const bufferView = new Float64Array(buffer);

            EyeTracking.leftEyePosition.copyFromFloats(bufferView[0], bufferView[1], bufferView[2]).scaleInPlace(0.001);
            EyeTracking.rightEyePosition.copyFromFloats(bufferView[3], bufferView[4], bufferView[5]).scaleInPlace(0.001);
        });
    }

    public static GetLeftEyePosition(): Vector3 {
        return this.leftEyePosition;
    }

    public static GetRightEyePosition(): Vector3 {
        return this.rightEyePosition;
    }
}