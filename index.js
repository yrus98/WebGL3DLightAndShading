// http://www.cs.toronto.edu/~jacobson/phong-demo/
// http://math.hws.edu/graphicsbook/c4/s1.html
import { vec3, vec4, mat4, quat } from 'https://cdn.skypack.dev/gl-matrix';
import objLoader from 'https://cdn.skypack.dev/webgl-obj-loader';

import Shader from './shader.js';
import vertexShaderSrcGouraud from './vertexGouraud.js';
import fragmentShaderSrcGouraud from './fragmentGouraud.js';
import vertexShaderSrcPhong from './vertexPhong.js';
import fragmentShaderSrcPhong from './fragmentPhong.js';

import debugVertexShaderSrc from './vertexDebug.js';
import debugFragmentShaderSrc from './fragmentDebug.js';

import Renderer from './renderer.js';
import Transform from './transform.js'
import Model from './model.js';
import Light from './light.js';

let controlBtn = document.getElementById('modeBtn');
// let controlModeNames = ['Drawing','Instance-Transformation','Scene-Transformation'];
let selObjBtn = document.getElementById('selObjBtn');
let shaderBtn = document.getElementById('shaderBtn');
let selLightBtn = document.getElementById('selLightBtn');

let axisBtn = document.getElementById('axisBtn');
let axisLabels = ['X','Y','Z'];
// let shapeNames = ['Rectangle','Square','Circle'];
let resetBtn = document.getElementById('resetBtn');
let keyRecordiv = document.getElementById('keyRecord');
let debugCheckbox = document.getElementById('debugCheckbox');
let debugLights = false;
let snackbar = document.getElementById('snackbar');

let selMode = 'o';
let renMode = 'o';


const renderer = new Renderer();
const gl = renderer.webGlContext();
const canvas = renderer.getCanvas();

const shaderGouraud = new Shader(gl, vertexShaderSrcGouraud, fragmentShaderSrcGouraud);
const shaderPhong = new Shader(gl, vertexShaderSrcPhong, fragmentShaderSrcPhong);
const shadersList = [shaderGouraud, shaderPhong];
const shaderNames = ['Gouraud', 'Phong'];
const debugShader = new Shader(gl, debugVertexShaderSrc, debugFragmentShaderSrc);


let shaderForObjects = [0,0,0];

let shader = shadersList[0];
shader.use();


const models = [];
const axes = [];

const initModelScales = [];
//const initColors = [];
//const initColorsSum = [];
const primColors = [vec4.fromValues(1,1,0,1), vec4.fromValues(0,1,1,1), vec4.fromValues(1,0.5,0.5,1)];


let controlMode = 'Default Scene';
let shapeMode = 0;

let currActiveModelIndex = -1;

// const gui = new dat.GUI();

let translation = vec3.create();
let rotationAngle = 0;
let rotationAxis = vec3.create();
let scale = vec3.create();

let globCenterX = 0, globCenterY = 0;
let globalTransform = new Transform(0,0);
let sceneTransformMatrix = mat4.create();

// const transformSettings = {
// 	translateX :0.0,
// 	translateY :0.0,
// 	scale :1.0,
// 	rotationAngle: 0
// };
// let scaleCon = gui.add(transformSettings, 'scale', 0.0, 2.0, 0.02);

let triangleVertices = [0.5, 0, 0,
						-0.25, 0, -0.433,
						-0.25, 0, 0.433];
let drawTriangle = false;

let globMouseX = 0, globMouseY = 0, currMouseBtn = 1;
let isMouseDragging = false;
let lastX = -1, lastY = -1, lastV = vec3.create();
let QuatRot = mat4.create();
let camRotationAngles = [0,0,0];
let selRotationAxis = 1, selTranslationAxis = 1;
const rotAxes = [vec3.fromValues(1,0,0), vec3.fromValues(0,1,0), vec3.fromValues(0,0,1)];

let rotOrders = [0,1,2];
let lastRot = 2;
let selObject = 0;
let selLight = 0;


let pixValueBuf = new Uint8Array(4);


canvas.onmousedown = mousedown;
canvas.onmouseup = mouseup;
canvas.onmousemove = mousemove;

let lights = []; //{};
let light = new Light(vec3.fromValues(0.4,0.4,0.4), vec3.fromValues(0.6, 0.6, 0.6), vec3.fromValues(1.0,1.0,1.0), vec3.fromValues(0,0,0));
lights.push(light);
light = new Light(vec3.fromValues(0.4,0.4,0.4), vec3.fromValues(0, 0.8, 0.8), vec3.fromValues(0.0,1.0,1.0), vec3.fromValues(10,10,-10));
lights.push(light);
light = new Light(vec3.fromValues(0.4,0.4,0.4), vec3.fromValues(0.7, 0, 0.3), vec3.fromValues(1.0,0.0,0.3), vec3.fromValues(8,-8,8));
lights.push(light);
// lights.pos = [vec3.fromValues(1,0,0), vec3.fromValues(10,10,-10), vec3.fromValues(8, -8, 8)];
// lights.ambientColors = [vec3.fromValues(0.4,0.4,0.4), vec3.fromValues(0.4,0.4,0.4), vec3.fromValues(0.4,0.4,0.4)];
// lights.diffuseColors = [vec3.fromValues(0.6, 0.6, 0.6), vec3.fromValues(0, 0.8, 0.8), vec3.fromValues(0.7, 0.7, 0)];
// lights.specularColors = [vec3.fromValues(1.0,1.0,1.0), vec3.fromValues(0.0,1.0,1.0), vec3.fromValues(1.0,1.0,0.0)];
// lights.illum = [1.0,1.0,1.0];


const VPMatrix = mat4.create();
const projectMatrix = mat4.create();
const viewMatrix = mat4.create();
mat4.identity(VPMatrix);
mat4.perspective(projectMatrix, Math.PI/2, 4 / 3, 1 / 256, 256);
mat4.lookAt(viewMatrix, vec3.fromValues(0.5, 0.5, 0.5), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
mat4.multiply(VPMatrix, viewMatrix, VPMatrix);
mat4.multiply(VPMatrix, projectMatrix, VPMatrix);


window.onload = function(){
	
	fetch('./Models/Puppy.obj')
		  .then(response => response.text())
		  .then(text => {
			let mesh = new objLoader.Mesh(text);
			let model = new Model('Puppy', gl, mesh, vec3.fromValues(1,0.8,0), lights[0], [0.8,0.6,0.9], 64);
			let s = 0.05;
			vec3.set(scale, s, s, s);
			model.transform.setScale(scale);
			models.push(model);
			initModelScales.push(s);
//			//initColors.push(vec3.fromValues(1,0.8,0));
//			initColorsSum.push(1.8*255);
			s = s * 1.0;
			let bb = model.getBoundingBox();
			model.light.position = vec3.fromValues(s*(((bb[0] + bb[1])/-2) + bb[0]), s*(((bb[2] + bb[3])/-2) +bb[3]),s *(((bb[4] + bb[5])/-2)+bb[5]));
	});
	fetch('./Models/Lowpoly_tree_sample.obj')
		  .then(response => response.text())
		  .then(text => {
			let mesh = new objLoader.Mesh(text);
			let model = new Model('Tree', gl, mesh, vec3.fromValues(0,0.6,0), lights[1], [0.7,0.9,0.6], 24)
			let s = 0.04;
			vec3.set(scale, s, s, s);
			model.transform.setScale(scale);
			models.push(model);
			initModelScales.push(s);
//			initColors.push(vec3.fromValues(0,0.6,0));
//			initColorsSum.push(0.6*255);

			s = s * 1.0;
			let bb = model.getBoundingBox();
			model.light.position = vec3.fromValues(s*(((bb[0] + bb[1])/-2) + bb[0]), s*(((bb[2] + bb[3])/-2) +bb[3]),s *(((bb[4] + bb[5])/-2)+bb[5]));
		});
	fetch('./Models/among_us.obj')
		  .then(response => response.text())
		  .then(text => {
			let mesh = new objLoader.Mesh(text);
			let model = new Model('Among Us', gl, mesh, vec3.fromValues(0.8,0.2,0.8), lights[2], [0.5,0.5,0.9], 64)
			let s = 0.15;
			vec3.set(scale, s, s, s);
			model.transform.setScale(scale);
			models.push(model);
			initModelScales.push(s);
//			initColors.push(vec3.fromValues(0.8,0.2,0.8));
//			initColorsSum.push(1.2*255);
		  	s = s * 1.0;
			let bb = model.getBoundingBox();
			model.light.position = vec3.fromValues(s*(((bb[0] + bb[1])/-2) + bb[0]), s*(((bb[2] + bb[3])/-2) +bb[2]),s *(((bb[4] + bb[5])/-2)+bb[5]));
			stepD();
	});

	selObjBtn.style.display = 'none';
	axisBtn.style.display = 'none';
	shaderBtn.style.display = 'none';
	selLightBtn.style.display = 'none';
};

function mousedown(event) {
	let mouseX = event.clientX;
	let mouseY = event.clientY;
	currMouseBtn = event.which;
	let rect = renderer.getCanvas().getBoundingClientRect();
	mouseX = mouseX - rect.left;
	mouseY = mouseY - rect.top;
	lastX = mouseX;
	lastY = mouseY;
	const clipCoordinates = renderer.mouseToClipCoord(mouseX,mouseY);
	isMouseDragging = true;
	// console.log(lights);
}

function mouseup(event) {
	isMouseDragging = false;

}

function mousemove(event) {
	let mouseX , mouseY, mouseXC, mouseYC;
	[mouseX, mouseY] = [event.clientX,event.clientY];
	let rect = renderer.getCanvas().getBoundingClientRect();
	mouseX = mouseX - rect.left;
	mouseY = mouseY - rect.top;
	[mouseXC, mouseYC] = renderer.mouseToClipCoord(mouseX,mouseY);

	if (isMouseDragging && controlMode == 'm' && currMouseBtn!=3) {
		// The rotation speed factor
		// dx and dy here are how for in the x or y direction the mouse moved
		// let factor = 10/canvas.height;
		// let dx = factor * (mouseX - lastX);
		// let dy = factor * (mouseY - lastY);

		// update the latest angle
		// sceneAngleX += dy;
		// camRotationAngles[selRotationAxis] += dx;
		let trackballRadius = 1.5;
		let z = 0;
		
		let ss = (mouseXC**2) + (mouseYC**2);
		z = ((trackballRadius**2) - ss)**0.5;
		// if(ss <= (trackballRadius**2)/2){
		// 	z = (trackballRadius**2 - ss)**0.5;
		// }else{
		// 	z = ((trackballRadius**2)/(2*(ss**0.5)));
		// }
		let V = vec3.fromValues(mouseXC, mouseYC, z);

		let N = vec3.create();


		// vec3.transformMat4(V, V, viewMatrix);
		vec3.normalize(V, V);
		if(!vec3.equals(lastV, vec3.create())){
			vec3.cross(N, lastV, V);
			vec3.normalize(N, N);
			// vec3.transformMat4(N, -N, VPMatrix);
			// let theta = Math.acos(vec3.dot(V, lastV));
			let theta = vec3.angle(V, lastV);
			// console.log(theta);
			// console.log(vec3.length(N)/(vec3.length(V) * vec3.length(lastV)));

			// vec3.scale(N, N, Math.sin(theta/2));

			let Q = quat.create(), QMat = mat4.create();
			quat.setAxisAngle(Q, N, theta);
			// console.log(Q);
			// let st2 = Math.sin(theta/2.0);
			// console.log([N[0]* st2, N[1]* st2, N[2]* st2, Math.cos(theta/2.0)]);
			quat.normalize(Q,Q);
			mat4.fromQuat(QMat, Q);

			// mat4.fromRotation(QMat, -theta, N);
			// mat4.multiply(QuatRot, QMat, QuatRot);
			let currQ = mat4.create();
			mat4.copy(currQ, models[selObject].transform.getRotateQuat());
			mat4.multiply(QMat, QMat, currQ);
			models[selObject].transform.setRotateQuat(QMat);

			models[selObject].transform.updateMVPMatrixNew();

			let t = vec3.create();
			vec3.copy(t, models[selObject].light.position);
			let tm = mat4.create();
			mat4.invert(tm, models[selObject].transform.getMVPMatrix());
			vec3.transformMat4(t, t, tm);

			if(!checkPointInBoundingBox(t, models[selObject].getBoundingBox())){
				models[selObject].transform.setRotateQuat(currQ);
				showSnackbar();
			}
		// console.log(currQ);
		}

		vec3.copy(lastV, V);
		
	}else if(isMouseDragging && controlMode == 'm' && currMouseBtn == 3){
		let factor = 20/canvas.height;
		let dx =mouseX - lastX;
		let t = models[selObject].transform.getTranslate();
		t[selTranslationAxis] += factor * dx;
		models[selObject].transform.setTranslate(t);
		t = models[selObject].light.position;
		t[selTranslationAxis] += factor * dx;
		models[selObject].light.position = t;
	}
	else{
		lastV = vec3.create();
	}
	// update the last mouse position
	lastX = mouseX;
	lastY = mouseY;
}

// Convert mouse click to coordinate system as understood by webGL
// renderer.getCanvas().addEventListener('click', (event) =>
// {
// 	// captImageBtn.setAttribute('href', gl.canvas.toDataURL("image/jpeg", 1));
	
// 	let mouseX = event.clientX;
// 	let mouseY = event.clientY;

// 	let rect = renderer.getCanvas().getBoundingClientRect();
// 	mouseX = mouseX - rect.left;
// 	mouseY = mouseY - rect.top;

// 	const clipCoordinates = renderer.mouseToClipCoord(mouseX,mouseY);

	
// });

window.addEventListener('keydown', function (event){
	keyRecord.innerHTML = event.key;
	switch(event.key){
		case 'd':
			stepD();
			break;
		
		case 'X':
		case 'x':
			if(controlMode == 'm' || controlMode == 'l') selTranslationAxis = 0;
			break;
		case 'Y':
		case 'y':
			if(controlMode == 'm' || controlMode == 'l') selTranslationAxis = 1;
			break;
		case 'Z':
		case 'z':
			if(controlMode == 'm' || controlMode == 'l') selTranslationAxis = 2;
			break;
		case 'm':
			controlMode = 'm';
			break;
		case 's':
			controlMode = 's';
			// let so = shaderForObjects[selObject];
			// shaderForObjects[selObject] = 1 - so;
			// console.log(shaderForObjects);
			
			break;

		case 'l':
			controlMode = 'l';
			
			break;
		case '0':
			if(controlMode == 'l')	lights[selLight].enabled = false;
			else if(controlMode == 's') shaderForObjects[selObject] = 0;
			break;
		case '1':
			if(controlMode == 'l')	lights[selLight].enabled = true;
			else if(controlMode == 's') shaderForObjects[selObject] = 1;
			break;
		case '4':
			selLight = 0;
			break;
		case '5':
			selLight = 1;
			break;
		case '6':
			selLight = 2;
			break;
		case '7':
			selObject = 0;
			break;
		case '8':
			selObject = 1;
			break;
		case '9':
			selObject = 2;
			break;

		case '+':
			if(controlMode == 'm')
				scaleObj(1.1);
			else if(controlMode == 'l')
				translateLight(selLight, selTranslationAxis, 0.05);
			break;
		case '-':
			if(controlMode == 'm')
				scaleObj(0.9);
			else if(controlMode == 'l')
				translateLight(selLight, selTranslationAxis, -0.05);
			break;

		case 'Tab':
			selMode = (selMode=='o' && currActiveModelIndex!=-1)? 'f': 'o'; //Toggle selection Modes 
			break;

	}
	
	if(controlMode == 'm'){
		selObjBtn.style.display='';
		axisBtn.style.display='';
		shaderBtn.style.display='none';
		selLightBtn.style.display='none';

	}else if(controlMode == 's'){
		selObjBtn.style.display='';
		axisBtn.style.display='none';
		shaderBtn.style.display='';
		selLightBtn.style.display='none';

	}
	else if(controlMode == 'l'){
		selObjBtn.style.display='none';
		axisBtn.style.display='';
		shaderBtn.style.display='none';
		selLightBtn.style.display='';
	}
	else{
		selObjBtn.style.display='none';
		axisBtn.style.display='none';
		shaderBtn.style.display='none';
		selLightBtn.style.display='none';
	}
	controlBtn.innerHTML = 'Mode : ' + controlMode.toLocaleUpperCase();
	selObjBtn.innerHTML = 'Selected Object : ' + models[selObject].name;
	shaderBtn.innerHTML = 'Shader : ' + shaderNames[shaderForObjects[selObject]];

	selLightBtn.innerHTML = 'Selected Light corresponding to : ' + models[selLight].name;
	axisBtn.innerHTML = 'Translation Axis : ' + axisLabels[selTranslationAxis];
}, true);

// modeBtn.addEventListener("click", changeControlMode); 
selObjBtn.addEventListener("click", changeSelectedObject); 
shaderBtn.addEventListener("click", changeShader); 
selLightBtn.addEventListener("click", changeSelectedLight); 
axisBtn.addEventListener("click", changeTranslationAxis); 
resetBtn.addEventListener("click", resetScene); 
debugCheckbox.addEventListener("click", enableDebugLights); 



// function changeRotationAxis(){
// 	selRotationAxis = (selRotationAxis + 1)%3;
// 	axisBtn.innerHTML = 'Rotation Axis : ' + axisLabels[selRotationAxis];

// }

function changeTranslationAxis(){
	selTranslationAxis = (selTranslationAxis + 1)%3;
	axisBtn.innerHTML = 'Translation Axis : ' + axisLabels[selTranslationAxis];

}

function changeSelectedObject(){
	selObject = (selObject + 1)%3;
	selObjBtn.innerHTML = 'Selected Object : ' + models[selObject].name;

}

function changeShader(){
	shaderForObjects[selObject] = 1 - shaderForObjects[selObject];
	shaderBtn.innerHTML = 'Shader : ' + shaderNames[shaderForObjects[selObject]];

}

function changeSelectedLight(){
	selLight = (selLight + 1)%3;
	selLightBtn.innerHTML = 'Selected Light corresponding to : ' + models[selLight].name;

}

function res(){
	models.splice(0, models.length);
}

//Draw loop
function animate()
{
	renderer.clear();
	// mat4.copy(VPMatrix, QuatRot);

	// mat4.identity(VPMatrix);

	// mat4.rotate(VPMatrix, VPMatrix, camRotationAngles[0], rotAxes[0]);
	// mat4.rotate(VPMatrix, VPMatrix, camRotationAngles[1], rotAxes[1]);
	// mat4.rotate(VPMatrix, VPMatrix, camRotationAngles[2], rotAxes[2]);
	
	// mat4.perspective(projectMatrix, Math.PI/2, 4 / 3, 1 / 256, 256);
	// mat4.lookAt(viewMatrix, vec3.fromValues(0.5, 0.5, 0.5), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));

	// mat4.multiply(VPMatrix, viewMatrix, VPMatrix);
	// mat4.multiply(VPMatrix, projectMatrix, VPMatrix);

	// axes.forEach(function(axis, index, arr){
	// 	axis.transform.updateMVPMatrixForAxes(camRotationAngles, selRotationAxis);
	// 	axis.draw(shader, VPMatrix, true);
	// });

	
	models.forEach(function(model, index, arr){
		// console.log(models.length);
		// let scaleGUIValue = scaleCon.getValue();
		// vec3.set(scale, scaleGUIValue, scaleGUIValue, scaleGUIValue);
		// model.transform.setScale(scale);

		model.transform.updateMVPMatrixNew();
		// console.log(shaderForObjects);

		shader = shadersList[shaderForObjects[index]];
		shader.use();
		model.draw(shader, VPMatrix, lights);
		if(debugLights){
			shader = debugShader;
			shader.use();
			model.light.draw(shader, gl, VPMatrix);
		}
	
	});

	

	window.requestAnimationFrame(animate);
}
animate();
// shader.delete();


function resetScene(){
	// controlMode = 'c';
	models.forEach(function(model, index, arr){
		let temp = vec3.fromValues(triangleVertices[index * 3], triangleVertices[index * 3 + 1], triangleVertices[index * 3 + 2]);
		model.transform.setTranslate(temp);
		model.transform.setScale(vec3.fromValues(initModelScales[index],initModelScales[index],initModelScales[index]));
		model.transform.setRotate(0, vec3.fromValues(0,1,0));	
		model.transform.setRotateQuat(mat4.create());

		let s = initModelScales[index];
		let bb = model.getBoundingBox();
		model.light.position = vec3.fromValues(s*(((bb[0] + bb[1])/-2) + bb[0]), s*(((bb[2] + bb[3])/-2) +bb[3]),s *(((bb[4] + bb[5])/-2)+bb[5]));


		let t = model.light.position;
		t[0] += temp[0];
		t[1] += temp[1];
		t[2] += temp[2];
		model.light.position = t;	
		model.light.enabled = true;	
	});
	// lights.pos = [vec3.fromValues(1,0,0), vec3.fromValues(10,10,-10), vec3.fromValues(8, -8, 8)];
	// lights.illum = [1.0,1.0,1.0];
	shaderForObjects = [0,0,0];
	controlBtn.innerHTML = 'Mode : Default Scene';
	selObjBtn.style.display='none';
	axisBtn.style.display='none';
	shaderBtn.style.display='none';
	selLightBtn.style.display='none';
}

function stepD(){
	// controlMode = 'd';
	models.forEach(function(model, index, arr){
		// model.getBoundingBox();	
		let temp = vec3.fromValues(triangleVertices[index * 3], triangleVertices[index * 3 + 1], triangleVertices[index * 3 + 2]);
		model.transform.setTranslate(temp);

		let t = model.light.position;
		t[0] += temp[0];
		t[1] += temp[1];
		t[2] += temp[2];
		model.light.position = t;	
	});

	// drawTriangle = true;
	controlBtn.innerHTML = 'Mode : Default Scene';

}

function scaleObj(factor){

	let currScale = models[selObject].transform.getScale()
	let s = factor * currScale;
	models[selObject].transform.setScale(vec3.fromValues(s,s,s));
	models[selObject].transform.updateMVPMatrixNew();

	let t = vec3.create();
	vec3.copy(t, models[selObject].light.position);
	let tm = mat4.create();
	mat4.invert(tm, models[selObject].transform.getMVPMatrix());
	vec3.transformMat4(t, t, tm);

	if(!checkPointInBoundingBox(t, models[selObject].getBoundingBox())){
		models[selObject].transform.setScale(vec3.fromValues(currScale,currScale,currScale));
		showSnackbar();
	}
}

function translateLight(index, axis, value){

	let t = vec3.create();
	vec3.copy(t, lights[index].position);
	t[axis] += value;
	let tm = mat4.create();
	mat4.invert(tm, models[index].transform.getMVPMatrix());
	vec3.transformMat4(t, t, tm);
	if(checkPointInBoundingBox(t, models[index].getBoundingBox())){
		lights[index].position[axis] += value;
	}else{
		showSnackbar();
	}
}

function checkPointInBoundingBox(point, bb, scl = 1.25){
	for(let i=0; i< 3; i++){
		if(point[i]<(scl * bb[2 * i]) || point[i]>(scl * bb[(2 * i) + 1]))
			return false;
	}
	return true;
}

function enableDebugLights(){
	debugLights = debugCheckbox.checked;
}

function showSnackbar() {
  snackbar.className = "show";
  setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 2000);
}