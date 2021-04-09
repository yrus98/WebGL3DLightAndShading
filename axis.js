import objLoader from 'https://cdn.skypack.dev/webgl-obj-loader';
import { vec3, vec4, mat4 } from 'https://cdn.skypack.dev/gl-matrix';

export default class Axis
{
	constructor(gl, mesh, color, scale, rotationAngle = 0, rotationAxis = vec3.fromValues(0,1,0))
	{
		this.gl = gl;
		this.color = color;
		this.mesh = mesh;
		this.scale = scale;
		this.rotationAngle = rotationAngle;
		this.rotationAxis = rotationAxis;

		this.modelTransformMatrix = mat4.create();
		this.calculateMVPmatrix();
		let viewMatrix = mat4.create();
		mat4.lookAt(viewMatrix, vec3.fromValues(0.5, 0.5, 0.5), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
		mat4.multiply(this.modelTransformMatrix, viewMatrix, this.modelTransformMatrix);

		this.mesh.indices = [];
		for (let i = 0; i < this.mesh.indicesPerMaterial.length; i++) {
			this.mesh.indices = this.mesh.indices.concat(this.mesh.indicesPerMaterial[i]);
		}
		objLoader.initMeshBuffers(this.gl, this.mesh);
		
	}

	draw(shader)
	{

		const aPosition = shader.attribute("aPosition");
		this.gl.enableVertexAttribArray(aPosition);


		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.mesh.vertexBuffer);

		this.gl.vertexAttribPointer(aPosition, this.mesh.vertexBuffer.itemSize, this.gl.FLOAT, false, 0, 0);


		const uMVPMatrix = shader.uniform("uMVPMatrix");
		
		shader.setUniformMatrix4fv(uMVPMatrix, this.modelTransformMatrix);
		shader.setUniform3f(shader.uniform("uColor"), this.color);

		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);

		this.gl.drawElements(this.gl.TRIANGLES, this.mesh.indexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
	}

	setColor(color){
		this.color = color;

	}

	resetColor(){
		this.setColor(this.color);
	}

	addVertex(position, color)
	{
		this.vertexAttributesData = new Float32Array([...this.vertexAttributesData, ...position, ...color])
	}

	getPos(i){
		return this.transform.getTranslate()[i];
	}

	calculateMVPmatrix(){
		mat4.identity(this.modelTransformMatrix);
		mat4.translate(this.modelTransformMatrix, this.modelTransformMatrix, vec3.fromValues(-0.8,0.6,0.2));
		mat4.rotate(this.modelTransformMatrix, this.modelTransformMatrix, this.rotationAngle, this.rotationAxis);
		mat4.scale(this.modelTransformMatrix, this.modelTransformMatrix, this.scale);
		
	}
}