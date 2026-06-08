# `@cosmos-journeyer/universe-model`

This package contains the models, schemas, and canonical derived accessors used to describe Cosmos Journeyer's universe.

It owns shared model semantics that should remain consistent across packages. For example, `getCelestialBodyRadius`
returns the stored radius for bodies that model radius directly, while black holes derive their Schwarzschild radius
from mass.
