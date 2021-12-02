/**
 * entry.js
 * 
 * This is the first file loaded. It sets up the Renderer, 
 * Scene and Camera. It also starts the render loop and 
 * handles window resizes.
 * 
 */

import { Raycaster, sRGBEncoding, LineSegments, Color, LineBasicMaterial, EdgesGeometry, WebGLRenderer, PerspectiveCamera, Scene, Vector3, Vector2, Mesh } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import BasicLights from './Lights.js';
import { HalfEdgeMesh } from './eino/halfedge.js';
import { Selector } from './selection/select.js';

const loader = new GLTFLoader();

const scene = new Scene();
scene.background = new Color( 0x111111 )
const camera = new PerspectiveCamera();
camera.zoom = 50
const renderer = new WebGLRenderer({antialias: true});
const controls = new OrbitControls( camera, renderer.domElement )

const raycaster = new Raycaster()
//const selector = new Selector( camera, raycaster )

const lineMaterial = new LineBasicMaterial( { 
  color: 0xffffff,
  linewidth: 5 
})

var mainMeshBuffer = {}

//controls.autoRotate = true;

// merge gltf scene into single BufferGeometry
function mergeGLTF( gltfScene ) {
  var geos = []
  var up   = new Vector3(0,0,1)
  gltfScene.traverse(function (child) { 
    if (child.type == 'Mesh') {
      let geo = child.geometry
      // go up the transform chain
      let parent = child.parent
      while (parent != null) {
        //geo.applyMatrix4(parent.matrix)
        geo.up = up
        parent = parent.parent
      }
      geos.push(geo)
    }
  })

  const buffer = BufferGeometryUtils.mergeBufferGeometries(geos);
  return buffer;
}


const testMesh = loader.load('../meshes/walkman.glb', (gltf) => {
  //scene.add( gltf.scene )

  var buffer = mergeGLTF(gltf.scene)

  mainMeshBuffer = new Mesh( buffer )

  scene.add(mainMeshBuffer)

  const heMesh = new HalfEdgeMesh();
  heMesh.create(buffer);

  //heMesh.halfEdgeArrows(scene)

  const edges = new EdgesGeometry(buffer);
  const lines = new LineSegments( edges, lineMaterial );
  scene.add(lines)

  console.log(gltf.scene)
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

// @TODO SELECTION

const onClick = ( e ) => {
  e.preventDefault()
  console.log('fired')

  var mouseCoord = new Vector2()
  mouseCoord.x = ( event.clientX / window.innerWidth ) * 2 - 1
  mouseCoord.y = - ( event.clientY / window.innerHeight ) * 2 + 1

  raycaster.setFromCamera( mouseCoord, camera )
  
  // CANNOT RAYCAST AGAINST LINESEGMENTS
  
  let meshes = []
  scene.traverse( function ( child ) {
    console.log(child)
    if ( child.type == "Mesh" ) {
      meshes.push(child)
    }
  })

  //console.log(meshes)
  console.table(mainMeshBuffer)
  const intersects = raycaster.intersectObjects( mainMeshBuffer )
  console.log(intersects[0])
  if ( intersects.length > 0 ) {
    console.table(intersects[0])
    intersects[0].object.material.color.set( 0x00eeee ) 
  }
}

renderer.domElement.addEventListener('click', onClick, false)

// dom
document.body.style.margin = 0;
document.body.appendChild( renderer.domElement );
