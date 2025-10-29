"use strict";(globalThis.webpackChunk_cosmos_journeyer_game=globalThis.webpackChunk_cosmos_journeyer_game||[]).push([["902"],{93733:function(a,e,r){r.r(e),r.d(e,{shadowMapFragmentSoftTransparentShadow:()=>t});var o=r(22081);let s="shadowMapFragmentSoftTransparentShadow",n=`#if SM_SOFTTRANSPARENTSHADOW==1
if ((bayerDither8(floor(mod(gl_FragCoord.xy,8.0))))/64.0>=softTransparentShadowSM.x*alpha) discard;
#endif
`;o.l.IncludesShadersStore[s]||(o.l.IncludesShadersStore[s]=n);let t={name:s,shader:n}}}]);