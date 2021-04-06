const debugVertexShaderSrc = `      
        attribute vec3 aPosition;

        uniform mat4 uMVPMatrix;      
        
        void main () {                       
          gl_Position = uMVPMatrix * vec4(aPosition, 1.0); 
        }                          
	  `;

export default debugVertexShaderSrc;
