import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";var r,i,a=e((()=>{t(),r=`fogFragment`,i=`#ifdef FOG
float fog=CalcFogFactor();
#ifdef PBR
fog=toLinearSpace(fog);
#endif
color.rgb=mix(vFogColor,color.rgb,fog);
#endif
`,n.IncludesShadersStore[r]||(n.IncludesShadersStore[r]=i)}));export{a as t};
//# sourceMappingURL=fogFragment-C1WFlwAh.js.map