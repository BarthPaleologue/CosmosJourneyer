import{n as e}from"./chunk-Cyuzqnbw.js";import{n as t,t as n}from"./shaderStore-DR7YeKlK.js";var r,i,a=e((()=>{t(),r=`logDepthFragment`,i=`#ifdef LOGARITHMICDEPTH
gl_FragDepthEXT=log2(vFragmentDepth)*logarithmicDepthConstant*0.5;
#endif
`,n.IncludesShadersStore[r]||(n.IncludesShadersStore[r]=i)}));export{a as t};
//# sourceMappingURL=logDepthFragment-DrsGQlzY.js.map