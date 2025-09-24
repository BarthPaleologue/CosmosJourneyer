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

export interface ILoadingProgressMonitor {
    startTask(): void;
    completeTask(): void;
    addProgressCallback(callback: (startedTaskCount: number, completedTaskCount: number) => void): void;
}

export class LoadingProgressMonitor implements ILoadingProgressMonitor {
    private startedTaskCount = 0;
    private completedTaskCount = 0;

    private progressCallbacks: Array<(startedTaskCount: number, completedTaskCount: number) => void> = [];

    public addProgressCallback(callback: (startedTaskCount: number, completedTaskCount: number) => void): void {
        this.progressCallbacks.push(callback);
    }

    public startTask(): void {
        this.startedTaskCount++;
        this.notifyProgress();
    }

    public completeTask(): void {
        this.completedTaskCount++;
        this.notifyProgress();
    }

    private notifyProgress(): void {
        for (const callback of this.progressCallbacks) {
            callback(this.startedTaskCount, this.completedTaskCount);
        }
    }
}

export class LoadingProgressMonitorMock implements ILoadingProgressMonitor {
    public startTask(): void {
        // No operation for mock
    }

    public completeTask(): void {
        // No operation for mock
    }

    public addProgressCallback(): void {
        // No operation for mock
    }
}
