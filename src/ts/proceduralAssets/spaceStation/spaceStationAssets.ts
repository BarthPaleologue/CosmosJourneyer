import { Scene } from "@babylonjs/core/scene";
import { AssetsManager, MeshAssetTask } from "@babylonjs/core/Misc/assetsManager";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

import ringHabitat from "../../../asset/SpaceStationParts/ringHabitat.glb";
import squareSection from "../../../asset/SpaceStationParts/squareSection.glb";
import solarPanel from "../../../asset/SpaceStationParts/solarPanel.glb";

export class SpaceStationAssets {
    public static RING_HABITAT: Mesh;
    public static SQUARE_SECTION: Mesh;
    public static SOLAR_PANEL: Mesh;

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

            SpaceStationAssets.SQUARE_SECTION.scalingDeterminant = 60 / maxDimension;
            SpaceStationAssets.SQUARE_SECTION.bakeCurrentTransformIntoVertices();

            console.log("SquareSection loaded");
        };

        const solarPanelTask = assetsManager.addMeshTask("SolarPanelTask", "", "", solarPanel);
        solarPanelTask.onSuccess = (task: MeshAssetTask) => {
            SpaceStationAssets.SOLAR_PANEL = (task.loadedMeshes[0]).getChildMeshes()[0] as Mesh;
            SpaceStationAssets.SOLAR_PANEL.parent = null;
            SpaceStationAssets.SOLAR_PANEL.isVisible = false;

            const boundingBox = SpaceStationAssets.SOLAR_PANEL.getBoundingInfo().boundingBox;
            const maxDimension = Math.max(boundingBox.extendSize.x, boundingBox.extendSize.y, boundingBox.extendSize.z);

            SpaceStationAssets.SOLAR_PANEL.scalingDeterminant = 20 / maxDimension;
            SpaceStationAssets.SOLAR_PANEL.bakeCurrentTransformIntoVertices();

            console.log("SquareSection loaded");
        };
    }
}