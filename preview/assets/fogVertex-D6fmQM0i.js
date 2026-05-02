import{t as e}from"./shaderStore-DV7KRD9j.js";const t=`clipPlaneVertexDeclaration`;e.IncludesShadersStore[t]||(e.IncludesShadersStore[t]=`#ifdef CLIPPLANE
uniform vec4 vClipPlane;varying float fClipDistance;
#endif
#ifdef CLIPPLANE2
uniform vec4 vClipPlane2;varying float fClipDistance2;
#endif
#ifdef CLIPPLANE3
uniform vec4 vClipPlane3;varying float fClipDistance3;
#endif
#ifdef CLIPPLANE4
uniform vec4 vClipPlane4;varying float fClipDistance4;
#endif
#ifdef CLIPPLANE5
uniform vec4 vClipPlane5;varying float fClipDistance5;
#endif
#ifdef CLIPPLANE6
uniform vec4 vClipPlane6;varying float fClipDistance6;
#endif
`);const n=`fogVertexDeclaration`;e.IncludesShadersStore[n]||(e.IncludesShadersStore[n]=`#ifdef FOG
varying vec3 vFogDistance;
#endif
`);const r=`clipPlaneVertex`;e.IncludesShadersStore[r]||(e.IncludesShadersStore[r]=`#ifdef CLIPPLANE
fClipDistance=dot(worldPos,vClipPlane);
#endif
#ifdef CLIPPLANE2
fClipDistance2=dot(worldPos,vClipPlane2);
#endif
#ifdef CLIPPLANE3
fClipDistance3=dot(worldPos,vClipPlane3);
#endif
#ifdef CLIPPLANE4
fClipDistance4=dot(worldPos,vClipPlane4);
#endif
#ifdef CLIPPLANE5
fClipDistance5=dot(worldPos,vClipPlane5);
#endif
#ifdef CLIPPLANE6
fClipDistance6=dot(worldPos,vClipPlane6);
#endif
`);const i=`fogVertex`;e.IncludesShadersStore[i]||(e.IncludesShadersStore[i]=`#ifdef FOG
vFogDistance=(view*worldPos).xyz;
#endif
`);