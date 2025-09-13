"use strict";(globalThis.webpackChunkcosmos_journeyer=globalThis.webpackChunkcosmos_journeyer||[]).push([["7469"],{63020:function(a,r,o){o.r(r),o.d(r,{shadowMapFragmentSoftTransparentShadow:()=>t});var e=o(38700);let s="shadowMapFragmentSoftTransparentShadow",n=`#if SM_SOFTTRANSPARENTSHADOW==1
if ((bayerDither8(floor(mod(gl_FragCoord.xy,8.0))))/64.0>=softTransparentShadowSM.x*alpha) discard;
#endif
`;e.l.IncludesShadersStore[s]||(e.l.IncludesShadersStore[s]=n);let t={name:s,shader:n}}}]);