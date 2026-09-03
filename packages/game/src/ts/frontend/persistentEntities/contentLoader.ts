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

import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { CreateSphere, HtmlTexture, MeshBuilder, PBRMetallicRoughnessMaterial } from "@babylonjs/core/pure";
import type { Scene } from "@babylonjs/core/scene";
import { assertUnreachable } from "@cosmos-journeyer/typescript";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";

import type {
    DiaryDiscussionModel,
    PersistentEntityContentModel,
    SimpleAssetContentModel,
    UplinkModel,
} from "@/backend/persistentEntities/persistentEntityModel";

import { renderMarkdownInline } from "@/utils/markdown";

import type { ILoadingProgressMonitor } from "../assets/loadingProgressMonitor";
import { loadAssetInContainerAsync } from "../assets/objects/utils";
import type { Transformable } from "../universe/architecture/transformable";
import { Uplink } from "./uplink";

export type PersistentEntityContent = Transformable;

export async function initContent(
    content: DeepReadonly<PersistentEntityContentModel>,
    scene: Scene,
    loadingProgressMonitor: ILoadingProgressMonitor,
): Promise<PersistentEntityContent> {
    switch (content.type) {
        case "simpleAsset":
            return await initSimpleAssetContent(content, scene, loadingProgressMonitor);
        case "diaryDiscussion":
            return initDiaryDiscussion(content, scene);
        case "uplink":
            return new Uplink(content, scene);
        default:
            return assertUnreachable(content);
    }
}

async function initSimpleAssetContent(
    content: SimpleAssetContentModel,
    scene: Scene,
    loadingProgressMonitor: ILoadingProgressMonitor,
): Promise<PersistentEntityContent> {
    const container = await loadAssetInContainerAsync(content.url, content.url, scene, loadingProgressMonitor);
    const root = container.rootNodes[0] as TransformNode;
    container.addAllToScene();

    return {
        getTransform: () => root,
    };
}

export function initDiaryDiscussion(
    content: DeepReadonly<DiaryDiscussionModel>,
    scene: Scene,
): PersistentEntityContent {
    const aspectRatio = 29.7 / 21;
    const width = 10;
    const root = MeshBuilder.CreateBox(content.entry.author, { width, height: width * aspectRatio, depth: 0.1 }, scene);

    const material = new PBRMetallicRoughnessMaterial("diaryMaterial", scene);
    root.material = material;

    const resolutionX = 1024;
    const resolutionY = Math.ceil(resolutionX * aspectRatio);

    const page = document.createElement("div");

    Object.assign(page.style, {
        width: `${resolutionX}px`,
        height: `${resolutionY}px`,
        boxSizing: "border-box",
        backgroundColor: "white",
        padding: "80px 200px",
    });

    const text = document.createElement("p");

    text.innerHTML = renderMarkdownInline(content.entry.content);

    Object.assign(text.style, {
        margin: "0",
        fontSize: "24px",
        lineHeight: "1.4",
        color: "black",
    });

    page.appendChild(text);

    const texture = new HtmlTexture("diaryTexture", page, {
        scene,
        width: resolutionX,
        height: resolutionY,
        generateMipMaps: true,
        autoUpdate: false,
    });

    material.baseTexture = texture;

    return {
        getTransform: () => root,
    };
}

export function initUplink(content: UplinkModel, scene: Scene): PersistentEntityContent {
    const bigAssMetalSphere = CreateSphere("uplink", { diameter: 2e3 }, scene);

    const material = new PBRMetallicRoughnessMaterial("metalMaterial", scene);
    material.roughness = 0.6;
    material.metallic = 1;

    bigAssMetalSphere.material = material;

    return {
        getTransform: () => bigAssMetalSphere,
    };
}
