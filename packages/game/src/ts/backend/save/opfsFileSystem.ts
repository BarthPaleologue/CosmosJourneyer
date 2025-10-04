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

import { err, ok, type Result } from "@/utils/types";

import type { IFileSystem } from "./saveBackendMultiFile";

declare global {
    interface FileSystemDirectoryHandle {
        entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
    }
}

/**
 * Implementation of IFileSystem using the Origin Private File System (OPFS) API.
 * This provides persistent file storage that survives browser restarts and is private to the origin.
 */
export class OPFSFileSystem implements IFileSystem {
    private readonly rootHandle: FileSystemDirectoryHandle;

    /**
     * Creates a new OPFSFileSystem instance.
     * @param rootHandle - The root directory handle for OPFS
     * @private
     */
    private constructor(rootHandle: FileSystemDirectoryHandle) {
        this.rootHandle = rootHandle;
    }

    /**
     * Factory method to create an OPFSFileSystem instance.
     * @returns The created OPFSFileSystem instance
     */
    public static async CreateAsync(): Promise<Result<OPFSFileSystem, unknown>> {
        if (!OPFSFileSystem.IsSupported()) {
            return err(new Error("OPFS is not supported in this browser"));
        }

        try {
            const rootHandle = await navigator.storage.getDirectory();
            return ok(new OPFSFileSystem(rootHandle));
        } catch (error) {
            console.error("Failed to create OPFSFileSystem:", error);
            return err(error);
        }
    }

    /**
     * Gets or creates a directory handle for the given path.
     * @param path - The directory path
     * @param create - Whether to create the directory if it doesn't exist
     * @returns The directory handle or null if it doesn't exist and create is false
     */
    private async getDirectoryHandle(path: string, create = false): Promise<FileSystemDirectoryHandle | null> {
        try {
            const parts = path.split("/").filter(Boolean);
            let currentHandle = this.rootHandle;

            for (const part of parts) {
                currentHandle = await currentHandle.getDirectoryHandle(part, { create });
            }

            return currentHandle;
        } catch (error) {
            if (error instanceof DOMException && error.name === "NotFoundError") {
                return null;
            }
            throw error;
        }
    }

    /**
     * Gets a file handle for the given path.
     * @param path - The file path
     * @param create - Whether to create the file if it doesn't exist
     * @returns The file handle or null if it doesn't exist and create is false
     */
    private async getFileHandle(path: string, create = false): Promise<FileSystemFileHandle | null> {
        try {
            const parts = path.split("/").filter(Boolean);
            const fileName = parts.pop();
            if (fileName === undefined) throw new Error("Invalid file path");

            const dirHandle = await this.getDirectoryHandle("/" + parts.join("/"), create);
            if (!dirHandle) return null;

            return await dirHandle.getFileHandle(fileName, { create });
        } catch (error) {
            if (error instanceof DOMException && error.name === "NotFoundError") {
                return null;
            }
            throw error;
        }
    }

    public async createDirectory(path: string): Promise<boolean> {
        try {
            await this.getDirectoryHandle(path, true);
            return true;
        } catch (error) {
            console.error(`Failed to create directory: ${path}`, error);
            return false;
        }
    }

    public async deleteDirectory(path: string): Promise<boolean> {
        try {
            const parts = path.split("/").filter(Boolean);
            const dirName = parts.pop();
            if (dirName === undefined) return false;

            const parentHandle = await this.getDirectoryHandle("/" + parts.join("/"));
            if (!parentHandle) return false;

            await parentHandle.removeEntry(dirName, { recursive: true });
            return true;
        } catch (error) {
            console.error(`Failed to delete directory: ${path}`, error);
            return false;
        }
    }

    public async listDirectory(path: string): Promise<string[] | null> {
        try {
            const dirHandle = await this.getDirectoryHandle(path);
            if (!dirHandle) return null;

            const entries: string[] = [];
            for await (const [name] of dirHandle.entries()) {
                entries.push(name);
            }

            return entries.sort();
        } catch (error) {
            console.error(`Failed to list directory: ${path}`, error);
            return null;
        }
    }

    public async directoryExists(path: string): Promise<boolean> {
        const handle = await this.getDirectoryHandle(path);
        return handle !== null;
    }

    public async writeFile(path: string, content: string): Promise<boolean> {
        try {
            const fileHandle = await this.getFileHandle(path, true);
            if (!fileHandle) return false;

            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();

            return true;
        } catch (error) {
            console.error(`Failed to write file: ${path}`, error);
            return false;
        }
    }

    public async readFile(path: string): Promise<string | null> {
        try {
            const fileHandle = await this.getFileHandle(path);
            if (!fileHandle) return null;

            const file = await fileHandle.getFile();
            return await file.text();
        } catch (error) {
            console.error(`Failed to read file: ${path}`, error);
            return null;
        }
    }

    public async deleteFile(path: string): Promise<boolean> {
        try {
            const parts = path.split("/").filter(Boolean);
            const fileName = parts.pop();
            if (fileName === undefined) return false;

            const dirHandle = await this.getDirectoryHandle("/" + parts.join("/"));
            if (!dirHandle) return false;

            await dirHandle.removeEntry(fileName);
            return true;
        } catch (error) {
            console.error(`Failed to delete file: ${path}`, error);
            return false;
        }
    }

    public async fileExists(path: string): Promise<boolean> {
        const handle = await this.getFileHandle(path);
        return handle !== null;
    }

    /**
     * Checks if OPFS is supported in the current browser.
     * @returns Boolean indicating OPFS support
     */
    public static IsSupported(): boolean {
        return "storage" in navigator && "getDirectory" in navigator.storage;
    }
}
