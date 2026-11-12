# BabylonJS Shading Language (BSL)

## What is BSL?

If you want to write custom shaders for BabylonJS, you can either use Material Plugins or Node Materials.
I find Material Plugins very hacky so I prefer Node Materials. However they tend to be a pain to write.

Enter BSL: a thin wrapper around the Node Material API to make it easier to read and write!

Instead of writing this:

```typescript
const uv = new InputBlock("uv");
uv.setAsAttribute("uv");

const albedoTexture = new TextureBlock("albedoTexture");
albedoTexture.target = NodeMaterialBlockTargets.Fragment;
albedoTexture.convertToLinearSpace = true;
albedoTexture.texture = Textures.CRATE_ALBEDO;

uv.output.connectTo(albedoTexture.uv);
```

write that:

```typescript
import { builtinAttribute, textureSample, uniformTexture2d } from "babylonjs-shading-language";

const uv = builtinAttribute("uv");
const albedo = uniformTexture2d(Textures.CRATE_ALBEDO).source;
const albedoTexture = textureSample(albedo, uv, { convertToLinearSpace: true });
```

As you can see the BSL version is much more glsl-like and easier to read and reason about.

Instead of writing this:

```typescript
const factor = new InputBlock("Mesh UV scale factor");
factor.value = new Vector2(2, 10);

const scaledUV = new MultiplyBlock("scaledMeshUV");

uv.output.connectTo(scaledUV.left);
factor.output.connectTo(scaledUV.right);
```

Write that:

```typescript
const scaledUV = mul(uv, new Vector2(2, 10));
```

Operations that combine shader values accept numbers, Babylon.js vectors, and colors directly:

```typescript
const scaledUV = mul(uv, 2);
const albedo = mix(texture.rgb, new Color3(1, 0, 0), 0.5);
```

Unary operations such as `sin`, `normalize`, and `oneMinus` take shader connections.
Compute literal-only expressions in JavaScript instead of adding GPU operations.
Use `f32`, `vec`, or `color` when an explicit constant connection is needed for the raw Node Material API.

## How to use BSL?

BSL is a TS source only package. You need to use modern bundler that can transpile TS dependencies from `node_modules` to use it as a package.

If you have such a bundler, simply run:

```bash
pnpm add babylonjs-shading-language
```

## Documentation

You can build the documentation locally with `pnpm doc`, then open `doc/index.html` in your browser or run `pnpm serve:doc`.

## Missing features

I only wrapped the features that I need for my own projects, you may need to use the raw API for more advanced features.
Don't worry you can use both at the same time!

I am always open to PRs to add more features to BSL so that we eventually reach feature parity with the raw API.
