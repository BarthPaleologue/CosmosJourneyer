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
    AbstractMesh,
    Color3,
    DirectionalLight,
    HemisphericLight,
    MeshBuilder,
    NodeMaterial,
    PBRMetallicRoughnessMaterial,
    PhysicsAggregate,
    PhysicsShapeType,
    ShadowGenerator,
    Texture,
} from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadCharacters } from "@/frontend/assets/objects/characters";
import { loadTerrainTextures } from "@/frontend/assets/textures/terrains";
import { CharacterControls } from "@/frontend/controls/characterControls/characterControls";
import { CharacterInputs } from "@/frontend/controls/characterControls/characterControlsInputs";

import {
    add,
    applyLights,
    float,
    getViewDirection,
    outputFragColor,
    outputVertexPosition,
    perturbNormalWithParallax,
    textureSample,
    transformDirection,
    transformPosition,
    uniformCameraPosition,
    uniformViewProjection,
    uniformWorld,
    vertexAttribute,
} from "@/utils/bsl";

import { enablePhysics } from "./utils";

import albedoHeightPath from "@assets/iceMaterial/ice_field_albedo_height.png";
import heightPath from "@assets/iceMaterial/ice_field_height.webp";
import normalPath from "@assets/iceMaterial/ice_field_normal-dx.webp";

export async function createCharacterDemoScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await enablePhysics(scene, new Vector3(0, -9.81, 0));

    engine.getRenderingCanvas()?.addEventListener("click", async () => {
        await engine.getRenderingCanvas()?.requestPointerLock();
    });

    const characters = await loadCharacters(scene, progressMonitor);

    const light = new DirectionalLight("dir01", new Vector3(1, -2, -1), scene);
    light.position = new Vector3(5, 5, 5).scaleInPlace(10);

    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.5;

    const shadowGenerator = new ShadowGenerator(1024, light);
    shadowGenerator.useBlurExponentialShadowMap = true;

    const characterObject = characters.default.instantiateHierarchy(null);
    if (!(characterObject instanceof AbstractMesh)) {
        throw new Error("Character object is null");
    }

    const groundRadius = 40;

    const character = new CharacterControls(characterObject, scene);
    character.getTransform().position.y = groundRadius;

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("thirdPerson") !== null) {
        character.setThirdPersonCameraActive();
    }

    character.getActiveCamera().attachControl();

    CharacterInputs.setEnabled(true);

    shadowGenerator.addShadowCaster(character.character);

    const ground = MeshBuilder.CreateBox("ground", { width: 60, height: 1, depth: 60 }, scene); //MeshBuilder.CreateIcoSphere("ground", { radius: groundRadius }, scene);

    new PhysicsAggregate(ground, PhysicsShapeType.MESH, { mass: 0 }, scene);

    /*const groundMaterial = new PBRMetallicRoughnessMaterial("groundMaterial", scene);
    groundMaterial.baseColor = new Color3(0.5, 0.5, 0.5);
    ground.material = groundMaterial;
    ground.receiveShadows = true;*/

    //const textures = await loadTerrainTextures(scene, progressMonitor);

    //const brickWallDiffURL = "https://i.imgur.com/Rkh1uFK.png";
    //const brickWallNHURL = "https://i.imgur.com/GtIUsWW.png";

    const brickAlbedo = new Texture(albedoHeightPath, scene);
    const brickNormal = new Texture(normalPath, scene);
    const brickHeight = new Texture(heightPath, scene);

    const groundMaterial = new NodeMaterial("groundMaterial", scene);

    const position = vertexAttribute("position");
    const normal = vertexAttribute("normal");

    const uv = vertexAttribute("uv");

    const world = uniformWorld();
    const positionW = transformPosition(world, position);
    const normalW = transformDirection(world, normal);

    const viewProjection = uniformViewProjection();
    const positionClipSpace = transformPosition(viewProjection, positionW);

    const vertexOutput = outputVertexPosition(positionClipSpace);

    const normalMetallicTexture = textureSample(brickNormal, uv);

    const normalMapValue = normalMetallicTexture.rgb;

    const cameraPosition = uniformCameraPosition();
    const viewDirection = getViewDirection(positionW, cameraPosition);

    const heightValue = textureSample(brickHeight, uv).r;

    const { output: perturbedNormal, uvOffset } = perturbNormalWithParallax(
        uv,
        positionW,
        normalW,
        normalMapValue,
        heightValue,
        viewDirection,
        float(0.02),
    );

    const albedoRoughnessTexture = textureSample(brickAlbedo, add(uv, uvOffset), {
        convertToLinearSpace: true,
    });
    const albedoValue = albedoRoughnessTexture.rgb;

    const diffuseColor = applyLights(positionW, perturbedNormal, cameraPosition, albedoValue).diffuseOutput;

    const fragOutput = outputFragColor(diffuseColor);

    groundMaterial.addOutputNode(vertexOutput);
    groundMaterial.addOutputNode(fragOutput);

    groundMaterial.build();

    ground.material = groundMaterial;

    character.setClosestWalkableObject({
        getTransform: () => ground,
    });

    scene.onBeforeRenderObservable.add(() => {
        if (character.getActiveCamera() !== scene.activeCamera) {
            scene.activeCamera?.detachControl();

            const camera = character.getActiveCamera();
            camera.attachControl();
            scene.activeCamera = camera;
        }

        const deltaSeconds = engine.getDeltaTime() / 1000;
        character.update(deltaSeconds);
    });

    return scene;
}
