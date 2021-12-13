import { Vector3, Quaternion } from 'three'
import { Vertex, Edge, Face, HalfEdge } from '../eino/halfedge.js'

const zAxis = new Vector3(0.0, 0.0, 1.0)

const extrude = function( mesh, faceIdx, distance, scale ) {
  var verts = mesh.vertices
  var halfEdges = mesh.halfedges
  var edges = mesh.edges
  var edgeDict = mesh.edgeDict
  var faces = mesh.faces
  var positions = mesh.vertexBuffer

  var originalFace = faces[faceIdx]
  var faceHalfEdges = originalFace.getHalfEdges()
  var heCount = faceHalfEdges.len
  var originalVerts = []

  for ( let i=0; i < heCount; i++ ) {
    var he = faceHalfEdges[i]
    var vert = he.vertex
    var vertIdx = vert.index
    originalVerts.push(vert)
  }

  var vertCount = originalVerts.length
  var index0 = positions[ originalVerts[0].index ]
  var index1 = positions[ originalVerts[1].index ]
  var index2 = positions[ originalVerts[2].index ]

  // get normal
  let normal = new Vector3(0,0,0)
  let tri = new Vector3(index0, index1, index2)
  vec.cross(vec, tri)
  vec.normalize()

  var faceOrientation = new Quaternion()
  faceOrientation.setFromUnitVectors(normal, zAxis)

  var resultVertices = []
  var polygon = []
  var indices = []
  var zOffset = 0.0

  for ( let i=0; i < vertCount; i++ ) {
    var vertex = originalVerts[i]
    var index  = vertex.index
    // check how we're storing position verts
    var vertexPosition = new Vector3( positions[index][0], positions[index][1], positions[index][2] ) 
    vertexPosition.applyQuaternion( faceOrientation )
    zOffset = vertexPosition.z
    polygon.push( [ vertexPosition[0], vertexPosition[1] ] )
    indices.push(index)
    resultVertices.push( new Vertex() )
  }

  faceOrientation.setFromUnitVectors(zAxis, normal)
  //@TODO implement
  // var results = expandPolygon( polygon, - ( scale ? scale : 0.00001 ) )
  //
  var resultsLength = results.length
  var newPositions = []
  var newEdges = []
  var newHalfEdges = []

  zOffset += ( distance != undefined ? distance : 0.0 )

  for ( let i=0; i < resultsLength; i++ ) {
    var pos = results[i]
    var vpos = new Vector3( pos[0], pos[1], zOffset ) 
    vpos.applyQuaternion(faceOrientation)

    newPositions.push(vpos)
    var vertex = resultVertices[i]
    vertex.index = positions.length
    positions.push(vpos)
    verts.push(vertex)
  }

  // last half edge face ? ?
  var lhe, lhef = undefined

  for ( let i=0; i < resultsLength; i++ ) {
    var f = originalFace
    var v = resultVertices[i]
    var vn = resultVertices[ (i+1) % resultsLength ]

    var e = new Edge()
    var he = new HalfEdge()
    var heFlip = new HalfEdge()
    
    he.twin = heFlip
    he.edge = e
    he.vertex = vn
    he.face = f
    halfEdges.push(he)

    hef.twin = he
    hef.edge = e
    hef.vertex = vn
    halfEdges.push(hef)

    e.index = edges.length
    e.halfedge = he
    edges.push(e)

    var keys = mesh.getEdgeKeys( v.index, vn.index ) 
    edgeDict[ keys[0] ] = e
    edgeDict[ keys[1] ] = e
    
    v.halfedge = he
    newEdges.push(e)
    newHalfEdges.push(he)

    if ( lhe ) {
      lhe.next = he
      hef.next = lhef
    }
    lhe = he
    lhef = hef
  }

  var he = newHalfEdges[0]
  var heFlip = he.twin
  lhe.next = he
  hef.next = lhef
  originalFace.halfedge = he

  var newFaces = []
  var holeHalfEdges = []
  var lf = undefined
  var lhe = undefined

  for ( let i=0; i < resultsLength; i++ ) {
    var v = resultVertices[i]
    var vo = originalVerts[i]
    var heo = v.halfedge
    var heof = heo.twin

    var ofhe = faceHalfEdges[i]
    var li = i - 1
    li = li < 0 ? resultsLength + li : li

    var ofhep = faceHalfEdges[ li ]

    var f = new Face()
    var e = new Edge()
    var he = new HalfEdge()
    var hef = new HalfEdge()

    he.twin = hef
    he.next = ofhe
    he.edge = e
    he.vertex = v
    he.face = f

    hef.twin = he
    hef.next = heof.next
    hef.edge = e
    hef.vertex = vo
    hef.face = lf

    e.index = edges.length
    edges.push(e)
    e.halfedge = he

    f.index = faces.length
    f.halfedge = he
    faces.push(f)
    newFaces.push(f)

    vo.halfedge = hef

    heof.next = he
    heof.face = f 
    ofhe.face = f 
    ofhep.next = hef

    holeHalfEdges.push(he)
    lf = f

  }

  var he = holeHalfEdges[0]
  var hef = he.twin
  hef.face = newFaces[ newFaces.length-1 ] 

  return originalFace
}

// jesus christ

function createFace( mesh, vertices, face ) {
  var edgeDict = mesh.edgeDict
  var faces = mesh.faces
  var halfEdges = mesh.halfEdges
  var edges = mesh.edges

  if ( !face ) {
    face = new Face()
    face.index = faces.length
  }

  var verticesLen = vertices.length
  
  var lhe     // last halfedge
  var hes = []

  for ( let i=0; i < verticesLen; i++ ) {
    var v0 = vertices[i]
    var v1 = vertices[ (i+1) % verticesLen ]
    var i0 = v0.index
    var i1 = v1.index

    var he = new HalfEdge()
    var edge = mesh.getEdge( i0, i1 )

    if ( edge ) {
      var het = edge.halfedge
      var hetv = het.vertex
      if ( het == v0 ) { 
        he = het
      } else {
        he.twin = het
        het.twin = he
      }
    } else {
      edge = new Edge()
      var edgeKeys = mesh.getEdgeKeys( i0, i1 )
      edge.index = edges.length
      edges.push(edge)
      edge.halfedge = he
      edgeDict[ edgeKeys[0] ] = edge
      edgeDict[ edgeKeys[1] ] = edge
    }

    he.edge = edge
    he.face = face
    he.vertex = v0
    if ( lhe ) lhe.next = he
    hes.push(he)
    lhe = he
    halfEdges.push( he ) 
  }
  face.halfedge = lhe
  lhe.next = hes[0]
  return face
}

export { extrude, createFace }
