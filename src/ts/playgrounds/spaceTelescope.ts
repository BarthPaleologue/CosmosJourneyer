//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import {
    Color3,
    DirectionalLight,
    Matrix,
    Mesh,
    MeshBuilder,
    PBRMetallicRoughnessMaterial,
    Space,
    TransformNode,
    Vector3,
} from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";

import type { PrimaryMirrorModel } from "@/backend/universe/orbitalObjects/orbitalFacilities/spaceTelescope/primaryMirror";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { createInsulationSheetMaterial } from "@/frontend/assets/materials/insulationSheet";
import { PrimaryMirror } from "@/frontend/assets/procedural/spaceTelescope/primaryMirror";
import { loadEnvironmentTextures } from "@/frontend/assets/textures/environment";
import { loadFoilMaterialTextures } from "@/frontend/assets/textures/materials/foil";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { lookAt } from "@/frontend/uberCore/transforms/basicTransform";

import { enablePhysics } from "./utils";

export async function createSpaceTelescopeScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await enablePhysics(scene);

    const envTextures = await loadEnvironmentTextures(scene, progressMonitor);
    envTextures.milkyWay.setReflectionTextureMatrix(Matrix.RotationX(Math.PI));
    scene.createDefaultSkybox(envTextures.milkyWay, true, 1e3, 0.0);

    const foilTextures = await loadFoilMaterialTextures(scene, progressMonitor);

    // This creates and positions a free camera (non-mesh)
    const defaultControls = new DefaultControls(scene);
    defaultControls.getActiveCamera().minZ = 0.1;
    defaultControls.speed *= 5;
    defaultControls.getActiveCamera().attachControl();

    defaultControls.getTransform().position = new Vector3(0, 5, -15);
    lookAt(defaultControls.getTransform(), Vector3.Zero(), scene.useRightHandedSystem);

    new DirectionalLight("light1", new Vector3(0, -1, 0), scene);

    const focalLength = 10;

    // Parameters
    const primaryMirrorRadius = 10;

    const telescope = new TransformNode("telescope", scene);

    const mainRig = new TransformNode("mainRig", scene);
    mainRig.parent = telescope;

    const receptorRadius = 0.5;
    const receptor = MeshBuilder.CreateCylinder(
        "receptor",
        { diameter: receptorRadius * 2, diameterTop: receptorRadius * 1.0, height: 1, tessellation: 32 },
        scene,
    );
    receptor.parent = mainRig;

    const receptorMaterial = new PBRMetallicRoughnessMaterial("receptorMaterial", scene);
    receptorMaterial.metallic = 0.0;
    receptorMaterial.roughness = 1.0;
    receptorMaterial.baseColor = new Color3(0.0, 0.0, 0.0);
    receptor.material = receptorMaterial;

    const primaryMirrorModel = {
        apertureRadius: primaryMirrorRadius,
        shape: {
            type: "conic",
            focalLength: focalLength,
            conicConstant: -1,
        },
        segmentation: {
            type: "hexagonTiling",
            tileRadius: 0.6,
            gap: 0.05,
        },
    } satisfies PrimaryMirrorModel;

    const primaryMirror = new PrimaryMirror(primaryMirrorModel, receptorRadius * 1.2, scene);
    primaryMirror.getTransform().parent = mainRig;

    const mirrorMaterial = new PBRMetallicRoughnessMaterial("mirrorMaterial", scene);
    mirrorMaterial.metallic = 1.0;
    mirrorMaterial.roughness = 0.02;
    mirrorMaterial.baseColor = new Color3(1, 0.7766, 0.3362); // gold-like

    const secondaryMirrorRadius = 0.5;

    const secondaryMirror = MeshBuilder.CreateCylinder(
        "secondaryMirror",
        { diameter: secondaryMirrorRadius * 2, height: 0.01, tessellation: 32 },
        scene,
    );
    secondaryMirror.position.set(0, focalLength, 0);
    secondaryMirror.material = mirrorMaterial;
    secondaryMirror.parent = mainRig;

    const attachmentMaterial = new PBRMetallicRoughnessMaterial("attachmentMaterial", scene);
    attachmentMaterial.metallic = 0.0;
    attachmentMaterial.roughness = 1.0;
    attachmentMaterial.baseColor = new Color3(0.0, 0.0, 0.0);

    const secondaryMirrorShield = MeshBuilder.CreateCylinder(
        "secondaryMirrorShield",
        { diameter: secondaryMirrorRadius * 2.7, height: 0.2, tessellation: 32 },
        scene,
    );
    secondaryMirrorShield.position.set(0, focalLength + 0.1, 0);
    secondaryMirrorShield.material = attachmentMaterial;
    secondaryMirrorShield.parent = mainRig;

    const primaryMirrorBounds = primaryMirror.getTransform().getHierarchyBoundingVectors();
    const primaryMirrorExtentY = (primaryMirrorBounds.max.y - primaryMirrorBounds.min.y) / 2;

    const attachmentWidth = primaryMirrorRadius * 1.2;
    const attachmentOrigin = new Vector3(0, -1, 0);
    const attachmentRadius = 0.1;
    const attachment = MeshBuilder.CreateTube(
        "attachment",
        {
            path: [
                attachmentOrigin,
                new Vector3(-attachmentWidth, primaryMirrorExtentY, 0),
                secondaryMirror.position
                    .clone()
                    .addInPlaceFromFloats(-secondaryMirrorRadius - attachmentRadius, 0.1, 0),
            ],
            radius: attachmentRadius,
            tessellation: 32,
        },
        scene,
    );
    attachment.convertToFlatShadedMesh();
    attachment.material = attachmentMaterial;

    const nbAttachments = 3;

    for (let i = 1; i < nbAttachments; i++) {
        const angle = (i * 2 * Math.PI) / nbAttachments;
        const attachmentClone = attachment.clone(`attachment${i}`);
        attachmentClone.rotateAround(Vector3.Zero(), Vector3.Up(), angle);
    }

    const centralUnit = MeshBuilder.CreateCylinder(
        "centralUnit",
        { diameter: attachmentWidth * 0.6, height: 1.0, tessellation: 32 },
        scene,
    );
    centralUnit.position = attachmentOrigin;
    centralUnit.material = attachmentMaterial;

    centralUnit.parent = mainRig;

    const insulationRig = new TransformNode("insulationRig", scene);
    insulationRig.parent = telescope;
    insulationRig.position = new Vector3(0, -focalLength * 3, 0);

    const insulationMaterial = createInsulationSheetMaterial("insulationMaterial", foilTextures, scene);

    const sheetSize = primaryMirrorRadius * 15;

    const insulationSheet = MeshBuilder.CreatePlane(
        "insulationSheet",
        { width: sheetSize, height: sheetSize, sideOrientation: Mesh.DOUBLESIDE },
        scene,
    );
    insulationSheet.rotate(Vector3.Right(), Math.PI / 2);
    insulationSheet.material = insulationMaterial;
    insulationSheet.parent = insulationRig;

    const diagonalRod1 = MeshBuilder.CreateCylinder(
        "insulationRodStructure",
        { diameter: 0.1, height: sheetSize * Math.SQRT2 + 0.1, tessellation: 6 },
        scene,
    );
    diagonalRod1.position = insulationSheet.position.clone();
    diagonalRod1.rotate(Vector3.Forward(), Math.PI / 2);
    diagonalRod1.rotate(Vector3.Up(), Math.PI / 4, Space.WORLD);
    diagonalRod1.material = attachmentMaterial;
    diagonalRod1.parent = insulationRig;

    const diagonalRod2 = diagonalRod1.clone("diagonalRod2");
    diagonalRod2.rotate(Vector3.Up(), -Math.PI / 2, Space.WORLD);
    diagonalRod2.parent = insulationRig;

    const nbSheets = 7;
    const sheetSpacing = 5.0;
    for (let i = 1; i < nbSheets; i++) {
        const sheetClone = insulationSheet.clone(`insulationSheet${i}`);
        sheetClone.position.y = insulationSheet.position.y - i * sheetSpacing;
        sheetClone.parent = insulationRig;

        const diagonalRod1Clone = diagonalRod1.clone(`diagonalRod1_${i}`);
        diagonalRod1Clone.position.y = sheetClone.position.y;
        diagonalRod1Clone.parent = insulationRig;

        const diagonalRod2Clone = diagonalRod2.clone(`diagonalRod2_${i}`);
        diagonalRod2Clone.position.y = sheetClone.position.y;
        diagonalRod2Clone.parent = insulationRig;
    }

    if (nbSheets > 1) {
        const insulationOrthogonalRodStructure = MeshBuilder.CreateCylinder(
            "insulationRodStructure",
            { diameter: 0.1, height: nbSheets * sheetSpacing + 0.1, tessellation: 6 },
            scene,
        );
        insulationOrthogonalRodStructure.position = new Vector3(
            attachmentOrigin.x,
            insulationSheet.position.y - ((nbSheets - 1) * sheetSpacing) / 2,
            attachmentOrigin.z,
        );
        insulationOrthogonalRodStructure.material = attachmentMaterial;
        insulationOrthogonalRodStructure.parent = insulationRig;

        const insulationRod1 = insulationOrthogonalRodStructure.clone("insulationRod1");
        insulationRod1.position.x += sheetSize * 0.5 - 0.1;
        insulationRod1.position.z += sheetSize * 0.5 - 0.1;
        insulationRod1.parent = insulationRig;

        const insulationRod2 = insulationOrthogonalRodStructure.clone("insulationRod2");
        insulationRod2.position.x -= sheetSize * 0.5 - 0.1;
        insulationRod2.position.z += sheetSize * 0.5 - 0.1;
        insulationRod2.parent = insulationRig;

        const insulationRod3 = insulationOrthogonalRodStructure.clone("insulationRod3");
        insulationRod3.position.x += sheetSize * 0.5 - 0.1;
        insulationRod3.position.z -= sheetSize * 0.5 - 0.1;
        insulationRod3.parent = insulationRig;

        const insulationRod4 = insulationOrthogonalRodStructure.clone("insulationRod4");
        insulationRod4.position.x -= sheetSize * 0.5 - 0.1;
        insulationRod4.position.z -= sheetSize * 0.5 - 0.1;
        insulationRod4.parent = insulationRig;

        insulationOrthogonalRodStructure.dispose();
    }

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
        defaultControls.update(deltaSeconds);
    });

    return scene;
}
