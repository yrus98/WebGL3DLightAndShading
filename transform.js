import { vec3, mat4, quat } from 'https://cdn.skypack.dev/gl-matrix';

export default class Transform
{
	constructor(centerX, centerY, centerZ = 0)
	{
		this.translate = vec3.fromValues(0, 0, 0);
		this.translateCenter = vec3.fromValues(centerX, centerY, centerZ);
		this.scale = vec3.fromValues(1, 1, 1);
		this.rotationAngle = 0;
		this.rotationAxis = vec3.fromValues( 0, 1, 0);

		this.modelTransformMatrix = mat4.create();
		mat4.identity(this.modelTransformMatrix);

		this.rotateQuatMatrix = mat4.create();

		this.updateMVPMatrix();
		this.viewMatrix = mat4.create();
		mat4.lookAt(this.viewMatrix, vec3.fromValues(0.5, 0.5, 0.5), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));

	}

	getMVPMatrix()
	{
		return this.modelTransformMatrix;
	}

	updateMVPMatrix()
	{
		mat4.identity(this.modelTransformMatrix);
		mat4.translate(this.modelTransformMatrix, this.modelTransformMatrix, this.translate);
		mat4.rotate(this.modelTransformMatrix, this.modelTransformMatrix, this.rotationAngle, this.rotationAxis);
		mat4.scale(this.modelTransformMatrix, this.modelTransformMatrix, this.scale);
		mat4.translate(this.modelTransformMatrix, this.modelTransformMatrix, this.translateCenter);
	}

	updateMVPMatrixNew()
	{
		mat4.identity(this.modelTransformMatrix);
		// mat4.fromRotationTranslation(this.modelTransformMatrix, this.rotateQuat, this.translate);
		mat4.scale(this.modelTransformMatrix, this.modelTransformMatrix, this.scale);
		mat4.translate(this.modelTransformMatrix, this.modelTransformMatrix, this.translateCenter);
		mat4.multiply(this.modelTransformMatrix, this.rotateQuatMatrix, this.modelTransformMatrix);
		let tempMat = mat4.create();
		mat4.translate(tempMat, tempMat, this.translate);
		mat4.multiply(this.modelTransformMatrix, tempMat, this.modelTransformMatrix);

	}

	setTranslate(translationVec)
	{
		vec3.copy(this.translate, translationVec);
	}

	setTranslateCenter(translationVec)
	{
		vec3.copy(this.translateCenter, translationVec);
	}

	getTranslate()
	{
		return this.translate;
	}

	setScale(scalingVec)
	{
		vec3.copy(this.scale, scalingVec);
	}

	getScale()
	{
		return this.scale[0];
	}

	setRotate(rotationAngle, rotationAxis)
	{
		this.rotationAngle = rotationAngle;
		vec3.copy(this.rotationAxis, rotationAxis);
	}

	getRotate()
	{
		return this.rotationAngle;
	}

	setRotateQuat(rotateQuatMatrix)
	{
		mat4.copy(this.rotateQuatMatrix, rotateQuatMatrix);
	}

	getRotateQuat()
	{
		return this.rotateQuatMatrix;
	}
}