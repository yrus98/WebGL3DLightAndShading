const vertexShaderSrcPhong = `      
        attribute vec3 aPosition;
        attribute vec3 aNormal;

        uniform mat4 uMVPMatrix;
        uniform mat4 uModelMatrix;
        uniform mat4 uModelInverseTransposeMatrix;

        varying vec3 vFragPos;
        varying vec3 vNormal;
        
        void main () {             
           
          // gl_Position = uProject * uView * uModelTransformMatrix * vec4(aPosition, 1.0); 
          gl_Position = uMVPMatrix * vec4(aPosition, 1.0); 

            vFragPos = vec3(uMVPMatrix * vec4(aPosition, 1.0));
            // vFragPos = vec3(uModelMatrix * vec4(aPosition, 1.0));

          vNormal = mat3(uMVPMatrix) * aNormal;
          // vNormal = mat3(uModelInverseTransposeMatrix) * aNormal;

        }                          
	  `;

export default vertexShaderSrcPhong;
