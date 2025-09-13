"use strict";(globalThis.webpackChunkcosmos_journeyer=globalThis.webpackChunkcosmos_journeyer||[]).push([["6526"],{94541:function(a,r,e){e.r(r),e.d(r,{shadowMapFragmentSoftTransparentShadowWGSL:()=>t});var o=e(38700);let s="shadowMapFragmentSoftTransparentShadow",n=`#if SM_SOFTTRANSPARENTSHADOW==1
if ((bayerDither8(floor(((fragmentInputs.position.xy)%(8.0)))))/64.0>=uniforms.softTransparentShadowSM.x*alpha) {discard;}
#endif
`;o.l.IncludesShadersStoreWGSL[s]||(o.l.IncludesShadersStoreWGSL[s]=n);let t={name:s,shader:n}}}]);