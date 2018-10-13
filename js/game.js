var game;
var srcPumpArray=["./img/001.png","./img/002.png","./img/003.png","./img/004.png","./img/005.png","./img/006.png","./img/007.png","./img/008.png"];

var flyingP= [];


function Game() {

  this.canvas= document.getElementById("canvas");
  this.ctx= canvas.getContext("2d");
  // this.score
  this.fps=60;
  
}

Game.prototype.generateDOM=function(){
  var displayArr=randomArray(srcPumpArray);
  crearScore();
  crearTablaDOM(displayArr);
}

Game.prototype.generatePumpkins=function(){
  for(i=0; i<srcPumpArray.length; i++){
    //genera X random de la calabaza
    var xRam = Math.floor(Math.random()*(850-50)+50);
    //genera la src random de la calabaza
    var iRam= Math.floor(Math.random()*7);
    var srcRam=srcPumpArray[iRam];
   
    flyingP.push(new ComponentPumpkin(this));
    flyingP[i].x=xRam;
    flyingP[i].img.src=srcRam;
    // console.log(flyingP[i].img.src);
    // console.log(game);
  }
  // se genera un array con las calabazas que van a caer en el canvas
}


Game.prototype.printPumpkin=function(i){
  flyingP[i].move();
  this.ctx.clearRect(0, 0, canvas.width, canvas.height);
  flyingP[i].draw();

}

Game.prototype.checkClick = function() {
  // si SRC DE DOM = SRC DE CANVAS -- SUMA PUNTO Y ELIMINA DE CANVAS
  // si NO -- resta VIDA y ELIMINA DE CANVAS 
}

Game.prototype.clear =function() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

Game.prototype.gameOver = function() {

}

// var lastTime = 0;
// var delta = 0;
// function update(time) {
//   delta = time - lastTime;
//   lastTime = time;
//   game.fps = 1000 / delta;
//   game.clear();
//   game.drawAll();
//   game.moveAll();
//   game.checkColisions();
//   game.id = requestAnimationFrame(update);
// }


