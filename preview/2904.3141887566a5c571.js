"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["2904"],{17467(a,e,r){r.r(e),r.d(e,{shadowMapFragmentSoftTransparentShadow:()=>n});var o=r(56863);let s="shadowMapFragmentSoftTransparentShadow",d=`#if SM_SOFTTRANSPARENTSHADOW==1
if ((bayerDither8(floor(mod(gl_FragCoord.xy,8.0))))/64.0>=softTransparentShadowSM.x*alpha) discard;
#endif
`;o.l.IncludesShadersStore[s]||(o.l.IncludesShadersStore[s]=d);let n={name:s,shader:d}}}]);