import { HalfEdge, BufferGeometry } from 'three';

export default class HalfEdgeMesh extends HalfEdge {

  faces = []
  edges = []

  // takes a BufferGeometry
  constructor( inputMesh ) {
    if (inputMesh == null) console.log('no input mesh provided to halfEdge constructor.');

    var verts = inputMesh.getAttribute('vertices').array
    var len   = verts.length

    var indices = inputMesh.getAttribute('indices').array
    var indicesLen = indices.length

    // vertices are CCW 
    for (let i=0; i < indicesLen; i+= 3) {
      
      var face = new Face()
      face.create( verts[indices[i]], 
                   verts[indices[i+1]],
                   verts[indices[i+2]])

      this.faces.push(face)
    }

    // this might be the dumbest thing i've ever written.
    // there has to be a better way.
    // i mean come on.
    // search the whole face array for each fuckin edge?
    //
    for (let i=0; i < this.faces.length; i++) {
      for (let j=0; j < 3; j++) {
        var edge = this.faces[i].getEdge(j)
        var edgeStart = edge.prev
        var edgeEnd   = edge.next
        for (let k=0; k < this.faces.length; k++) {
          for (let l=0; l<3; l++) {
            candidateEdge = this.faces[k].getEdge(l)

            if ( candidateEdge.prev == edgeEnd && candidateEdge.next == edgeStart ) {
              edge.setTwin(candidateEdge)
              candidateEdge.setTwin(edge)
            }
          }
        }
      }
    }

    // push the connected halfEdges to an unsorted array.
    this.faces.forEach( (face) => {
      for (let i=0; i < 3; i++) {
        this.edges.push( face[i] ) 
      }
    })

  }

  getSameEdge (v1, v2) {
  
  }

  getSameFace(edge, vertex) {
    var face0 = edge.face
    var face1 = 
  }

  bevelEdge () {

  }

  bevelFace () {

  }


  // TODO https://github.com/mrdoob/three.js/blob/master/examples/jsm/math/ConvexHull.js#L593 ??
}
