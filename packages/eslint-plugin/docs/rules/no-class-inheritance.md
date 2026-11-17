# `no-class-inheritance`

Disallows class inheritance via `extends`. Cosmos Journeyer prefers composition over inheritance (see `AGENTS.md`): inheritance hierarchies are hard to refactor when requirements change.

## Rule details

This rule reports every class declaration or class expression that declares a superclass:

```ts
class MengerSponge extends FractalAnomaly {} // reported
const Foo = class extends Bar {}; // reported
```

Classes without a superclass, and type-level `extends` (interfaces, type aliases), are not reported:

```ts
class Foo {}
class Foo implements Bar {} // implements is fine
interface Foo extends Bar {} // type-level, allowed
type Foo = Bar & Baz; // type-level, allowed
```

## Preferred pattern

Wrap the superclass instance in a private field and expose it through a getter, or return it directly from a factory function when there is no state to keep:

```ts
// With state to update over time: wrapper class with a getter
class FoilMaterial {
    private readonly material: NodeMaterial;

    constructor(scene: Scene) {
        this.material = new NodeMaterial("foil", scene);
        // ... configure this.material ...
    }

    get(): NodeMaterial {
        return this.material;
    }

    dispose(): void {
        this.material.dispose();
    }
}

mesh.material = new FoilMaterial(scene).get();

// Without state: plain factory function returning the wrapped object directly
function createFoilMaterial(scene: Scene): NodeMaterial {
    const material = new NodeMaterial("foil", scene);
    // ... configure material ...
    return material;
}

mesh.material = createFoilMaterial(scene);
```

For recoverable failures, return a `Result<T, E>` instead of throwing a custom `Error` subclass.

## Unavoidable external base classes

A handful of base classes imposed by external frameworks cannot be composed around (for example Babylon.js `PostProcess` or `NodeMaterialBlock`, whose instances are created and driven by the framework itself, or Node's `EventEmitter` for mocks). For those specific classes only, disable the rule inline with a justification:

```ts
// eslint-disable-next-line cosmos/no-class-inheritance -- Babylon's RegisterClass requires a real NodeMaterialBlock subclass
export class InstanceIndexBlock extends NodeMaterialBlock {
    // ...
}
```

Keep these exceptions rare and local: a new `extends` must not rely on a project-wide allow list.

## Limitations

This rule is intentionally syntax-only. It does not use the TypeScript type checker, so it cannot tell whether a superclass identifier refers to a local class or an import.
