"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["3778"],{44729:function(a,e,r){r.r(e),r.d(e,{shadowMapFragmentSoftTransparentShadowWGSL:()=>t});var o=r(29416);let s="shadowMapFragmentSoftTransparentShadow",n=`#if SM_SOFTTRANSPARENTSHADOW==1
if ((bayerDither8(floor(((fragmentInputs.position.xy)%(8.0)))))/64.0>=uniforms.softTransparentShadowSM.x*alpha) {discard;}
#endif
`;o.l.IncludesShadersStoreWGSL[s]||(o.l.IncludesShadersStoreWGSL[s]=n);let t={name:s,shader:n}}}]);