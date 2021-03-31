/*
 * @name Cross product
 * @description Demonstrating how to find the outwards pointing vector between two vectors.
 * @author Evan Raskob 2021 <e.raskob@gold.ac.uk> 
 * 
 */


let robotoFont; 

let cam; // p5js camera

let helixPoints = []; // successive points in a helix
let profilePoints = []; // successive points in a profile
let profilePointsMapped = [];

let upVec; // Z is "up" in this example, in - dir

let originIndex;

// origin of drawing
let originPoint;

// mouse coordinates translated to world coordinates (no perspective correction)
let nextPoint, nextNextPoint, nextNextNextPoint;

let originVec, nextVec, nextNextVec; // vectors at each point in the curve

let oNorm, oNorm2,nnNorm, nNorm0, nNorm00, nNorm2; // normal (outward) vectors for each point 

let circleProfilePoints = []; //

/**
 * Create points array for a helix curve 
 */
function createHelixPointsArray({numPointsPerTurn=6, turns=2.5, lengthPerTurn=400, radiusX=100, radiusY=100}) {
  let pointsArray = [];
  let originVec = createVector(0,0,-height/4);
  
  for (let i=0; i < numPointsPerTurn*turns; i++)
    {
      // Z is 'up'
      // theta = TWO_PI*i/numPointsPerTurn
      // pointX = rx*cos(theta)
      // pointY = rz*sin(theta)
      // point Z = originZ + lengthPerTurn*i/numPointsPerTurn
      
      let theta = TWO_PI*i/numPointsPerTurn;
      let px = radiusX * cos(theta);
      let py = radiusY * sin(theta);
      let pz = originVec.z + lengthPerTurn*i/numPointsPerTurn;
      
      pointsArray.push(createVector(px,py,pz) );
    }
  return pointsArray;
}


function createCircleProfilePoints(numPts) {
  let pointsArray = [];

  let x = 120;

  let i = numPts;
  const maxAngle = TWO_PI; 
  const inc = Math.PI/numPts; // the resolution of the curve (smaller = more detail)
  const offset = Math.PI/8; // smaller values ( < PI/2) curl shape CCW, larger values in CW direction
      // note: helix B uses offset of PI/3
  const curviness = 0.5; // how curvy/paisley-like the final shape is. 0 is circular, 0.5 is max before outline splits

  let x0=0, z0=0;

  // pointy on top v2 
  for (let angle=0; angle<maxAngle; angle+=inc)
  {
    let envelope = Math.abs(angle/(maxAngle/2) - 1); // -1 to 1
    let = Math.sin(envelope*Math.PI*curviness); // little pointy on top

    let xx = envelope*x;
    let curvinessMax = Math.sin(Math.PI*curviness);

    // let newx = (0.5*xx/curvinessMax*(Math.cos(angle+offset)+1));
    // let newz = (0.5*xx/curvinessMax*(Math.sin(angle+offset)+1)); 

    let newx = x*(Math.cos(angle+offset)+1)/2;
    let newz = x*(Math.sin(angle+offset)+1)/2; 

    // save first points to connect later
    if (angle == 0)
    {
      x0 = newx;
      z0 = newz;
    }
    pointsArray.push([newx, newz]);
  }
  pointsArray.push([x0, z0]);
  
  return pointsArray;  
}

///-----------------------------------------------
///--- setup
///-----------------------------------------------
function setup(){
  createCanvas(800,800,WEBGL);

  // Roboto Google font: https://fonts.google.com/specimen/Roboto?preview.text_type=custom&sidebar.open=true&selection.family=Roboto:wght@300

  robotoFont = loadFont('assets/Roboto-Bold.ttf');

  cam = createCamera();


  helixPoints = createHelixPointsArray({numPointsPerTurn:12, turns:1.5, lengthPerTurn:height/2.8, radiusX:width/3.5, radiusY:width/3.5});
  profilePoints = createCircleProfilePoints(10);


  upVec = createVector(0,0,1); // Z is "up" in this example, in - dir
  
  originIndex = 12;
  
  // origin of drawing
  originPoint = helixPoints[originIndex];
  
  // mouse coordinates translated to world coordinates (no perspective correction)
  nextPoint = helixPoints[originIndex+1];
  
  nextNextPoint = helixPoints[originIndex+2];
  nextNextNextPoint = helixPoints[originIndex+3];
  

  originVec = p5.Vector.sub(nextPoint, originPoint).normalize();
  nextVec = p5.Vector.sub(nextNextPoint, nextPoint).normalize();
  nextNextVec = p5.Vector.sub(nextNextNextPoint,nextNextPoint).normalize();
  
  oNorm = originVec.cross(upVec);
  nnNorm = nextNextVec.cross(upVec);
  
  oNorm2 = createVector(originVec.y+nextVec.y, -originVec.x-nextVec.x,0).normalize(); // 1.1% off


  nNorm0 = nextVec.cross(upVec).normalize();
  nNorm00 = p5.Vector.add(oNorm,nnNorm).normalize();
  console.log(p5.Vector.sub(nNorm00, nNorm0).mag()); // Check: SAME within tiny e-15 error
  
  // we use inwards facing vector (opposite x,y direction for 3rd point, towards 2d)
  // and explicitly calcuate cross product 
  nNorm2 = createVector(nextVec.y+nextNextVec.y, -nextVec.x-nextNextVec.x,0).normalize(); // 1.1% off
  console.log(p5.Vector.sub(nNorm2, nNorm0).mag()); // x,y off by about 13%

  // create 1 profile shape
  profilePointsMapped = profilePoints.map( p => {
    // float x1 = v0.x() + ppnC.y()*v1.x();  
    // float y1 = v0.y() + ppnC.y()*v1.y();
    // float z1 = v0.z() + ppnC.x();
    let x = nextPoint.x + p[1]*nNorm2.x;
    let y = nextPoint.y + p[1]*nNorm2.y;
    let z = nextPoint.z + p[0];
    return createVector(x,y,z);
  });

}


///-----------------------------------------------
///--- draw
///-----------------------------------------------

function draw() {
  background(240);
  textFont(robotoFont, 12);
  angleMode(RADIANS);
  
  cam.ortho(-width / 2, width / 2, height / 2, -height / 2, 0, 2*width);
  lights();
  
  rotateX(-PI/2); // z-up
  
  push();
  rotateX(PI/6);  

  rotateZ(PI/3 + PI/6*sin(PI*millis()*0.0001));
  translate(0,0,-height/4);



//--------------------------------------------
//----- drawing axes -------------------------
  push();
  translate(-width/2,0);
  drawArrow(createVector(width,0,0), color(220,220,0));
  pop();
  
  push();
  translate(0,-height/2,0);
  drawArrow(createVector(0,height,0), 'red');
  pop();
  
  push();
  translate(0,0,-width/2);
  drawArrow(createVector(0,0,width), 'blue');
  pop();
  
  stroke('purple');
  strokeWeight(10);
  //beginShape();
  helixPoints.map( p => {
    point(p);
  });
  //endShape();


//--------------------------------------------
//----- done drawing axes ---------------------


  
  fill(200);
  noStroke();
  ambientMaterial(200);  
  push();
  translate(originPoint);
  sphere(width/60);

  drawArrow(originVec.copy().setMag(width/24), 'red');
  drawArrow(oNorm.copy().setMag(width/6), 'green');
  drawArrow(createVector(0,0,width/6), 'blue');
  drawArrow(p5.Vector.mult(oNorm2,width/6), color(80,180,80));

  pop();
  

  push();
  translate(nextPoint);
  ambientMaterial(200);  

  sphere(width/60);
  drawArrow(nextVec.copy().mult(width/24), 'red');
  drawArrow(p5.Vector.mult(nNorm0,width/6), 'green');
  drawArrow(createVector(0,0,width/6), 'blue');
  drawArrow(p5.Vector.mult(nNorm2,width/6), color(80,180,80));
  pop();
  

  ambientMaterial(200);  
  push();
  translate(nextNextPoint);
  sphere(width/60);
  drawArrow(nnNorm.copy().setMag(width/6), 'green');
  drawArrow(createVector(0,0,width/6), 'blue');
  
  pop();


  ambientMaterial(120,120,200);
  noFill();
  stroke(120,120,200);
  strokeWeight(2);
  beginShape();
  profilePointsMapped.map(p => {
    vertex(p.x,p.y,p.z);
  });
  endShape();
  strokeWeight(8);
  profilePointsMapped.map(p => {
    // push();
    // translate(p);
    // sphere(width/200);
    // pop();
    point(p.x,p.y,p.z);
  });

  stroke(220,120,120);

// create 1 profile shape
let pp2 = profilePoints.map( p => {
  // float x1 = v0.x() + ppnC.y()*v1.x();  
  // float y1 = v0.y() + ppnC.y()*v1.y();
  // float z1 = v0.z() + ppnC.x();
  //push();
  let x = nextPoint.x + p[1]*nNorm0.x;
  let y = nextPoint.y + p[1]*nNorm0.y;
  let z = nextPoint.z + p[0];
  //translate(x,y,z);
  //sphere(width/200);
  //pop();
  point(x,y,z);
  return createVector(x,y,z);
});
strokeWeight(4);
beginShape();
pp2.map( p => {
  vertex(p.x,p.y,p.z);
});
endShape();


  pop();

  // some stats as text
  //noStroke();
  //fill('black');
  //text('magnitude set to: ' + nextVector.mag().toFixed(2), -width/4, -height/4);
  // the toFixed(places) function turn a number into text with the 
  // number of decimal places (2 in this case)
  
}

//
// draw an arrow for a vector at a given base position
// stolen from https://p5js.org/reference/#/p5.Vector/setMag
//
function drawArrow(vec, myColor) {
  let arrowSize = width/180;
  push();
  stroke(myColor);
  strokeWeight(3);
  fill(myColor);
  line(0, 0, 0, vec.x, vec.y, vec.z);
  
  translate(vec);
  //rotate(vec.heading());
  //translate(vec.mag() - arrowSize, 0);
  sphere(arrowSize);
  pop();
}