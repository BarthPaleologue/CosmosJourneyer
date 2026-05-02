import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";var r,i,a=e((()=>{t(),r=`logDepthFragment`,i=`#ifdef LOGARITHMICDEPTH
fragmentOutputs.fragDepth=log2(fragmentInputs.vFragmentDepth)*uniforms.logarithmicDepthConstant*0.5;
#endif
`,n.IncludesShadersStoreWGSL[r]||(n.IncludesShadersStoreWGSL[r]=i)}));export{a as t};