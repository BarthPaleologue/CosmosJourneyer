import{t as e}from"./shaderStore-DV7KRD9j.js";const t=`logDepthFragment`;e.IncludesShadersStore[t]||(e.IncludesShadersStore[t]=`#ifdef LOGARITHMICDEPTH
gl_FragDepthEXT=log2(vFragmentDepth)*logarithmicDepthConstant*0.5;
#endif
`);