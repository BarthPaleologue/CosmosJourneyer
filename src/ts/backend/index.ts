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

import type { EncyclopaediaGalacticaManager } from "./encyclopaedia/encyclopaediaGalacticaManager";
import type { ISaveBackend } from "./save/saveBackend";
import type { StarSystemDatabase } from "./universe/starSystemDatabase";

/** Exposes the backend services needed to operate Cosmos Journeyer. */
export interface ICosmosJourneyerBackend {
    /** The backend service responsible for save file management. */
    readonly save: ISaveBackend;

    /** The backend service responsible for exploration data. */
    readonly encyclopaedia: EncyclopaediaGalacticaManager;

    /** The backend service responsible for universe data generation. */
    readonly universe: StarSystemDatabase;
}
