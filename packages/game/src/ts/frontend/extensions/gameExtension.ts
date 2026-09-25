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

import type { Scene } from "@babylonjs/core/scene";
import type { DeepReadonly, Result } from "@cosmos-journeyer/typescript";
import type { StarSystemModel } from "@cosmos-journeyer/universe-model";

import type { AssetsExtensionPoints } from "./assetsExtensionPoints";

export interface GameExtension {
    readonly id: string;

    /**
     *
     * @param extensionPoints
     * @throws if anything goes wrong, the extension should throw
     */
    register(extensionPoints: ExtensionPoints): void;
}

export type ExtensionPoints = {
    assets: AssetsExtensionPoints;
    systemContent: SystemContentExtensionPoints;
};

export interface SystemContentExtensionPoints {
    registerModelFactory<TModel extends SystemContentModel>(factory: SystemContentModelFactory<TModel>): void;

    registerObjectFactory<TModel extends SystemContentModel>(factory: SystemContentFactory<TModel>): void;
}

export type SystemContentModel = {
    readonly type: string;
    readonly id: string;
};

export type SystemContentModelContext = {
    system: DeepReadonly<StarSystemModel>;
};

export interface SystemContentModelFactory<TModel extends SystemContentModel> {
    getModels(context: SystemContentModelContext): Result<Array<TModel>, Error>;
}

export type SystemContent = {};

export type SystemContentContext = {
    scene: Scene;
};

export interface SystemContentFactory<TModel extends SystemContentModel> {
    readonly type: TModel["type"];
    create(model: TModel, context: SystemContentContext): Result<SystemContent, Error>;
}
