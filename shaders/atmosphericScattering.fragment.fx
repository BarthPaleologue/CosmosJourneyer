precision highp float;

#define PI 3.1415926535897932
#define PRIMARY_STEP_COUNT 10
#define LIGHT_STEP_COUNT 10

// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;

uniform vec3 sunPosition;

uniform vec3 cameraPosition;

uniform mat4 camTransform;

uniform vec3 planetPosition;
uniform float planetRadius;
uniform float atmosphereRadius;

uniform float intensityModifier;
uniform float betaRayleighModifier;
uniform float falloffModifier;
uniform float maxHeightModifier;
uniform float rayleighScaleModifier;
uniform float mieScaleModifier;

vec3 getWorldPositionFromScreenPosition(vec2 pos) {                
    vec4 ndc = vec4((pos.x - 0.5)*2.0, (pos.y - 0.5) * 2.0, 1.0, 1.0);	
    mat4 invMat =  inverse(camTransform);
    vec4 clip = invMat * ndc;
    return (clip / clip.w).xyz;
}

bool rayIntersectSphere(vec3 rayStart, vec3 rayDir, vec3 spherePosition, float sphereRadius, out float t0, out float t1) {
    vec3 oc = rayStart - spherePosition;

    float a = 1.0; // rayDir doit être unitaire sinon on s'y retrouve pas
    float b = 2.0 * dot(oc, rayDir);
    float c = dot(oc, oc) - sphereRadius*sphereRadius;
    
    float d = b*b - 4.0*a*c;

    // Also skip single point of contact
    if(d <= 0.0) {
        return false;
    }

    float r0 = (-b - sqrt(d)) / (2.0*a);
    float r1 = (-b + sqrt(d)) / (2.0*a);

    t0 = min(r0, r1);
    t1 = max(r0, r1);

    return (t1 >= 0.0);
}

vec3 computeOpticalDepthAtPoint(vec3 originPoint, vec3 sunDir, float planetScale, float planetRadius, float atmosphereRadius,
float rayleighScale, float mieScale, float absorptionHeightMax, float absorptionFalloff) {
    
    float impactPoint, escapePoint;
    rayIntersectSphere(originPoint, sunDir, planetPosition, atmosphereRadius, impactPoint, escapePoint);

    float distanceThroughtAtmosphere =  escapePoint - impactPoint;

    float actualLightStepSize = distanceThroughtAtmosphere / float(LIGHT_STEP_COUNT - 1);
    float virtualLightStepSize = actualLightStepSize * planetScale;

    vec3 opticalDepthLight = vec3(0.0);

    for(int i = 0; i < LIGHT_STEP_COUNT; i++) {

        vec3 currentLightSamplePosition = originPoint + sunDir * actualLightStepSize * float(i);

        //calculate optical depth and accumulate
        float currentHeight = length(currentLightSamplePosition) - planetRadius; // distance to sphere center at sample point
        
        float currentOpticalDepthRayleigh = exp(-currentHeight / rayleighScale) * virtualLightStepSize;
        
        float currentOpticalDepthMie = exp(-currentHeight / mieScale) * virtualLightStepSize;
        
        float currentOpticalDepthOzone = (1.0 / cosh((absorptionHeightMax - currentHeight) / absorptionFalloff));
        currentOpticalDepthOzone *= currentOpticalDepthRayleigh * virtualLightStepSize;

        opticalDepthLight += vec3(
            currentOpticalDepthRayleigh,
            currentOpticalDepthMie,
            currentOpticalDepthOzone
        );
    } 

    return opticalDepthLight;
}

void computeScattering(vec3 pixelWorldPosition, vec3 rayDirection, vec3 sunDir,
    out vec3 scatteringColour, out vec3 scatteringOpacity) {
    
    vec3 betaRayleigh = vec3(5.5e-6, 13.0e-6, 22.4e-6) * betaRayleighModifier;
    float betaMie = 21e-6;
    vec3 betaAbsorption = vec3(2.04e-5, 4.97e-5, 1.95e-6);
    
    float g = 0.76;
    float sunIntensity = 40.0 * intensityModifier;
    
    float atmosphereHeight = (atmosphereRadius - planetRadius); // the height of the atmosphere 
    float scaleRatio = planetRadius / atmosphereHeight;
    
    float referencePlanetRadius = 6371000.0; // earth radius in meters
    float referenceAtmosphereHeight = 100000.0; // karman line height
    float referenceRatio = referencePlanetRadius / referenceAtmosphereHeight;
    
    float planetScale = referencePlanetRadius / planetRadius;
    float atmosphereScale = (scaleRatio / referenceRatio);
    
    float rayleighScale = (8500.0 * rayleighScaleModifier) / (planetScale * atmosphereScale);
    float mieScale = (1200.0*mieScaleModifier) / (planetScale * atmosphereScale);
    
    float absorptionHeightMax = (32000.0 * maxHeightModifier) * (planetScale * atmosphereScale);
    float absorptionFalloff = (3000.0 * falloffModifier) / (planetScale * atmosphereScale);
    
    float mu = dot(rayDirection, sunDir);
    float mumu = mu * mu;
    
    float gg = g * g;
    
    float phaseRayleigh = 3.0 / (16.0 * PI) * (1.0 + mumu);
    float phaseMie = 3.0 / (8.0 * PI) * ((1.0 - gg) * (mumu + 1.0)) / (pow(1.0 + gg - 2.0 * mu * g, 1.5) * (2.0 + gg));
    
    // Early out if ray doesn't intersect atmosphere.
    float impactPoint, escapePoint;
    if (!(rayIntersectSphere(cameraPosition, rayDirection, planetPosition, atmosphereRadius, impactPoint, escapePoint))) {
        return;
    }

    // shrink if intersection with planet
    float maxRayLength = distance(pixelWorldPosition, cameraPosition);
    escapePoint = min(maxRayLength, escapePoint);
    
    // if the camera is inside the atm
    impactPoint = max(0.0, impactPoint);

    float distanceThroughAtmosphere = escapePoint - impactPoint;
    
    float actualPrimaryStepSize = distanceThroughAtmosphere / float(PRIMARY_STEP_COUNT - 1);
    float virtualPrimaryStepSize = actualPrimaryStepSize * planetScale;

    vec3 accumulatedRayleigh = vec3(0.0);
    vec3 accumulatedMie = vec3(0.0);
    vec3 opticalDepth = vec3(0.0);
    
    // Take N steps along primary ray
    for (int i = 0; i < PRIMARY_STEP_COUNT; i++) {

        vec3 currentPrimarySamplePosition = cameraPosition + rayDirection * impactPoint + rayDirection * actualPrimaryStepSize * float(i);

        float currentHeight = max(0.0, length(currentPrimarySamplePosition) - planetRadius);
        
        float currentOpticalDepthRayleigh = exp(-currentHeight / rayleighScale) * virtualPrimaryStepSize;
        
        float currentOpticalDepthMie = exp(-currentHeight / mieScale) * virtualPrimaryStepSize;
        
        // Taken from https://www.shadertoy.com/view/wlBXWK
        float currentOpticalDepthOzone = (1.0 / cosh((absorptionHeightMax - currentHeight) / absorptionFalloff));
        currentOpticalDepthOzone *= currentOpticalDepthRayleigh * virtualPrimaryStepSize;
        
        opticalDepth += vec3(currentOpticalDepthRayleigh, currentOpticalDepthMie, currentOpticalDepthOzone);
        
        // Sample light ray and accumulate optical depth.
        vec3 opticalDepthLight = computeOpticalDepthAtPoint(currentPrimarySamplePosition, sunDir, planetScale, planetRadius, atmosphereRadius,
            rayleighScale, mieScale, absorptionHeightMax, absorptionFalloff);
        
        vec3 r = (betaRayleigh * (opticalDepth.x + opticalDepthLight.x) +
            betaMie * (opticalDepth.y + opticalDepthLight.y) + 
            betaAbsorption * (opticalDepth.z + opticalDepthLight.z));
        
        vec3 attn = exp(-r);
        accumulatedRayleigh += currentOpticalDepthRayleigh * attn;
        accumulatedMie += currentOpticalDepthMie * attn;
    }
    
    scatteringColour = sunIntensity * (phaseRayleigh * betaRayleigh * accumulatedRayleigh + phaseMie * betaMie * accumulatedMie);
    
    scatteringOpacity = exp(-(betaMie * opticalDepth.y + betaRayleigh * opticalDepth.x + betaAbsorption * opticalDepth.z));
}

void main() {
    vec4 baseColor = texture2D(textureSampler, vUV);

    vec3 pixelWorldPosition = getWorldPositionFromScreenPosition(vUV);

    vec3 cameraDirection = normalize(pixelWorldPosition - cameraPosition);

    vec3 diffuse = texture2D(textureSampler, vUV).rgb;
    vec3 rayDir = normalize(sunPosition - planetPosition);

    vec3 scatteringColour;
    vec3 scatteringOpacity;
    computeScattering(pixelWorldPosition, cameraDirection, rayDir, scatteringColour, scatteringOpacity);

    vec3 res;
    if(scatteringColour.r > 0.001 && scatteringColour.g > 0.001 && scatteringColour.b > 0.001) {
        res = diffuse * (1.0 - scatteringColour * scatteringOpacity) + scatteringColour * scatteringOpacity;
    } else {
        res = diffuse;
    }

    gl_FragColor = vec4(res, 1.0);

}