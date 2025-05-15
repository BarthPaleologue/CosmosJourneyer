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

import { StarSystemDatabase } from "../backend/universe/starSystemDatabase";
import { jsonSafeParse } from "../utils/json";
import { err, Result } from "../utils/types";
import { safeParseSave, Save } from "./saveFileData";
import { SaveLoadingError, SaveLoadingErrorType } from "./saveLoadingError";

export async function parseSaveFile(
    rawSaveFile: File,
    starSystemDatabase: StarSystemDatabase,
): Promise<Result<Save, SaveLoadingError>> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target === null) throw new Error("event.target is null");
            const data = event.target.result;
            if (data === null) throw new Error("data is null");
            if (data instanceof ArrayBuffer) throw new Error("data is an ArrayBuffer");

            const parsedData = jsonSafeParse(data);
            if (parsedData === null) {
                resolve(err({ type: SaveLoadingErrorType.INVALID_JSON }));
                return;
            }

            resolve(safeParseSave(parsedData, starSystemDatabase));
        };
        reader.readAsText(rawSaveFile);
    });
}
