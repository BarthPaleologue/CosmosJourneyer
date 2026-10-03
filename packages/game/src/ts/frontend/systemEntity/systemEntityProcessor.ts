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

import type { AnySystemContentType, SystemEntity } from "./systemEntity";

export type SystemEntityProcessor<T extends AnySystemContentType, TContext, TOutput> = (
    entity: SystemEntity<T>,
    context: TContext,
) => TOutput;

export type ErasedSystemEntityProcessor<TContext, TOutput> = (entity: SystemEntity, context: TContext) => TOutput;

export class SystemEntityProcessorRegistry<TContext, TOutput> {
    private readonly registry: Map<string, ErasedSystemEntityProcessor<TContext, TOutput>> = new Map();

    private readonly fallbackProcessor: ErasedSystemEntityProcessor<TContext, TOutput>;

    constructor(fallbackProcessor: ErasedSystemEntityProcessor<TContext, TOutput>) {
        this.fallbackProcessor = fallbackProcessor;
    }

    register<T extends AnySystemContentType>(type: T, processor: SystemEntityProcessor<T, TContext, TOutput>) {
        if (this.registry.has(type)) {
            console.warn(`SystemEntity processor overridden for "${type}"`);
        }

        this.registry.set(type, eraseProcessor(type, processor));
    }

    dispatch(entity: SystemEntity, context: TContext): TOutput {
        const processor = this.registry.get(entity.model.content.type);
        if (processor === undefined) {
            return this.fallbackProcessor(entity, context);
        }

        return processor(entity, context);
    }

    dispose() {
        this.registry.clear();
    }
}

function eraseProcessor<T extends AnySystemContentType, TContext, TOutput>(
    type: T,
    processor: SystemEntityProcessor<T, TContext, TOutput>,
): ErasedSystemEntityProcessor<TContext, TOutput> {
    return (entity, context) => {
        if (entity.model.content.type !== type) {
            throw new Error(`Expected "${type}", got "${entity.model.content.type}"`);
        }

        return processor(entity as SystemEntity<T>, context);
    };
}
