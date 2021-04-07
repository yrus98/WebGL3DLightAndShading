import objLoader from 'https://cdn.skypack.dev/webgl-obj-loader';
import { vec3, vec4, mat4 } from 'https://cdn.skypack.dev/gl-matrix';

import Transform from './transform.js';
import Light from './light.js';

export default class Model
{
	constructor(name, gl, mesh, color, light, reflCoeffs = [1.0,1.0,1.0], shininess = 32, distAttenConst = [0.5,1.5,1.0])
	{
		this.name = name;
		this.gl = gl;
		this.mesh = mesh;
		this.color = color;

		this.light = light;

		this.reflCoeffs = reflCoeffs; //[Ka,Kd,Ks]
		this.distAttenConst = distAttenConst; //[a,b,c] -> a + b*d + c*d^2
		this.shininess = shininess; //alpha

		this.mesh.indices = [];
		for (let i = 0; i < this.mesh.indicesPerMaterial.length; i++) {
			this.mesh.indices = this.mesh.indices.concat(this.mesh.indicesPerMaterial[i]);
		}
		objLoader.initMeshBuffers(this.gl, this.mesh);
		// console.log(this.mesh);
		// this.color = color;
		// this.vertexAttributesData = new Float32Array();

		this.transform = new Transform(0,0);
		// this.colorAttributesBuffer = this.gl.createBuffer();
		// this.resetColor();

		this.selFaceInd = [-1,-1,-1];
		this.bb = [0,0,0,0,0,0];
		
		// this.lightPos = lightPos;
		// this.lightColor = lightColor;
		this.calculateBoundingBox();
		this.calculateCentroid();
	}

	draw(shader, VPMatrix, lights, isAxes = false, faceSelMode = false)
	{
		// const uSceneTransformMatrix = shader.uniform("uSceneTransformMatrix");

		// let elementPerVertex = 3;

		const aPosition = shader.attribute("aPosition");
		this.gl.enableVertexAttribArray(aPosition);

		// objLoader.initMeshBuffers(this.gl, this.mesh);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
		// this.gl.bufferData(this.gl.ARRAY_BUFFER, this.mesh.vertices, this.gl.STATIC_DRAW);
		this.gl.vertexAttribPointer(aPosition, this.mesh.vertexBuffer.itemSize, this.gl.FLOAT, false, 0, 0);


		const aNormal = shader.attribute("aNormal");
		this.gl.enableVertexAttribArray(aNormal);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.mesh.normalBuffer);
		this.gl.vertexAttribPointer(aNormal, this.mesh.normalBuffer.itemSize, this.gl.FLOAT, false, 0, 0);


		// this.gl.uniform1f(shader.uniform("faceSelMode"), faceSelMode?1:0);

		
		let MVPMatrix = mat4.create();
		
		mat4.copy(MVPMatrix, this.transform.getMVPMatrix());
		shader.setUniformMatrix4fv(shader.uniform("uModelMatrix"), MVPMatrix);
		
		mat4.invert(MVPMatrix, MVPMatrix);
		mat4.transpose(MVPMatrix, MVPMatrix);
		shader.setUniformMatrix4fv(shader.uniform("uModelInverseTransposeMatrix"), MVPMatrix);

		const uMVPMatrix = shader.uniform("uMVPMatrix");
		
		if(isAxes){
			shader.setUniformMatrix4fv(uMVPMatrix, this.transform.getMVPMatrix());
		}else{
			mat4.multiply(MVPMatrix, VPMatrix, this.transform.getMVPMatrix());
			shader.setUniformMatrix4fv(uMVPMatrix, MVPMatrix);
		}

		// const uAmbientLightColor = shader.uniform("uAmbientLightColor");
		// shader.setUniform3f(uAmbientLightColor, vec3.fromValues(0.4, 0.4,0.4));

		// const uLightColor = shader.uniform("uLightColor");
		// shader.setUniform3f(uLightColor, this.lightColor); 

		// const uObjectColor = shader.uniform("uObjectColor");
		// shader.setUniform3f(uObjectColor, this.color);
		shader.setUniform3f(shader.uniform("uObjectColor"), this.color);

		shader.setUniform1f(shader.uniform("Ka"), this.reflCoeffs[0]);
		shader.setUniform1f(shader.uniform("Kd"), this.reflCoeffs[1]);
		shader.setUniform1f(shader.uniform("Ks"), this.reflCoeffs[2]);
		shader.setUniform1f(shader.uniform("shininess"), this.shininess);
		shader.setUniform1f(shader.uniform("ua"), this.distAttenConst[0]);
		shader.setUniform1f(shader.uniform("ub"), this.distAttenConst[1]);
		shader.setUniform1f(shader.uniform("uc"), this.distAttenConst[2]);

		// shader.setUniform3f(shader.uniform("ambientColor"), vec3.fromValues(0.4, 0.4, 0.4));
		// shader.setUniform3f(shader.uniform("diffuseColor"), this.color);
		// shader.setUniform3f(shader.uniform("specularColor"), this.lightColor);

		this.gl.uniform3fv(shader.uniform("uLightPos"), [...lights[0].position, ...lights[1].position, ...lights[2].position]);

		this.gl.uniform3fv(shader.uniform("ambientColor"), [...lights[0].ambientColor, ...lights[1].ambientColor, ...lights[2].ambientColor]);
		this.gl.uniform3fv(shader.uniform("diffuseColor"), [...lights[0].diffuseColor, ...lights[1].diffuseColor, ...lights[2].diffuseColor]);
		this.gl.uniform3fv(shader.uniform("specularColor"), [...lights[0].specularColor, ...lights[1].specularColor, ...lights[2].specularColor]);

		let illum = [0.0,0.0,0.0];
		for (let i = 0; i < 3; i++) {
			if(lights[i].enabled)	illum[i] = 1.0;
		}
		this.gl.uniform1fv(shader.uniform("illum"), [...illum]);

		// shader.setUniformMatrix4fv(uSceneTransformMatrix, sceneTransformMatrix);
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
		// this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.mesh.indices, this.gl.STATIC_DRAW);

		this.gl.drawElements(this.gl.TRIANGLES, this.mesh.indexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
	// this.gl.drawArrays(this.gl.TRIANGLES, 0, this.mesh.vertices.length/3);
	}

	setColor(color){
		this.color = color;
		this.colorArr = [];
		for (let ii = 0; ii < this.mesh.indexBuffer.numItems; ++ii) {
			this.colorArr.push(...this.color);
		}
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

	calculateCentroid(){
		let bb = this.getBoundingBox();
		let t = vec3.fromValues((bb[0] + bb[1])/-2, (bb[2] + bb[3])/-2, (bb[4] + bb[5])/-2);
		this.transform.setTranslateCenter(t);
		// console.log(t);
	}

	calculateBoundingBox(){
		let minX, maxX, minY, maxY, minZ, maxZ;
		let temp1 = [], temp2 = [], temp3 = [];
		for (let i = 0; i < this.mesh.vertices.length; i+=3) {
			temp1.push(this.mesh.vertices[i]);
			temp2.push(this.mesh.vertices[i+1]);
			temp3.push(this.mesh.vertices[i+2]);
		}
		let s = this.transform.getScale();
		minX = Math.min.apply(null, temp1);
		maxX = Math.max.apply(null, temp1);
		minY = Math.min.apply(null, temp2);
		maxY = Math.max.apply(null, temp2);
		minZ = Math.min.apply(null, temp3);
		maxZ = Math.max.apply(null, temp3);

		// console.log(minX, maxX, minY, maxY, minZ, maxZ);
		this.bb = [minX, maxX, minY, maxY, minZ, maxZ];
	}

	getBoundingBox(){
		return this.bb;
	}
}