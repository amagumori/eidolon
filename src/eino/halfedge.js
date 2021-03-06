import { ArrowHelper, Vector3 } from 'three';

class HalfEdgeMesh {

  constructor() {
    this.halfedges = []
    this.vertices = []
    this.vertexBuffer = []
    this.faces    = []
    this.edges    = []
    this.edgeDict    = {}
    this.boundaries = []
  }

  generateEdgeDict() {
    var edgeDict = this.edgeDict
    var len = this.faces.length

    for ( var i=0; i < len; i++ ) {
      var face = this.faces[i]
      // tri
      for ( var j=0; j < 3; j++ ) {
        var vert0 = face.vertices[j]
        var vert1 = face.vertices[ (j+1) % 3 ]

        var key0  = vert0 + "-" + vert1
        var key1  = vert1 + "-" + vert0

        if ( edgeDict[key0] === undefined && edgeDict[key1] === undefined ) {
          var e = new Edge()
          // ??
          e.index = this.edges.length
          this.edges.push(e)
          edgeDict[key0] = e;
          edgeDict[key1] = e;
        }
      }
    }
  }

  getEdge( index0, index1 ) {
    var map = this.edgeDict 
    var keys = this.getEdgeKeys( i0, i1 ) 

    if ( map[ keys[0] ] !== undefined &&
         map[ keys[1] ] !== undefined ) {
      return map[ keys[0] ]
    }
    return
  }

  getEdgeKey( index0, index1) {
    return index0 + '-' + index1
  }

  getEdgeKeys( index0, index1 ) {
    let key0 = index0 + '-' + index1 
    let key1 = index1 + '-' + index0

    return [ key0, key1 ] 
  }

  // BufferGeometry
  // triangle mesh only
  create( mesh ) {
    var faces = this.faces
    let vertAttrib = mesh.getAttribute('position')
    var vertices = vertAttrib.array

    for (let i=0; i < vertices.length; i+= 3) {
      var vertex = []
      vertex.push( vertices[i], vertices[i+1], vertices[i+2] )
      this.vertexBuffer.push(vertex)
    }

    var itemSize = vertAttrib.itemSize  // this has to be 3 lol
    var count    = vertAttrib.count

    var indices  = mesh.getIndex().array
    var indicesCount = indices.length

    for ( let i=0; i < vertices.length; i++ ) {
      var vertex = new Vertex()
      // storing only the index
      vertex.index = i
      this.vertices.push(vertex)
    }

    console.log('added vertex data')

    var faceCount = 0
    for ( let i=0; i < indicesCount; i+=3 ) {
      var face = new Face()
      let tri = []
      // storing vertex indices
      tri.push(indices[i], indices[i+1], indices[i+2])
      face.vertices = tri
      faceCount++
      faces.push(face)
    }

    /*
    for ( let i=0; i < tris; i++ ) {
      // store just the indices?
      var face = new Face()
      face.index = i
      faces.push(face)
    }
    */

    this.generateEdgeDict()

    console.log(JSON.stringify(this.edgeDict))

    //var faceCount = this.faces.length
    console.log('face count: ' + faceCount)

    for ( var faceIndex = 0; faceIndex < faceCount; faceIndex++ ) {
      var firstHe = undefined
      var prevHe  = undefined

      // tri
      for ( let index=0; index<3; index++ ) {
        var currentVertIndex = face.vertices[index]
        var nextVertIndex    = face.vertices[(index+1) % 3] 

        var edge =   this.edgeDict[currentVertIndex + '-' + nextVertIndex]
        var vertex = this.vertices[currentVertIndex]

        var halfedge = new HalfEdge()
        halfedge.vertex = vertex
        halfedge.edge = edge
        halfedge.face = this.faces[faceIndex]

        // setters!
        // i hope they can be called like this
        // otherwise what's the point

        if ( edge.halfedge ) {
          halfedge.twin = edge.halfedge
          edge.halfedge.twin = halfedge
        } else {
          edge.halfedge = halfedge
        }

        if ( prevHe !== undefined ) {
          prevHe.next = halfedge
        }

        prevHe = halfedge

        if (index === 0) firstHe = halfedge
        
        this.halfedges.push(halfedge)
        vertex.halfedge = halfedge
      }
      
      this.faces[faceIndex].halfedge = firstHe
      // connect the loop
      prevHe.next = firstHe;

    }

  }


  halfEdgeArrows( scene ) {

    let edgeKeys = Object.keys(this.edgeDict)
    let buffer  = this.vertexBuffer

    console.log('half-edge count: ' + edgeKeys.length)

    var vec0 = new Vector3()
    var vec1 = new Vector3()
    var len  = 0.0;

    for (let i=0; i < edgeKeys.length; i++ ) {
      let indices = edgeKeys[i].split("-").map(Number)
      let vert0 = buffer[indices[0]]
      let vert1 = buffer[indices[1]]

      vec0.set( vert0[0], vert0[1], vert0[2] )
      vec1.set( vert1[0], vert1[1], vert1[2] )

      len  = vec0.distanceTo(vec1)

      if ( len > 0.01 ) {

        vec0 = vec0.sub(vec1)
        const arrow = new ArrowHelper( vec0, vec1, len, 0x00ddee )
        scene.add(arrow)
      }

      /*
      vec0 = vec0.sub(vec1)

      vec0.normalize()

      const arrow = new ArrowHelper( vec0, vec1, 0.01, 0x00ddee )
      scene.add(arrow)
      */
    }
      
  }

}


class HalfEdge {
  constructor () {
    this.next = null;
    this.twin = null;
    this.vertex = undefined;
    this.edge   = undefined;
    this.face   = undefined;
  }

  get next() {
    return this._next
  }

  set next( he ) {
    this._next = he
  }

  get twin() {
    return this._twin
  }

  set twin( he ) {
    this._twin = he
  }

  get vertex() {
    return this._vertex
  }

  set vertex( v ) {
    this._vertex = v
  }

  get edge() {
    return this._edge
  }

  set edge( e ) {
    this._edge = e
  }

  get face() {
    return this._face
  }

  set face( f ) {
    this._face = f 
  }

  checkOnBoundary() {
    if ( this._twin ) return false;
    return true;
  }

}

// can these all be written with extends?

class Face {
  constructor() {
    this.halfedge = undefined
    this.index = -1
  }

  getHalfEdges() {
    var initialHalfEdge = he = this.halfedge
    var hes = []
    do { 
      hes.push(he)
      he = he.next
    } while ( he != initialHalfEdge ) 
    return hes
  }

  getVertices() {
    var initialHalfEdge = he = this.halfedge
    var verts = []
    do {
      verts.push( he.vertex )
      he = he.next
    } while ( he != initialHalfEdge )
    return verts
  }

  set index(i) {
    this._index = i
  }

  get index() {
    return this._index
  }

  set halfedge( he ) {
    this._halfedge = he
  }

  get halfedge() {
    return this._halfedge
  }

}

class Vertex { 
  constructor() {
    this.halfedge = undefined
    this.index = -1
  }

  get index () {
    return this._index
  }

  set index( i ) {
    this._index = i
  }

  get halfedge () {
    return this._halfedge
  }

  set halfedge( e ) {
    this._halfedge = e
  }


}

class Edge {
  constructor() {
    this.halfedge = undefined
    this.index = -1
  }

  getVertices() {
    var verts = []
    var he = this.halfedge
    verts.push( he.vertex )
    he = he.twin
    verts.push( he.vertex )
    return verts
  }

  get index () {
    return this._index
  }

  set index( i ) {
    this._index = i
  }

  get halfedge () {
    return this._halfedge
  }

  set halfedge( e ) {
    this._halfedge = e
  }
}


export { HalfEdgeMesh, HalfEdge, Face, Edge, Vertex }
