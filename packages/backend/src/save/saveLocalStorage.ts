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

import { type IFile } from "./saveBackendSingleFile";

export class SaveLocalStorage implements IFile {
    public static readonly SAVES_KEY = "saves";
    public static readonly BACKUP_SAVE_KEY = "backupSaves";

    private readonly key: string;

    constructor(key: string) {
        this.key = key;
    }

    public write(content: string): Promise<boolean> {
        localStorage.setItem(this.key, content);
        return Promise.resolve(true);
    }

    public read(): Promise<string | null> {
        const rawSaves = localStorage.getItem(this.key);
        return Promise.resolve(rawSaves);
    }
}
