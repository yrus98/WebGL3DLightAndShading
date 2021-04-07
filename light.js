import { vec3, mat4 } from 'https://cdn.skypack.dev/gl-matrix';

export default class Light{
	constructor(ambientColor, diffuseColor, specularColor, position = vec3.fromValues(0,0,0)){

		this.ambientColor =  ambientColor;
		this.diffuseColor =  diffuseColor;
		this.specularColor =  specularColor;
		this.position =  position;
		this.enabled = true;

		//cube vertices for debugging light
		this.vertices = [
		  // Front face
		  -1.0, -1.0,  1.0,
		   1.0, -1.0,  1.0,
		   1.0,  1.0,  1.0,
		  -1.0,  1.0,  1.0,

		  // Back face
		  -1.0, -1.0, -1.0,
		  -1.0,  1.0, -1.0,
		   1.0,  1.0, -1.0,
		   1.0, -1.0, -1.0,

		  // Top face
		  -1.0,  1.0, -1.0,
		  -1.0,  1.0,  1.0,
		   1.0,  1.0,  1.0,
		   1.0,  1.0, -1.0,

		  // Bottom face
		  -1.0, -1.0, -1.0,
		   1.0, -1.0, -1.0,
		   1.0, -1.0,  1.0,
		  -1.0, -1.0,  1.0,

		  // Right face
		   1.0, -1.0, -1.0,
		   1.0,  1.0, -1.0,
		   1.0,  1.0,  1.0,
		   1.0, -1.0,  1.0,

		  // Left face
		  -1.0, -1.0, -1.0,
		  -1.0, -1.0,  1.0,
		  -1.0,  1.0,  1.0,
		  -1.0,  1.0, -1.0,
		];

		  
		  // This array defines each face as two triangles, using the
		  // indices into the vertex array to specify each triangle's
		  // position.

		  this.indices = [
		    0,  1,  2,      0,  2,  3,    // front
		    4,  5,  6,      4,  6,  7,    // back
		    8,  9,  10,     8,  10, 11,   // top
		    12, 13, 14,     12, 14, 15,   // bottom
		    16, 17, 18,     16, 18, 19,   // right
		    20, 21, 22,     20, 22, 23,   // left
		  ];

	}

	draw(shader, gl, VPMatrix){
		// const uSceneTransformMatrix = shader.uniform("uSceneTransformMatrix");

		let elementPerVertex = 3;

		const aPosition = shader.attribute("aPosition");
		gl.enableVertexAttribArray(aPosition);

		gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
		gl.vertexAttribPointer(aPosition, elementPerVertex, gl.FLOAT, false, 0, 0);


		let transMatrix = mat4.create();
		// mat4.identity(this.modelTransformMatrix);
		mat4.translate(transMatrix, transMatrix, this.position);
		mat4.scale(transMatrix, transMatrix, vec3.fromValues(0.02,0.02,0.02));
		
		mat4.multiply(transMatrix, VPMatrix, transMatrix);

		shader.setUniformMatrix4fv(shader.uniform("uMVPMatrix"), transMatrix);
		shader.setUniform3f(shader.uniform("uColor"), this.diffuseColor);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertices.length/3);

		// const indexBuffer = gl.createBuffer();
		//   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		//   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

		// gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
		//     gl.drawElements(gl.TRIANGLES, this.indices.length/3, gl.UNSIGNED_SHORT,0);


	}

}