import { Scene } from "@babylonjs/core/scene";
import { AssetsManager, MeshAssetTask } from "@babylonjs/core/Misc/assetsManager";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

import solarPanel from "../../../asset/SpaceStationParts/solarPanel.glb";
import sphericalTank from "../../../asset/SpaceStationParts/sphericalTank.glb";

export class SpaceStationAssets {

    public static SOLAR_PANEL: Mesh;
    public static SPHERICAL_TANK: Mesh;

    constructor(scene: Scene, assetsManager: AssetsManager) {
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

        const sphericalTankTask = assetsManager.addMeshTask("SphericalTankTask", "", "", sphericalTank);
        sphericalTankTask.onSuccess = (task: MeshAssetTask) => {
            SpaceStationAssets.SPHERICAL_TANK = (task.loadedMeshes[0]).getChildMeshes()[0] as Mesh;
            SpaceStationAssets.SPHERICAL_TANK.parent = null;
            SpaceStationAssets.SPHERICAL_TANK.isVisible = false;

            const boundingBox = SpaceStationAssets.SPHERICAL_TANK.getBoundingInfo().boundingBox;
            const maxDimension = Math.max(boundingBox.extendSize.x, boundingBox.extendSize.y, boundingBox.extendSize.z);

            SpaceStationAssets.SPHERICAL_TANK.scalingDeterminant = 20 / maxDimension;
            SpaceStationAssets.SPHERICAL_TANK.bakeCurrentTransformIntoVertices();

            console.log("SphericalTank loaded");
        };
    }
}