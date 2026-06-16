import{n as e}from"./chunk-Cyuzqnbw.js";import{n as t,t as n}from"./shaderStore-DR7YeKlK.js";var r,i,a,o=e((()=>{t(),r=`shadowMapFragmentSoftTransparentShadow`,i=`#if SM_SOFTTRANSPARENTSHADOW==1
if ((bayerDither8(floor(((fragmentInputs.position.xy)%(8.0)))))/64.0>=uniforms.softTransparentShadowSM.x*alpha) {discard;}
#endif
`,n.IncludesShadersStoreWGSL[r]||(n.IncludesShadersStoreWGSL[r]=i),a={name:r,shader:i}}));export{a as n,o as t};
//# sourceMappingURL=shadowMapFragmentSoftTransparentShadow-t27RyEd7.js.map