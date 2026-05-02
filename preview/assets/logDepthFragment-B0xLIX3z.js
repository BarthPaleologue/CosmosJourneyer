import{t as e}from"./shaderStore-DV7KRD9j.js";const t=`logDepthFragment`;e.IncludesShadersStoreWGSL[t]||(e.IncludesShadersStoreWGSL[t]=`#ifdef LOGARITHMICDEPTH
fragmentOutputs.fragDepth=log2(fragmentInputs.vFragmentDepth)*uniforms.logarithmicDepthConstant*0.5;
#endif
`);