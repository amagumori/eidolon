import { ArrowHelper, Vector3 } from 'three';


class HalfEdgeMesh { 

  // takes a BufferGeometry
  constructor( inputMesh ) {

    this.faces = []
    this.edges = []

    if (inputMesh == null) console.log('no input mesh provided to halfEdge constructor.');
    if (inputMesh.type != 'BufferGeometry') console.log('incorrect mesh input type, not BufGeo')

    let vertAttrib = inputMesh.getAttribute('position')
    var vertices   = vertAttrib.array
    let itemSize   = vertAttrib.itemSize
    console.log('itemSize: ' + itemSize)
    var count = vertAttrib.count

    var indices = inputMesh.getIndex().array
    /*console.log('indices: ' + indices)
    console.log('vertices: ' + vertices)
    console.log('count: ' + count) */
    var indicesLen = indices.length
    console.log('indiceslen: ' + indicesLen)
    // vertices are CCW 
    //for (let i=0; i < count; i+= itemSize) {
    for (let i=0; i < indicesLen; i+= itemSize) {

      // this sucks, man.
      let index  = indices[i]
      let index2 = indices[i+1]
      let index3 = indices[i+2]
      let v0 = new Vector3( vertices[index], vertices[index+1], vertices[index+2] )
      let v1 = new Vector3( vertices[index2], vertices[index2+1], vertices[index2+2] )
      let v2 = new Vector3( vertices[index3], vertices[index3+1], vertices[index3+2] )

      var face = new Face()
      face.create( v0, v1, v2 ) 

      //console.log('created face data: ' + JSON.stringify(face))
      /*for (let j=0; j < 3; j++ ) {
        console.log('face halfedges: ' + JSON.stringify(face.getEdge() ))
      }*/

      this.faces.push(face)
    }

    console.table(this.faces[0])

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

  halfEdgeArrows() {
    const arrowArray = []
    for (var edge of edges) {
      let origin = edge.tail()
      let vec = edge.head().sub(origin)
      vec.normalize()
      const arrow = new ArrowHelper( vec, origin, 1, 0xdd0000 )
      arrowArray.push(arrow)
    }
    return arrowArray
  }
  
  /*
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
  */

  // TODO https://github.com/mrdoob/three.js/blob/master/examples/jsm/math/ConvexHull.js#L593 ??
}

// Entity for a Doubly-Connected Edge List (DCEL).

class HalfEdge {


	constructor( vertex, face ) {

		this.vertex = vertex;
		this.prev = null;
		this.next = null;
		this.twin = null;
		this.face = face;

	}

	head() {

		return this.vertex;

	}

	tail() {

		return this.prev ? this.prev.vertex : null;

	}

	length() {

		const head = this.head();
		const tail = this.tail();

		if ( tail !== null ) {

			return tail.point.distanceTo( head.point );

		}

		return - 1;

	}

	lengthSquared() {

		const head = this.head();
		const tail = this.tail();

		if ( tail !== null ) {

			return tail.point.distanceToSquared( head.point );

		}

		return - 1;

	}

	setTwin( edge ) {

		this.twin = edge;
		edge.twin = this;

		return this;

	}

}


class Face {

	constructor() {

		this.normal = new Vector3();
		this.midpoint = new Vector3();
		this.area = 0;

		this.constant = 0; // signed distance from face to the origin
		this.outside = null; // reference to a vertex in a vertex list this face can see
		//this.mark = Visible;
		this.edge = null;

	}

	create( a, b, c ) {

		const face = new Face();

		const e0 = new HalfEdge( a, face );
		const e1 = new HalfEdge( b, face );
		const e2 = new HalfEdge( c, face );

		// join edges

		e0.next = e2.prev = e1;
		e1.next = e0.prev = e2;
		e2.next = e1.prev = e0;

		// main half edge reference

		face.edge = e0;

    //console.log( "bepp: " + console.table(e0))

		return face.compute();

	}

	getEdge( i ) {

		let edge = this.edge;

		while ( i > 0 ) {

			edge = edge.next;
			i --;

		}

		while ( i < 0 ) {

			edge = edge.prev;
			i ++;

		}

		return edge;

	}

	compute() {

		const a = this.edge.tail();
		const b = this.edge.head();
		const c = this.edge.next.head();

    
		_triangle.set( a.point, b.point, c.point );

		_triangle.getNormal( this.normal );
		_triangle.getMidpoint( this.midpoint );
		this.area = _triangle.getArea();
    
		this.constant = this.normal.dot( this.midpoint );

		return this;

	}

	distanceToPoint( point ) {

		return this.normal.dot( point ) - this.constant;

	}

}

// A vertex as a double linked list node.

class VertexNode {

	constructor( point ) {

		this.point = point;
		this.prev = null;
		this.next = null;
		this.face = null; // the face that is able to see this vertex

	}

}

// A double linked list that contains vertex nodes.

class VertexList {

	constructor() {

		this.head = null;
		this.tail = null;

	}

	first() {

		return this.head;

	}

	last() {

		return this.tail;

	}

	clear() {

		this.head = this.tail = null;

		return this;

	}

	// Inserts a vertex before the target vertex

	insertBefore( target, vertex ) {

		vertex.prev = target.prev;
		vertex.next = target;

		if ( vertex.prev === null ) {

			this.head = vertex;

		} else {

			vertex.prev.next = vertex;

		}

		target.prev = vertex;

		return this;

	}

	// Inserts a vertex after the target vertex

	insertAfter( target, vertex ) {

		vertex.prev = target;
		vertex.next = target.next;

		if ( vertex.next === null ) {

			this.tail = vertex;

		} else {

			vertex.next.prev = vertex;

		}

		target.next = vertex;

		return this;

	}

	// Appends a vertex to the end of the linked list

	append( vertex ) {

		if ( this.head === null ) {

			this.head = vertex;

		} else {

			this.tail.next = vertex;

		}

		vertex.prev = this.tail;
		vertex.next = null; // the tail has no subsequent vertex

		this.tail = vertex;

		return this;

	}

	// Appends a chain of vertices where 'vertex' is the head.

	appendChain( vertex ) {

		if ( this.head === null ) {

			this.head = vertex;

		} else {

			this.tail.next = vertex;

		}

		vertex.prev = this.tail;

		// ensure that the 'tail' reference points to the last vertex of the chain

		while ( vertex.next !== null ) {

			vertex = vertex.next;

		}

		this.tail = vertex;

		return this;

	}

	// Removes a vertex from the linked list

	remove( vertex ) {

		if ( vertex.prev === null ) {

			this.head = vertex.next;

		} else {

			vertex.prev.next = vertex.next;

		}

		if ( vertex.next === null ) {

			this.tail = vertex.prev;

		} else {

			vertex.next.prev = vertex.prev;

		}

		return this;

	}

	// Removes a list of vertices whose 'head' is 'a' and whose 'tail' is b

	removeSubList( a, b ) {

		if ( a.prev === null ) {

			this.head = b.next;

		} else {

			a.prev.next = b.next;

		}

		if ( b.next === null ) {

			this.tail = a.prev;

		} else {

			b.next.prev = a.prev;

		}

		return this;

	}

	isEmpty() {

		return this.head === null;

	}

}



export { HalfEdgeMesh };
