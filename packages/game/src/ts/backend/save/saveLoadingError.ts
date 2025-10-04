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

import { type z } from "zod";

import i18n from "@/i18n";

export const enum SaveLoadingErrorType {
    INVALID_JSON = "INVALID_JSON",
    INVALID_SAVE = "INVALID_SAVE",
    INVALID_STORAGE_FORMAT = "INVALID_STORAGE_FORMAT",
}

export type SaveLoadingError =
    | {
          type: SaveLoadingErrorType.INVALID_JSON;
      }
    | {
          type: SaveLoadingErrorType.INVALID_SAVE;
          content: z.ZodError;
      }
    | {
          type: SaveLoadingErrorType.INVALID_STORAGE_FORMAT;
          content: z.ZodError;
      };

export function saveLoadingErrorToI18nString(error: SaveLoadingError): string {
    switch (error.type) {
        case SaveLoadingErrorType.INVALID_JSON:
            return i18n.t("notifications:invalidSaveFileJson");
        case SaveLoadingErrorType.INVALID_SAVE:
            return i18n.t("notifications:invalidSaveFile");
        case SaveLoadingErrorType.INVALID_STORAGE_FORMAT:
            return i18n.t("notifications:invalidStorageFormat");
    }
}
