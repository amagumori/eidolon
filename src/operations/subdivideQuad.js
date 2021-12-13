import { Vector3 } from 'three'

import { insertVertex, insertEdge } from './insert.js'

//@TODO 
// vertexNeighbors
// insertVertex
// insertEdge


const subdivideQuad = function( mesh ) {
  var edges = mesh.edges
  var elen = edges.length
  var edgeVertices = {}

  for ( let i=0; i < elen; i++ ) {
    var e = edges[i]
    insertVertex( mesh, e.index ) 
  }

  var faces = mesh.faces
  var flen = faces.length
  for ( let i=0; i < flen; i++ ) {
    var face = faces[i]
    edgeVertices[ face.index ] = []

    var vertices = face.getVertices
    var vlen = vertices.length

    for ( let j=0; j < vlen; j++ ) {
      var vertex = vertices[j]
      var neighboringVerts = vertexNeighbors( vertex )
      if ( neighboringVerts.length == 2 ) {
        edgeVertices[ face.index ].push( vertex )
      }
    }
  }

  var keys = Object.keys(edgeVertices)

  for ( let i=0; i < keys.length; i++ ) {

    var faceIndex = keys[i]
    var vertices = edgeVertices[ faceIndex ]
    var v0 = vertices[0]
    var v1 = vertices[1]
    var v2 = vertices[2]
    var v3 = vertices[3]

    var res = insertEdge( mesh, v0.index, v2.index )
    var cv = insertVertex( mesh, res.edge.index )
    edgeVertices[ faceIndex ].push( cv ) 
    insertEdge( mesh, v1.index, cv.index )
    insertEdge( mesh, v3.index, cv.index )

  }
}
