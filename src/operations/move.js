import { Vector3 } from 'three'

const move = function( mesh, moveVec ) {
  var vec = new Vector3( 0.0, 0.0, 0.0 )
  let positions = mesh.vertexBuffer
  var vLen = positions.length
  for ( let i=0; i < vLen; i++ ) {
    var pos = positions[i]
    pos.subtract( moveVec ) 
  }
}

export { move } 
