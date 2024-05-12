import { Scene } from "@babylonjs/core/scene";
import { AssetsManager, MeshAssetTask } from "@babylonjs/core/Misc/assetsManager";

import ringHabitat from "../../../asset/SpaceStationParts/ringHabitat.glb";
import squareSection from "../../../asset/SpaceStationParts/squareSection.glb";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

export class SpaceStationAssets {
    public static RING_HABITAT: Mesh;
    public static SQUARE_SECTION: Mesh;

    constructor(scene: Scene, assetsManager: AssetsManager) {
        const ringHabitatTask = assetsManager.addMeshTask("RingHabitatTask", "", "", ringHabitat);
        ringHabitatTask.onSuccess = (task: MeshAssetTask) => {
            SpaceStationAssets.RING_HABITAT = (task.loadedMeshes[0]).getChildMeshes()[0] as Mesh;
            SpaceStationAssets.RING_HABITAT.parent = null;
            SpaceStationAssets.RING_HABITAT.isVisible = false;

            const boundingBox = SpaceStationAssets.RING_HABITAT.getBoundingInfo().boundingBox;
            const maxDimension = Math.max(boundingBox.extendSize.x, boundingBox.extendSize.y, boundingBox.extendSize.z);

            // the ring must have radius 1
            SpaceStationAssets.RING_HABITAT.scalingDeterminant = 2 / maxDimension;
            SpaceStationAssets.RING_HABITAT.bakeCurrentTransformIntoVertices();

            console.log("RingHabitat loaded");
        };

        const squareSectionTask = assetsManager.addMeshTask("SquareSectionTask", "", "", squareSection);
        squareSectionTask.onSuccess = (task: MeshAssetTask) => {
            SpaceStationAssets.SQUARE_SECTION = (task.loadedMeshes[0]).getChildMeshes()[0] as Mesh;
            SpaceStationAssets.SQUARE_SECTION.parent = null;
            SpaceStationAssets.SQUARE_SECTION.isVisible = false;

            const boundingBox = SpaceStationAssets.SQUARE_SECTION.getBoundingInfo().boundingBox;
            const maxDimension = Math.max(boundingBox.extendSize.x, boundingBox.extendSize.y, boundingBox.extendSize.z);

            // the ring must have radius 1
            SpaceStationAssets.SQUARE_SECTION.scalingDeterminant = 60 / maxDimension;
            SpaceStationAssets.SQUARE_SECTION.bakeCurrentTransformIntoVertices();

            console.log("SquareSection loaded");
        };
    }
}