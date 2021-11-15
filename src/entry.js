/**
 * entry.js
 * 
 * This is the first file loaded. It sets up the Renderer, 
 * Scene and Camera. It also starts the render loop and 
 * handles window resizes.
 * 
 */

import { sRGBEncoding, LineSegments, LineBasicMaterial, EdgesGeometry, WebGLRenderer, PerspectiveCamera, Scene, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
//import SeedScene from './objects/Scene.js';
import BasicLights from './objects/Lights.js';

const loader = new GLTFLoader();

const scene = new Scene();
const camera = new PerspectiveCamera();
const renderer = new WebGLRenderer({antialias: true});
const controls = new OrbitControls( camera, renderer.domElement );
controls.autoRotate = true;

function wireframeGLTF( gltfScene ) {
  var geos = []
  gltfScene.traverse(function (child) { 
    if (child.type == 'Mesh') {
      let geo = child.geometry
      // go up the transform chain
      let parent = child.parent
      while (parent != null) {
        geo.applyMatrix4(parent.matrix)
        parent = parent.parent
      }
      geos.push(geo)
    }
  })
  const uniBuf = BufferGeometryUtils.mergeBufferGeometries(geos);
  const edges = new EdgesGeometry(uniBuf);
  const lines = new LineSegments( edges );
  return lines;
}


const testMesh = loader.load('../meshes/scene.glb', (gltf) => {
  scene.add( gltf.scene )
  console.log(gltf.scene)

  /*var geos = []
  gltf.scene.traverse(function (child) { 
    if (child.type == 'Mesh') {
      let geo = child.geometry
      // go up the transform chain
      let parent = child.parent
      while (parent != null) {
        geo.applyMatrix4(parent.matrix)
        parent = parent.parent
      }
      geos.push(geo)
    }
  })

  // does merging the buffers even matter?
  const uniBuf = BufferGeometryUtils.mergeBufferGeometries(geos);
  const edges = new EdgesGeometry(uniBuf);
  const line = new LineSegments( edges, 
  );
  scene.add(line)
  */

  const lines = wireframeGLTF(gltf.scene)
  scene.add(lines)

}, undefined, (error) => {
  console.error( error )
})

const lights = new BasicLights();

scene.add(lights);

// scene
//scene.add(seedScene);

// camera
camera.position.set(6,3,-10);
camera.lookAt(new Vector3(0,0,0));
controls.update();

// renderer
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x7ec0ee, 1);
renderer.outputEncoding = sRGBEncoding;

// render loop
const onAnimationFrameHandler = (timeStamp) => {
  controls.update();
  renderer.render(scene, camera);
  //seedScene.update && seedScene.update(timeStamp);
  window.requestAnimationFrame(onAnimationFrameHandler);
}
window.requestAnimationFrame(onAnimationFrameHandler);

// resize
const windowResizeHanlder = () => { 
  const { innerHeight, innerWidth } = window;
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
};
windowResizeHanlder();
window.addEventListener('resize', windowResizeHanlder);

// dom
document.body.style.margin = 0;
document.body.appendChild( renderer.domElement );
