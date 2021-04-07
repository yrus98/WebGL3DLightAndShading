const vertexShaderSrcGouraud = `      
        attribute vec3 aPosition;
        attribute vec3 aNormal;

        uniform mat4 uMVPMatrix;
        uniform mat4 uModelMatrix;
        uniform mat4 uModelInverseTransposeMatrix;
        uniform vec3 uLightPos[3];

        uniform vec3 uObjectColor; 

        uniform float Ka;
        uniform float Kd;
        uniform float Ks;
        uniform float shininess;
        uniform float ua, ub, uc;

        uniform vec3 ambientColor[3];
        uniform vec3 diffuseColor[3];
        uniform vec3 specularColor[3];

        uniform float illum[3];

        varying vec4 vColor;

        
        void main () {             
           
            // gl_Position = uProject * uView * uModelTransformMatrix * vec4(aPosition, 1.0); 
            gl_Position = uMVPMatrix * vec4(aPosition, 1.0); 

            vec3 vFragPos = vec3(uMVPMatrix * vec4(aPosition, 1.0));
            // vec3 vFragPos = vec3(uModelMatrix * vec4(aPosition, 1.0));

          vec3 N, L, H, V; //vec3 R;
          N = normalize(mat3(uMVPMatrix) * aNormal);
          // N = normalize(mat3(uModelInverseTransposeMatrix) * aNormal);
          V = normalize( vFragPos);

          float d = 0.0;
          float distAttenuation;
          vec3 color = vec3(0.0,0.0,0.0);

        for(int i=0; i<3; i++){
              L = normalize(uLightPos[i] - vFragPos);
                d = distance(vFragPos, uLightPos[i]);
                distAttenuation = clamp(1.0/(ua + (ub*d) + (uc*d*d)), 0.1, 1.0);
              
              // Phong Illumination using R and V
              // R = reflect(L, N);
              // color = color + illum[i] * (Ka * ambientColor[i] + ( Kd * diffuseColor[i] * max( dot(L, N), 0.0) ) + ( Ks * specularColor[i] * pow( max( dot(R, V), 0.0), shininess)))*distAttenuation;
          
              // Blinn-Phong Illumination using halfway vector H
              H = normalize(L - V);
              color = color + illum[i] * (Ka * ambientColor[i] + ( Kd * diffuseColor[i] * max( dot(L, N), 0.0) ) + ( Ks * specularColor[i] * pow( max( dot(N, H), 0.0), shininess * 4.0)))*distAttenuation;

          }
        vColor = vec4(color * uObjectColor , 1.0);                     
        }     
	  `;

export default vertexShaderSrcGouraud;
