import{n as e}from"./chunk-Dy9vhvp_.js";import{n as t,t as n}from"./shaderStore-CAkcDnHW.js";import{n as r}from"./helperFunctions-D8KlzsZp.js";import{t as i}from"./pbrBRDFFunctions-nboPCyPx.js";import{n as a,t as o}from"./hdrFilteringFunctions-CyZiv2GV.js";var s,c,l,u=e((()=>{t(),r(),a(),i(),o(),s=`hdrFilteringPixelShader`,c=`#include<helperFunctions>
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
uniform float alphaG;uniform samplerCube inputTexture;uniform vec2 vFilteringInfo;uniform float hdrScale;varying vec3 direction;void main() {vec3 color=radiance(alphaG,inputTexture,direction,vFilteringInfo);gl_FragColor=vec4(color*hdrScale,1.0);}`,n.ShadersStore[s]||(n.ShadersStore[s]=c),l={name:s,shader:c}}));export{u as n,l as t};
//# sourceMappingURL=hdrFiltering.fragment-BkAEftO7.js.map