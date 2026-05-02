import{t as e}from"./shaderStore-DV7KRD9j.js";const t=`uvAttributeDeclaration`;e.IncludesShadersStoreWGSL[t]||(e.IncludesShadersStoreWGSL[t]=`#ifdef UV{X}
attribute uv{X}: vec2f;
#endif
`);const n=`prePassVertexDeclaration`;e.IncludesShadersStoreWGSL[n]||(e.IncludesShadersStoreWGSL[n]=`#ifdef PREPASS
#ifdef PREPASS_LOCAL_POSITION
varying vPosition : vec3f;
#endif
#ifdef PREPASS_DEPTH
varying vViewPos: vec3f;
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
varying vNormViewDepth: f32;
#endif
#if defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
uniform previousViewProjection: mat4x4f;varying vCurrentPosition: vec4f;varying vPreviousPosition: vec4f;
#endif
#endif
`);const r=`samplerVertexDeclaration`;e.IncludesShadersStoreWGSL[r]||(e.IncludesShadersStoreWGSL[r]=`#if defined(_DEFINENAME_) && _DEFINENAME_DIRECTUV==0
varying v_VARYINGNAME_UV: vec2f;
#endif
`);const i=`bumpVertexDeclaration`;e.IncludesShadersStoreWGSL[i]||(e.IncludesShadersStoreWGSL[i]=`#if defined(BUMP) || defined(PARALLAX) || defined(CLEARCOAT_BUMP) || defined(ANISOTROPIC)
#if defined(TANGENT) && defined(NORMAL) 
varying vTBN0: vec3f;varying vTBN1: vec3f;varying vTBN2: vec3f;
#endif
#endif
`);const a=`lightVxUboDeclaration`;e.IncludesShadersStoreWGSL[a]||(e.IncludesShadersStoreWGSL[a]=`#ifdef LIGHT{X}
struct Light{X}
{vLightData: vec4f,
vLightDiffuse: vec4f,
vLightSpecular: vec4f,
#ifdef SPOTLIGHT{X}
vLightDirection: vec4f,
vLightFalloff: vec4f,
#elif defined(POINTLIGHT{X})
vLightFalloff: vec4f,
#elif defined(HEMILIGHT{X})
vLightGround: vec3f,
#elif defined(CLUSTLIGHT{X})
vSliceData: vec2f,
vSliceRanges: array<vec4f,CLUSTLIGHT_SLICES>,
#endif
#if defined(AREALIGHT{X}) && defined(AREALIGHTUSED) && defined(AREALIGHTSUPPORTED)
vLightWidth: vec4f,
vLightHeight: vec4f,
#endif
shadowsInfo: vec4f,
depthValues: vec2f} ;var<uniform> light{X} : Light{X};
#ifdef SHADOW{X}
#ifdef SHADOWCSM{X}
uniform lightMatrix{X}: array<mat4x4f,SHADOWCSMNUM_CASCADES{X}>;varying vPositionFromLight{X}_0: vec4f;varying vDepthMetric{X}_0: f32;varying vPositionFromLight{X}_1: vec4f;varying vDepthMetric{X}_1: f32;varying vPositionFromLight{X}_2: vec4f;varying vDepthMetric{X}_2: f32;varying vPositionFromLight{X}_3: vec4f;varying vDepthMetric{X}_3: f32;varying vPositionFromCamera{X}: vec4f;
#elif defined(SHADOWCUBE{X})
#else
varying vPositionFromLight{X}: vec4f;varying vDepthMetric{X}: f32;uniform lightMatrix{X}: mat4x4f;
#endif
#endif
#endif
`);const o=`prePassVertex`;e.IncludesShadersStoreWGSL[o]||(e.IncludesShadersStoreWGSL[o]=`#ifdef PREPASS_DEPTH
vertexOutputs.vViewPos=(scene.view*worldPos).rgb;
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
vertexOutputs.vNormViewDepth=((scene.view*worldPos).z-uniforms.cameraInfo.x)/(uniforms.cameraInfo.y-uniforms.cameraInfo.x);
#endif
#ifdef PREPASS_LOCAL_POSITION
vertexOutputs.vPosition=positionUpdated.xyz;
#endif
#if (defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)) && defined(BONES_VELOCITY_ENABLED)
vertexOutputs.vCurrentPosition=scene.viewProjection*worldPos;
#if NUM_BONE_INFLUENCERS>0
var previousInfluence: mat4x4f;previousInfluence=uniforms.mPreviousBones[ i32(vertexInputs.matricesIndices[0])]*vertexInputs.matricesWeights[0];
#if NUM_BONE_INFLUENCERS>1
previousInfluence+=uniforms.mPreviousBones[ i32(vertexInputs.matricesIndices[1])]*vertexInputs.matricesWeights[1];
#endif 
#if NUM_BONE_INFLUENCERS>2
previousInfluence+=uniforms.mPreviousBones[ i32(vertexInputs.matricesIndices[2])]*vertexInputs.matricesWeights[2];
#endif 
#if NUM_BONE_INFLUENCERS>3
previousInfluence+=uniforms.mPreviousBones[ i32(vertexInputs.matricesIndices[3])]*vertexInputs.matricesWeights[3];
#endif
#if NUM_BONE_INFLUENCERS>4
previousInfluence+=uniforms.mPreviousBones[ i32(vertexInputs.matricesIndicesExtra[0])]*vertexInputs.matricesWeightsExtra[0];
#endif 
#if NUM_BONE_INFLUENCERS>5
previousInfluence+=uniforms.mPreviousBones[ i32(vertexInputs.matricesIndicesExtra[1])]*vertexInputs.matricesWeightsExtra[1];
#endif 
#if NUM_BONE_INFLUENCERS>6
previousInfluence+=uniforms.mPreviousBones[ i32(vertexInputs.matricesIndicesExtra[2])]*vertexInputs.matricesWeightsExtra[2];
#endif 
#if NUM_BONE_INFLUENCERS>7
previousInfluence+=uniforms.mPreviousBones[ i32(vertexInputs.matricesIndicesExtra[3])]*vertexInputs.matricesWeightsExtra[3];
#endif
vertexOutputs.vPreviousPosition=uniforms.previousViewProjection*finalPreviousWorld*previousInfluence* vec4f(positionUpdated,1.0);
#else
vertexOutputs.vPreviousPosition=uniforms.previousViewProjection*finalPreviousWorld* vec4f(positionUpdated,1.0);
#endif
#endif
`);const s=`uvVariableDeclaration`;e.IncludesShadersStoreWGSL[s]||(e.IncludesShadersStoreWGSL[s]=`#ifdef MAINUV{X}
#if !defined(UV{X})
var uv{X}: vec2f=vec2f(0.,0.);
#else
var uv{X}: vec2f=vertexInputs.uv{X};
#endif
vertexOutputs.vMainUV{X}=uv{X};
#endif
`);const c=`samplerVertexImplementation`;e.IncludesShadersStoreWGSL[c]||(e.IncludesShadersStoreWGSL[c]=`#if defined(_DEFINENAME_) && _DEFINENAME_DIRECTUV==0
if (uniforms.v_INFONAME_==0.)
{vertexOutputs.v_VARYINGNAME_UV= (uniforms._MATRIXNAME_Matrix* vec4f(uvUpdated,1.0,0.0)).xy;}
#ifdef UV2
else if (uniforms.v_INFONAME_==1.)
{vertexOutputs.v_VARYINGNAME_UV= (uniforms._MATRIXNAME_Matrix* vec4f(uv2Updated,1.0,0.0)).xy;}
#endif
#ifdef UV3
else if (uniforms.v_INFONAME_==2.)
{vertexOutputs.v_VARYINGNAME_UV= (uniforms._MATRIXNAME_Matrix* vec4f(vertexInputs.uv3,1.0,0.0)).xy;}
#endif
#ifdef UV4
else if (uniforms.v_INFONAME_==3.)
{vertexOutputs.v_VARYINGNAME_UV= (uniforms._MATRIXNAME_Matrix* vec4f(vertexInputs.uv4,1.0,0.0)).xy;}
#endif
#ifdef UV5
else if (uniforms.v_INFONAME_==4.)
{vertexOutputs.v_VARYINGNAME_UV= (uniforms._MATRIXNAME_Matrix* vec4f(vertexInputs.uv5,1.0,0.0)).xy;}
#endif
#ifdef UV6
else if (uniforms.v_INFONAME_==5.)
{vertexOutputs.v_VARYINGNAME_UV= (uniforms._MATRIXNAME_Matrix* vec4f(vertexInputs.uv6,1.0,0.0)).xy;}
#endif
#endif
`);const l=`bumpVertex`;e.IncludesShadersStoreWGSL[l]||(e.IncludesShadersStoreWGSL[l]=`#if defined(BUMP) || defined(PARALLAX) || defined(CLEARCOAT_BUMP) || defined(ANISOTROPIC)
#if defined(TANGENT) && defined(NORMAL)
var tbnNormal: vec3f=normalize(normalUpdated);var tbnTangent: vec3f=normalize(tangentUpdated.xyz);var tbnBitangent: vec3f=cross(tbnNormal,tbnTangent)*tangentUpdated.w;var matTemp= mat3x3f(finalWorld[0].xyz,finalWorld[1].xyz,finalWorld[2].xyz)* mat3x3f(tbnTangent,tbnBitangent,tbnNormal);vertexOutputs.vTBN0=matTemp[0];vertexOutputs.vTBN1=matTemp[1];vertexOutputs.vTBN2=matTemp[2];
#endif
#endif
`);const u=`shadowsVertex`;e.IncludesShadersStoreWGSL[u]||(e.IncludesShadersStoreWGSL[u]=`#ifdef SHADOWS
#if defined(SHADOWCSM{X})
vertexOutputs.vPositionFromCamera{X}=scene.view*worldPos;
#if SHADOWCSMNUM_CASCADES{X}>0
vertexOutputs.vPositionFromLight{X}_0=uniforms.lightMatrix{X}[0]*worldPos;
#ifdef USE_REVERSE_DEPTHBUFFER
vertexOutputs.vDepthMetric{X}_0=(-vertexOutputs.vPositionFromLight{X}_0.z+light{X}.depthValues.x)/light{X}.depthValues.y;
#else
vertexOutputs.vDepthMetric{X}_0= (vertexOutputs.vPositionFromLight{X}_0.z+light{X}.depthValues.x)/light{X}.depthValues.y;
#endif
#endif
#if SHADOWCSMNUM_CASCADES{X}>1
vertexOutputs.vPositionFromLight{X}_1=uniforms.lightMatrix{X}[1]*worldPos;
#ifdef USE_REVERSE_DEPTHBUFFER
vertexOutputs.vDepthMetric{X}_1=(-vertexOutputs.vPositionFromLight{X}_1.z+light{X}.depthValues.x)/light{X}.depthValues.y;
#else
vertexOutputs.vDepthMetric{X}_1= (vertexOutputs.vPositionFromLight{X}_1.z+light{X}.depthValues.x)/light{X}.depthValues.y;
#endif
#endif 
#if SHADOWCSMNUM_CASCADES{X}>2
vertexOutputs.vPositionFromLight{X}_2=uniforms.lightMatrix{X}[2]*worldPos;
#ifdef USE_REVERSE_DEPTHBUFFER
vertexOutputs.vDepthMetric{X}_2=(-vertexOutputs.vPositionFromLight{X}_2.z+light{X}.depthValues.x)/light{X}.depthValues.y;
#else
vertexOutputs.vDepthMetric{X}_2= (vertexOutputs.vPositionFromLight{X}_2.z+light{X}.depthValues.x)/light{X}.depthValues.y;
#endif
#endif 
#if SHADOWCSMNUM_CASCADES{X}>3
vertexOutputs.vPositionFromLight{X}_3=uniforms.lightMatrix{X}[3]*worldPos;
#ifdef USE_REVERSE_DEPTHBUFFER
vertexOutputs.vDepthMetric{X}_3=(-vertexOutputs.vPositionFromLight{X}_3.z+light{X}.depthValues.x)/light{X}.depthValues.y;
#else
vertexOutputs.vDepthMetric{X}_3= (vertexOutputs.vPositionFromLight{X}_3.z+light{X}.depthValues.x)/light{X}.depthValues.y;
#endif
#endif 
#elif defined(SHADOW{X}) && !defined(SHADOWCUBE{X})
vertexOutputs.vPositionFromLight{X}=uniforms.lightMatrix{X}*worldPos;
#ifdef USE_REVERSE_DEPTHBUFFER
vertexOutputs.vDepthMetric{X}=(-vertexOutputs.vPositionFromLight{X}.z+light{X}.depthValues.x)/light{X}.depthValues.y;
#else
vertexOutputs.vDepthMetric{X}=(vertexOutputs.vPositionFromLight{X}.z+light{X}.depthValues.x)/light{X}.depthValues.y;
#endif
#endif
#endif
`);