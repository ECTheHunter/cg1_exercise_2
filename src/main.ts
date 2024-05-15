// external dependencies
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// local from us provided utilities
import type * as utils from './lib/utils';
import RenderWidget from './lib/rendererWidget';
import { Application, createWindow } from './lib/window';

// helper lib, provides exercise dependent prewritten Code
import * as helper from './helper';

var teddyBear=new THREE.Object3D;
var teddyBearmid=new THREE.Object3D;
var screenCamera = new THREE.PerspectiveCamera;
var worldCamera = new THREE.PerspectiveCamera;
var orthoCamera = new THREE.OrthographicCamera;
var scenemid = new THREE.Scene;
function callback(changed: utils.KeyValuePair<helper.Settings>){

  if(changed.key=="translateX"){
    teddyBear!.position.x-=teddyBear.position.x;
    teddyBear!.translateX(changed.value);
    teddyBearmid.translateX(changed.value)
    transformTeddyBearToNDC();

  }
  else if(changed.key=="translateY"){
    teddyBear!.position.y-=teddyBear.position.y;
    teddyBear!.translateY(changed.value);
    transformTeddyBearToNDC();
  }
  else if(changed.key=="translateZ"){
    teddyBear!.position.z-=teddyBear.position.z;
    teddyBear!.translateZ(changed.value);
    transformTeddyBearToNDC();
  }
   else if(changed.key=="rotateX"){
    teddyBear!.rotation.x-=teddyBear.rotation.x;
    teddyBear!.rotation.x=changed.value;
    transformTeddyBearToNDC();
  }
  else if(changed.key=="rotateY"){
    teddyBear!.rotation.y-=teddyBear.rotation.y;
    teddyBear!.rotation.y=changed.value;
    transformTeddyBearToNDC();
  }
  else if(changed.key=="rotateZ"){
    teddyBear!.rotation.z-=teddyBear.rotation.z;
    teddyBear!.rotation.z=changed.value;
    transformTeddyBearToNDC();
  }
  else if(changed.key=="far"){
    screenCamera!.far = changed.value;
    screenCamera!.updateProjectionMatrix();
    worldCamera!.updateProjectionMatrix();
    transformTeddyBearToNDC();

  }
  else if(changed.key=="near"){
    screenCamera!.near = changed.value;
    screenCamera!.updateProjectionMatrix();
    worldCamera!.updateProjectionMatrix();
    transformTeddyBearToNDC();
  }
  else if(changed.key=="fov"){
    screenCamera!.fov = changed.value;
    screenCamera!.updateProjectionMatrix();
    worldCamera!.updateProjectionMatrix();
    transformTeddyBearToNDC();
  }
  
}
function deepCloneObject3D(source:THREE.Object3D) {
  var clonedObject = helper.createTeddyBear();

  source.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        
          var geometry = child.geometry;
          var material = child.material;

          // Check if geometry and material exist
          if (geometry && material) {
              var clonedGeometry = geometry.clone();
              var clonedMaterial = material.clone();

              var mesh = new THREE.Mesh(clonedGeometry, clonedMaterial);

              // Apply the local matrix transformations (not the world matrix)
              mesh.applyMatrix4(child.matrixWorld);

              clonedObject.add(mesh);
          }
          else if(child instanceof THREE.Object3D){
            var object = child.clone();
            object.applyMatrix4(child.matrixWorld)
            clonedObject.add(object)
          }
      }
  });

  return clonedObject;
}


function transformTeddyBearToNDC() {
  // Update the camera matrices
  //teddyBearmid = deepCloneObject3D(teddyBear);
  orthoCamera.updateMatrix();
  orthoCamera.updateMatrixWorld();
  orthoCamera.updateProjectionMatrix();

  // Traverse the teddy bear's geometry and transform each vertex
  teddyBearmid.traverse((child) => {
      if (child instanceof THREE.Mesh) {
          var geometry = child.geometry;
          var positionAttribute = geometry.getAttribute("position");
          for (let i = 0; i < positionAttribute.count; i++) {
              var vertex = new THREE.Vector3();
              vertex.fromBufferAttribute(positionAttribute, i);
              var matrixinverse = new THREE.Matrix4;
              matrixinverse.copy(child.matrixWorld);
              matrixinverse.invert();
              
              
           
              
              // Apply the perspective projection manually
              vertex.applyMatrix4(screenCamera.projectionMatrix);

              vertex = multiplyMatrixVector(screenCamera.matrixWorldInverse,vertex);

              vertex = multiplyMatrixVector(child.matrixWorld,vertex);
              
              vertex.z*=-1;
              // Set the transformed NDC coordinates
              positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
              positionAttribute.needsUpdate = true;
          }
      }

  });
  function multiplyMatrixVector(matrix: THREE.Matrix4, vector: THREE.Vector3): THREE.Vector3 {
    const result = new THREE.Vector3();
    const m = matrix.elements;
    const x = vector.x, y = vector.y, z = vector.z;
    const w = m[3] * x + m[7] * y + m[11] * z + m[15];
    result.x = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    result.y = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    result.z = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
    return result;
  }

  // Set every matrix of the bear to the identity
  teddyBearmid.traverse((child) => {
      if (child instanceof THREE.Object3D) {
        child.position.set(0,0,0);
        child.rotation.set(0,0,0);
        child.scale.set(1,1,1);
      }
      console.log(child.matrixWorld);
  });
  
}

/*******************************************************************************
 * Main entrypoint.
 ******************************************************************************/

var settings: helper.Settings;

function main(){
  var scene = new THREE.Scene();
  teddyBear = helper.createTeddyBear();
  teddyBearmid = deepCloneObject3D(teddyBear);
  scene.add(teddyBear);
  scenemid.add(teddyBearmid);
  scene.background = new THREE.Color(0xffffff);
  scenemid.background = new THREE.Color(0xffffff);
  var root = Application("Camera");
  root.setLayout([["world", "canonical", "screen"]]);
  root.setLayoutColumns(["1fr", "1fr", "1fr"]);
  root.setLayoutRows(["100%"]);


  var screenDiv = createWindow("screen");
  root.appendChild(screenDiv);

  var worldDiv = createWindow("world");
  root.appendChild(worldDiv);

  var canonicalDiv = createWindow("canonical");
  root.appendChild(canonicalDiv);

  screenCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  worldCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  orthoCamera = helper.createCanonicalCamera();
  screenCamera.position.z = 2;
  worldCamera.position.z = 2;

  var screencontrols = new OrbitControls(screenCamera, screenDiv);
  helper.setupControls(screencontrols);
  var screenRenderer = new THREE.WebGLRenderer({
    antialias: true,   
    alpha: true
  });
  var screenwid = new RenderWidget(screenDiv, screenRenderer, screenCamera, scene, screencontrols);

  var worldcontrols = new OrbitControls(worldCamera, worldDiv);
  helper.setupControls(worldcontrols);
  var worldRenderer = new THREE.WebGLRenderer({
    antialias: true,   
    alpha: true
  });

  var screenCameraHelper = new THREE.CameraHelper(screenCamera);
  scene.add(screenCameraHelper);
  var worldwid = new RenderWidget(worldDiv, worldRenderer, worldCamera, scene, worldcontrols);
  var orthoControls = new OrbitControls(orthoCamera, canonicalDiv);
  helper.setupControls(orthoControls);
  var orthoRenderer = new THREE.WebGLRenderer({
    antialias: true,   
    alpha: true
  });
  
 
  var orthowid = new RenderWidget(canonicalDiv, orthoRenderer, orthoCamera, scenemid, orthoControls);
  function guiCallback(changed: utils.KeyValuePair<helper.Settings>) {

    
    if (changed.key === "far" || changed.key === "near" || changed.key === "fov") {
      screenCameraHelper.update();
    }
  }

  helper.setupCube(scenemid);
  // create Settings and create GUI settings
  settings = new helper.Settings();
  helper.createGUI(settings);
  settings.addCallback(callback);
  settings.addCallback(guiCallback);
  //transformTeddyBearToNDC();
  screenwid.animate();
  worldwid.animate();
  orthowid.animate();
}

// call main entrypoint
main();
