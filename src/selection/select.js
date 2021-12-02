import { Vector2, Vector3, Raycaster } from 'three'

// https://discourse.threejs.org/t/raycaster-inaccurate-when-objects-have-linesegments/15919


// for intersection testing
const EPSILON = 0.001

class Selection {

}

class Selector {
  constructor(camera, raycaster) {
    console.log('constructed a selector')
    this.selection = []
    this.raycaster = raycaster
    this.camera = camera
  }

  pick( type, event, window, target ) {
    
    console.log('pick')

    var mouseCoord = new Vector2()
    mouseCoord.x = ( event.clientX / window.innerWidth ) * 2 - 1
    mouseCoord.y = - ( event.clientY / window.innerHeight ) * 2 + 1

    this.raycaster.setFromCamera( mouseCoord, this.camera )
    const intersects = this.raycaster.intersectObjects( target )

    if ( type === 'point' ) {
      for (let i=0; i < intersects.length; i++ ) {
        console.log('intersection ' + i + ':')
        console.table(intersects[i])
        intersects[i].object.material.color.set( 0x00eeee ) 
      }
    }

    if ( type === 'edge' ) {
      console.log('intersection ' + i + ':')
      console.table(intersects[i])
      for (let i=0; i < intersects.length; i++ ) {
        intersects[i].object.material.color.set( 0x00eeee ) 
      }

    }

    if ( type === 'face' ) {
      console.log('intersection ' + i + ':')
      console.table(intersects[i])
      for (let i=0; i < intersects.length; i++ ) {
        intersects[i].object.material.color.set( 0x00eeee ) 
      }
    }

    if ( res.length > 0 ) {
      // do something to pick the closest intersection
      // how do u set epsilon of the intersection anyway
      // this pushes the selection AND everything behind it ...?
      this.selection.push(res)
    }


  }

  // lets start here.
  //
  selectFace() {
    this.pick()
    if ( this.selection[0] != undefined ) {
      
    }
  }

  
  selectEdge( event, camera, target ) {
    this.pick()
  }
  

  selectVertex() {

  }

  selectFace() {

  }

  //?!
  selectLoop() {

  }

}

export { Selector }
