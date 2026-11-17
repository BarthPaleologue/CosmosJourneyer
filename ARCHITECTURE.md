# Cosmos Journeyer's Architecture

If you are willing to contribute, this document will give you a good idea of where everything is and how it is organized.

## General principles

Here are the principles the project upholds. From those principles, the architecture arises naturally.

### Separate data models from presentation

It should be possible to describe the universe free from presentation concerns such as a game engine. This allows us to build multiple representations for the same data. For example a star can be represented as a 3d sphere when close-by, or as a sprite in the star-map. Both representations are built from the same data model.

Data model production belongs to the `backend` part of the project: the part that doesn't know anything about the presentation.

On the other hand, 3d objects and other presentations belong to the `frontend` part of the project. The frontend uses the backend to create the data models it needs to create a visual presentation.

The frontend infrastructure lives inside the `game` package under the `frontend` source folder. Modules keep their content models, procedural generators and presentations together under `modules`. For example, `modules/orbitalFacilities` owns stations, elevators and their sections.

The entrypoint for the backend lives inside the `backend` folder from the same package. The `universe-model` and `universe-generation` packages provide the shared celestial models and generators, independently of game modules.

### Isolate systems

Systems should be auditable in isolation for cognitive load and testability purposes. This means outlawing mutable global state and avoiding the use of concrete types in favor of narrow interfaces tailored for the system.

For example `KeplerianOrbitalSimulation` only knows about a small orbital interface. That way you don't need to know anything about the rest of the code to improve the orbital simulation.

## Wiring

The game's entry point is `CosmosJourneyer`. It owns the following:

- An `ICosmosJourneyerBackend` responsible for producing data models.
- The Babylon 3d engine instance, responsible for using the GPU.
- The player's current state.
- A `StarSystemView` responsible for gameplay and rendering inside a star system.
- A `StarMapView` responsible for rendering the star map.
- `GameModule` setup, responsible for adding new content.
- Transitions between `StarMapView` and `StarSystemView`.

The `StarMapView` owns:

- A Babylon scene for its rendering.
- A `StellarPathfinder` powered by the `UniverseBackend` responsible for finding the shortest path between 2 star systems.
- A `StarMap`, responsible for the production of visual representations of nearby stars.
- A `StarMapUI` responsible for displaying human-readable information about the star-map.

The `StarSystemView` owns:

- A Babylon scene for its rendering.
- A `StarSystemController` responsible for the current star system.
- A `PostProcessManager` responsible for the rendering pipeline.
- A `TerrainSystem` responsible for producing terrain vertex data.
- An `Encyclopaedia Galactica` responsible for recording player discoveries
- An `AxisRenderer` and `OrbitRenderer` for debug purposes.
- The loading/unloading of star systems.
- All player controls.

The `StarSystemController` owns:

- All current 3d objects with the same lifetime as the current system.
- A `KeplerianOrbitalSimulation` responsible for providing orbital positions and orientations.

## Extensibility

The game can be extended using modules loaded by `CosmosJourneyer` at startup.

`GameModule` instances receive a `GameModuleApi` during their setup. This API is their only way to interact with the game. It provides hooks/extension points onto which they can register new content and capabilities

Following the separation between data models and presentation, modules are expected to provide data models for the new content, and instructions on how to create presentations for these data models.

For example, a module may register a system entity model inside a star system. This means a module must register a factory to turn this data model into an object that can be placed inside the 3d scene.

Entity placement and content have separate owners: the core simulates the placement, while the module creates and updates its content. Geometry, landing pads, targeting, lighting and music are registered capabilities consumed by the core.

Entity generators receive the system, its backend-resolved galactic position and an `origin` of `"authored"` or `"procedural"`. Generators run for both origins; each module decides where to contribute. The orbital facilities module generates installations only in procedural systems and creates its own indexed RNG from the module ID and system coordinates. Authored systems keep their declared installations.

This module-owned random stream changes the previous procedural facility layout. Existing save-loading fallbacks handle references to missing objects or stations by placing the player near the system's first stellar object.

Modules register their own locales through `api.i18n.registerLocales(moduleId, locales)`. The returned translator can be retained by contributions such as star-map system information.
