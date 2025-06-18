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

fn get_vertex_position_on_cube(chunk_position_on_cube: vec3<f32>, direction: u32, offset: vec2<f32>) -> vec3<f32> {
    switch (direction) {
        case 0: { // UP
            return chunk_position_on_cube + vec3<f32>(offset.x, 0.0, offset.y);
        }
        case 1: { // DOWN
            return chunk_position_on_cube + vec3<f32>(offset.y, 0.0, offset.x);
        }
        case 2: { // LEFT
            return chunk_position_on_cube + vec3<f32>(0.0, offset.x, offset.y);
        }
        case 3: { // RIGHT
            return chunk_position_on_cube + vec3<f32>(0.0, offset.y, offset.x);
        }
        case 4: { // FORWARD
            return chunk_position_on_cube + vec3<f32>(offset.x, offset.y, 0.0);
        }
        default: { // BACKWARD
            return chunk_position_on_cube + vec3<f32>(offset.y, offset.x, 0.0);
        }
    }
}