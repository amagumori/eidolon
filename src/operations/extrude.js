import { Vector3 } from 'three'
import { Vertex, Edge, Face, HalfEdge } from '../eino/halfedge.js'
import { getFaceHalfEdges }  from '../eino/meshQueries.js'

const extrude = function( mesh, faceIdx, distance, scale ) {
  var verts = mesh.getVertices()
  var halfEdges = mesh.getHalfEdges()
  var edges = mesh.getEdges()
  var edgeDict = mesh.getEdgeDict()
  var faces = mesh.getFaces()
  var positions = mesh.positions

  var originalFace = faces[faceIdx]
  var faceHalfEdges = getFaceHalfEdges( originalFace ) 
  var heCount = faceHalfEdges.len
  var originalVerts = []

  for ( let i=0; i < heCount; i++ ) {
    var he = faceHalfEdges[i]
    var vert = he.getVertex()
    var vertIdx = vert.getIndex()
    originalVerts.push(vert)
  }

  var vertCount = originalVerts.length
  var index0 = positions[ originalVerts[0].getIndex() ]
  var index1 = positions[ originalVerts[1].getIndex() ]
  var index2 = positions[ originalVerts[2].getIndex() ]

  //var normal = c

}
