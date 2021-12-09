
const getFaceHalfEdges = function( face ) {
  var he = originalHalfEdge = face.getHalfEdge()
  var halfEdges = []

  while ( he != originalHalfEdge ) {
    halfEdges.push(he)
    he = he.next
  } 
  return halfEdges
}

const getEdgeVertices = function( edge ) {
  var verts = []
  var he = edge.getHalfEdge()
  verts.push( he.getVertex() )
  he = he.twin
  verts.push( he.getVertex() )
  return verts
}
