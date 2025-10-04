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

/**
 * Downloads a text file with the given content and filename.
 * @param content The content of the file.
 * @param filename The name of the file.
 */
export function downloadTextFile(content: string, filename: string) {
    // Create a Blob with the text content
    const blob = new Blob([content], { type: "text/plain" });

    // Create a temporary URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create an anchor element
    const a = document.createElement("a");
    a.href = url;
    a.download = filename; // Set the file name for download

    // Trigger the download
    a.click();

    // Clean up the URL object
    URL.revokeObjectURL(url);
}
