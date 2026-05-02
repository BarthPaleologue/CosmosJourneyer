import{t as e}from"./shaderStore-DV7KRD9j.js";const t=`logDepthDeclaration`;e.IncludesShadersStoreWGSL[t]||(e.IncludesShadersStoreWGSL[t]=`#ifdef LOGARITHMICDEPTH
uniform logarithmicDepthConstant: f32;varying vFragmentDepth: f32;
#endif
`);