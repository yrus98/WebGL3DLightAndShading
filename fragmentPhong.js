const fragmentShaderSrcPhong = `      
          precision mediump float;

    uniform vec3 uObjectColor; 

        uniform float Ka;
        uniform float Kd;
        uniform float Ks;
        uniform float shininess;
        uniform float ua, ub, uc;

        uniform vec3 ambientColor[3];
        uniform vec3 diffuseColor[3];
        uniform vec3 specularColor[3];
        
        uniform vec3 uLightPos[3];


        uniform float illum[3];


    // varying vec3 vLightPos[3];
    varying vec3 vFragPos;
    varying vec3 vNormal;

        void main () {               
          vec3 N, L, V, H; // vec3 R;
          N = normalize(vNormal);
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
        gl_FragColor = vec4(color * uObjectColor , 1.0);
        }  
	`;

export default fragmentShaderSrcPhong;
