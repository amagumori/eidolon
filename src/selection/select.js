import { Vector2, Vector3, Line, Raycaster, Sprite, BufferGeometry, BufferAttribute, TextureLoader, LineBasicMaterial, SpriteMaterial } from 'three'

// https://discourse.threejs.org/t/raycaster-inaccurate-when-objects-have-linesegments/15919


// for intersection testing
const EPSILON = 0.001
const mainMeshId = 0


const lineMaterial = new LineBasicMaterial({ 
  color: 0xffffff,
  linewidth: 100
})

const tex = new TextureLoader().load( 'vertexSprite.png' )
const spriteMaterial = new SpriteMaterial( { map: tex } )
const vertexSprite = new Sprite( spriteMaterial ) 

class Selector {
  constructor(camera, renderer, scene) {
    console.log('constructed a selector')

    this.mode = 'face'
    this.selectMulti = false    // shift to multi select

    this.mesh = {}
    this.halfEdgeMesh = {}      // just one for now
    this.selectionGeometry = []

    this.selectedFaces = []
    this.selectedEdges = []
    this.selectedVertices = []
    this.selectedHalfEdges = []

    this.raycaster = new Raycaster()
    this.camera = camera
    this.scene = scene

    renderer.domElement.addEventListener('click', this.onClick, false) 
    
  }

  setMesh(mesh, halfEdgeMesh) {
    if ( mesh === undefined ) console.error('mesh passed into selector is undefined.')
    if ( halfEdgeMesh === undefined ) console.error('halfEdge representation passed into selector is undefined.')
    this.mesh = mesh
    this.halfEdgeMesh = halfEdgeMesh
  }

  onClick = e => {
    e.preventDefault()

    var mouseCoord = new Vector2()
    mouseCoord.x = ( e.clientX / window.innerWidth ) * 2 - 1 
    mouseCoord.y = ( e.clientY / window.innerHeight ) * 2 + 1

    this.raycaster.setFromCamera( mouseCoord, this.camera ) 

    switch ( this.mode ) {
      case 'face':
        this.selectFaces()
        break;
      case 'edge':
        this.selectEdges()
        break;
      case 'vertex':
        this.selectVertices()
        break;
      default:
        console.log('illegal selection mode passed')
        break;
    }

  }

  selectFaces () {
    // this is like the worst possible way to do this.
    // in reality we want to allocate AOT in the selector class
    // just n_faces = n_mesh_faces etc.
    const lineBuffer = new BufferGeometry()
    lineBuffer.setAttribute('position', new BufferAttribute( new Float32Array(4*3), 3))
    const line = new Line( lineBuffer, lineMaterial ) 

    const intersections = this.raycaster.intersectObject(this.mesh)

    if ( intersections.length > 0 ) {
      // allocate new line geometry 
      this.scene.add(line)

      this.selectionGeometry.push(line)

      let geo = intersections[0].object.geometry
      let point = intersections[0].point
      let face = intersections[0].face
      let faceIndex = intersections[0].faceIndex
      let meshPos = geo.attributes.position
      let linePos = line.geometry.attributes.position

      linePos.copyAt(0, meshPos, face.a)
      linePos.copyAt(1, meshPos, face.b)
      linePos.copyAt(2, meshPos, face.c)
      linePos.copyAt(3, meshPos, face.a)

      line.geometry.applyMatrix4( this.mesh.matrix ) 
      line.visible = true

      console.log('face index: ' + faceIndex)
      console.log('face: ' + face.a + ' ' + face.b + ' ' + face.c )

      console.table('point: ' + point.x + point.y + point.z )


      console.log(meshPos.array[face.a], meshPos.array[face.a + 1], meshPos.array[face.a + 2])
      console.log(meshPos.array[face.b])
      console.log(meshPos.array[face.c])

      // this depends on 1:1 mapping between three's faceIdx and ours
      // is this ensured in the import process?
      let selectedFace = this.halfEdgeMesh.faces[faceIndex]

      if ( this.multiSelect === true ) {
        this.selectedFaces.push( selectedFace ) 
        this.selectionGeometry.push( line ) 
      } else {
        // there's probably a slicker one-line way to do this...
        for ( let i=0; i < this.selectionGeometry.length; i++ ) {
          this.scene.remove(i)
        }
        this.selectedFaces = []
        this.selectedFaces.push(selectedFace)
        this.selectionGeometry.push( line )
      }

    } else {
      line.visible = false
    }

  }

  
  selectEdge( event, camera, target ) {

    const intersections = this.raycaster.intersectObject(this.mesh)

    if ( intersections.length > 0 ) {
      // allocate new line geometry 
      const lineBuffer = new BufferGeometry().setFromPoints([
        new Vector3(),
        new Vector3()
      ])
      const line = new Line( lineBuffer, lineMaterial ) 
      this.scene.add(line)

      let pos = intersections[0].object.geometry.attributes.position
      let geo = intersections[0].object.geometry
      let faceIdx = intersections[0].faceIndex
      let localPoint = new Vector3()
      let closestPoint = new Vector3()
      let edgeIndex = 0
      let minDistance = 1000    // ???

      localPoint.copy( intersections[0].point ) 
      this.mesh.worldToLocal(localPoint)

      let lines = [
        new Line(
          new Vector3().fromBufferAttribute(pos, faceIdx * 3 + 0),
          new Vector3().fromBufferAttribute(pos, faceIdx * 3 + 1)
        ),
        new Line(
          new Vector3().fromBufferAttribute(pos, faceIdx * 3 + 1),
          new Vector3().fromBufferAttribute(pos, faceIdx * 3 + 2)
        ),
        new Line(
          new Vector3().fromBufferAttribute(pos, faceIdx * 3 + 2),
          new Vector3().fromBufferAttribute(pos, faceIdx * 3 + 0)
        )
      ];

      for ( let i=0; i < 3; i++ ) {
        lines[i].closestPointToPoint( localPoint, true, closestPoint )
        let distance = localPoint.distanceTo(closestPoint)

        if ( distance < minDistance ) {
          minDistance = distance
          edgeIndex = i
        }
      }

      let lineStart = mesh.localToWorld( lines[edgeIndex].start ) 
      let lineEnd = mesh.localToWorld( lines[edgeIndex].end ) 

      lineBuffer.attributes.position.setXYZ( 0, lineStart.x, lineStart.y, lineStart.z )
      lineBuffer.attributes.position.setXYZ( 1, lineEnd.x, lineEnd.y, lineEnd.z ) 
      lineBuffer.attributes.position.needsUpdate = true

      line.visible = true

      console.log(line)

      // this depends on 1:1 mapping between three's faceIdx and ours
      // is this ensured in the import process?
      let selectedFace = this.halfEdgeMesh.faces[faceIndex]
      console.table(selectedFace)

      if ( this.multiSelect === true ) {
        this.selectedFaces.push( selectedFace ) 
      } else {
        // there's probably a slicker one-line way to do this...
        this.selectedFaces = []
        this.selectedFaces.push(selectedFace)
      }

    } else {
      line.visible = false
    }

  }

  selectVertex() {
    const intersections = this.raycaster.intersectObject(this.mesh)

    if ( intersections.length > 0 ) {

      let pos = intersections[0].geometry.attributes.position
      let point = intersections[0].point
      // for fun we're going to try to do this with a sprite
      // instead of a tri 
      //
      const clickSprite = new Sprite(spriteMaterial)
      
      clickSprite.position.set(point.x, point.y, point.z) 

      this.scene.add(clickSprite) 

      let face = intersections[0].face
      let faceIdx = intersections[0].faceIndex

      let ab = face.a.distanceTo(face.b)
      let ac = face.a.distanceTo(face.c)
      let bc = face.b.distanceTo(face.c)
      let lambda = Math.min(ab, ac, bc) - 0.1 // why 0.1

      if ( face.a.distanceTo(point) <= lambda ) { 
        let posA = new Vector3().fromBufferAttribute(pos, faceIdx * 3 + 0 )
        vertexSprite.position.copy( posA )
        this.scene.add(vertexSprite) 
      } 
      if ( face.b.distanceTo(point) <= lambda ) { 
        let posB = new Vector3().fromBufferAttribute(pos, faceIdx * 3 + 1 )
        vertexSprite.position.copy( posB )
        this.scene.add(vertexSprite) 

      }
      if ( face.c.distanceTo(point) <= lambda ) { 
        let posC = new Vector3().fromBufferAttribute(pos, faceIdx * 3 + 2 )
        vertexSprite.position.copy( posC )
        this.scene.add(vertexSprite) 

      }
      else { 
        console.log('this wasnt supposed to happen.  how did you get here')
      }
    }

  }

  //?!
  selectLoop() {

  }

}

export { Selector }
