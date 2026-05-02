import{t as e}from"./shaderStore-DV7KRD9j.js";const t=`logDepthDeclaration`;e.IncludesShadersStore[t]||(e.IncludesShadersStore[t]=`#ifdef LOGARITHMICDEPTH
uniform float logarithmicDepthConstant;varying float vFragmentDepth;
#endif
`);