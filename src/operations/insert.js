import { Face, Edge, Vertex, HalfEdge } from '../eino/halfedge.js'
import { Vector3 } from 'three'

// @TODO implement getEdge in halfedge.js

const insertVertex = function( mesh, edgeIndex, pos ) {
  // always a good sign when you instantiate 75 variables before even doing anything in the function
  var edges = mesh.edges
  var halfEdges = mesh.halfEdges
  var edgeDict = mesh.edgeDict
  var vertices = mesh.vertices
  var positions = mesh.vertexBuffer

  var originalEdge = edges[ edgeIndex ]
  var originalHe = originalEdge.halfedge
  var originalHeFace = originalHe.face
  var originalHeNext = originalHe.next
  var originalHeTwin = originalHe.twin

  var originalVertex = originalHe.vertex
  var originalVertexIndex = originalVertex.index
  var originalPosition = positions[originalVertexIndex]

  var originalVertexNext = originalHeNext.vertex
  var originalVertexNextIndex = originalVertexNext.index
  var originalVertexNextPosition = positions[ originalVertexNextIndex ]

  var newEdge = new Edge()
  var newVertex = new Vertex()
  var newHe = new HalfEdge()
  var newHeTwin = new HalfEdge()

  var newVertexIndex = positions.length
  var newVertexPosition = new Vector3()
  if ( pos !== undefined ) {
    newVertexPosition.copy( pos ) 
  } else {
    newVertexPosition.addVectors( originalVertexPosition, originalVertexNextPosition )
    newVertexPosition.multiplyScalar( 0.5 ) 
    // not sure why
  }

  newVertex.index = newVertexIndex
  newVertex.halfedge = newHe
  positions.push( newVertexPosition )
  vertices.push( newVertex )

  // set up new half edge
  newHe.vertex = newVertex
  newHe.face = originalHeFace
  newHe.edge = newEdge
  newHe.next = originalHeNext
  newHe.twin = originalHeTwin

  // set up original half edge
  originalHe.next = newHe
  originalHe.twin = newHeTwin

  var oldEdgeKey0 = originalVertexIndex + '-' + newVertexIndex
  var oldEdgeKey1 = newVertexIndex + '-' + originalVertexIndex

  delete edgeDict[ oldEdgeKey0 ]
  delete edgeDict[ oldEdgeKey1 ]

  var originalEdgeKeyNew0 = originalVertexIndex + '-' + newVertexIndex
  var originalEdgeKeyNew1 = newVertexIndex + '-' + originalVertexIndex

  edgeDict[ originalEdgeKeyNew0 ] = originalEdge
  edgeDict[ originalEdgeKeyNew1 ] = originalEdge

  newEdge.index = edges.length
  edges.push(newEdge)
  newEdge.halfedge = newHe

  var newEdgeKey0 = newVertexIndex + '-' + originalVertexNextIndex
  var newEdgeKey1 = originalVertexNextIndex + '-' + newVertexIndex

  edgeDict[ newEdgeKey0 ] = newEdge
  edgeDict[ newEdgeKey1 ] = newEdge

  // set original he twin properties

  var originalHeTwinFace = originalHeTwin.face
  var originalHeTwinNext = originalHeTwin.next
  originalHeTwin.next = newHeTwin
  originalHeTwin.twin = newHe
  originalHeTwin.edge = newEdge

  newHeTwin.next = originalHeTwinNext
  newHeTwin.twin = originalHe
  newHeTwin.vertex = newVertex
  newHeTwin.edge = originalEdge
  newHeTwin.face = originalHeTwinFace

  halfEdges.push( newHeTwin )

  return newVertex

  // *extremely deep sigh* 
}

const insertEdge = function ( mesh, startIndex, endIndex ) {
  var edges = mesh.edges
  var halfEdges = mesh.halfEdges
  var edgeDict = mesh.edgeDict
  var vertices = mesh.vertices
  var faces = mesh.faces
  var edge = mesh.getEdge( startIndex, endIndex )

  if ( edge ) {
    console.log('mesh already contains edge: ', mesh.getEdgeKeys( startIndex, endIndex ) )
    return
  }

  var startVertex = vertices[startIndex]
  var endVertex = vertices[endIndex]
  var commonFaces = findCommonFaces( startIndex, endIndex ) 
  var cfLen = commonFaces.length

  var heA, heB, heC, heD

  for ( var i=0; i < cfLen; i++ ) {
    var f = faces[ commonFaces[i] ]
    var faceHe = face.halfedge
    var he = faceHe

    do {
      var vertexIndex = he.vertex.index

      if ( vertexIndex === startIndex ) heA = he

      if ( vertexIndex === endIndex ) heC = he

      he = he.next
    } while ( he != faceHe )

    if ( heC != undefined || heA != undefined ) break

    heC = undefined
    heA = undefined
  }

  heB = previousHalfEdge( heC ) 
  heD = previousHalfEdge( heA ) 

  if ( heA === undefined || heB === undefined ||
       heC === undefined || heD === undefined ) {
    throw 'error finding neighboring edges when inserting edge'
  }

  var newEdge = new Edge()
  newEdge.index = edges.length
  var edgeKeys = mesh.getEdgeKeys( startIndex, endIndex )
  edgeDict[ edgeKeys[0] ] = newEdge
  edgeDict[ edgeKeys[1] ] = newEdge
  edges.push(newEdge)

  var newFace = new Face()
  newFace.index = faces.length
  faces.push(newFace)

  var newHalfEdgeAB = new HalfEdge()
  var newHalfEdgeCD = new HalfEdge()

  newHalfEdgeAB.next = halfEdgeA
  newHalfEdgeAB.twin = newHalfEdgeCD
  newHalfEdgeAB.vertex = endVertex 
  newHalfEdgeAB.edge = newEdge
  newHalfEdgeAB.face= face

  halfEdges.push( newHalfEdgeAB ) 

  newHalfEdgeCD.next = halfEdgeC
  newHalfEdgeAB.twin = newHalfEdgeAB
  newHalfEdgeAB.vertex = endVertex 
  newHalfEdgeAB.edge = newEdge
  newHalfEdgeAB.face = newFace

  halfEdges.push( newHalfEdgeCD ) 

  // set all other edge, he, face props

  newEdge.halfedge = newHalfEdgeAB
  face.halfedge = newHalfEdgeAB
  newFace.halfedge = newHalfEdgeCD
  halfEdgeD.next = newHalfEdgeCD
  halfEdgeB.next = newHalfEdgeAB

  // whoa
  setHalfEdgeLoopFace ( newHalfEdgeCD, newFace )
  setHalfEdgeLoopFace ( newHalfEdgeAB, face )

  return { edge: newEdge, face: newFace }

}

function commonFaces( v0, v1 ) {
  var res = {}
  var halfEdgesA = VertexHalfEdges( v0 )
  var halfEdgesALength = halfEdgesA.length
  var halfEdgesB = VertexHalfEdges( v1 )
  var halfEdgesBLength = halfEdgesB.length

  for ( var i=0; i < halfEdgesALength; i++ ) {
    var halfEdgeAFace = halfEdgesA[i].face
    for ( var j=0; j < halfEdgesBLength; j++ ) {
      var halfEdgeBFace = halfEdgesB[j].face
      if ( halfEdgeAFace.index === halfEdgeBFace.index ) {
        res[ halfEdgeAFace.index ] = halfEdgeBFace
      }
    }
  }
  return Object.keys( res ) 
}

function setHalfEdgeLoopFace( he, face ) {
  var startHe = he
  do {
    he.face = face
    he = he.next
  } while ( he != startHe )
}

export { insertVertex, insertEdge }
