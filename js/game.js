var game;
var srcPumpArray=["./img/001.png","./img/002.png","./img/003.png","./img/004.png","./img/005.png","./img/006.png","./img/007.png","./img/008.png"];



function Game() {
  this.canvas= document.getElementById("canvas");
  this.ctx= this.canvas.getContext("2d");

  //array con calabazas
  this.flyingP= [];
  // indice de la calabaza que se muestra en canvas
  this.i=0;

  //datos iniciales de vida y puntos
  this.life=3;
  this.points=0;


  this.outCanvas=false;
}

Game.prototype.start=function(){
  var that=this;
  var r=that.i;
      that.interval = setInterval(function(){
      that.flyingP[r].move();
      that.ctx.clearRect(0, 0, that.canvas.width, that.canvas.height);
      that.flyingP[r].draw();
      
      //SOLUCION CUANDO LA CALABAZA PASA POR EL CANVAS SIN CLICK - RESTA VIDA
      if(that.flyingP[r].y>that.canvas.height){
        clearInterval(that.interval);
        that.life--;
        document.getElementById("lifeTxt").innerText=that.life;
        that.flyingP.splice(r,1);
        that.outCanvas=true;
        if(that.life<=0){
          that.gameOver();
        } else {
          that.replay();
        } 
      }
      
    },10);
}

Game.prototype.replay=function(){
  if(this.outCanvas==true){
    this.i = Math.floor(Math.random()*(this.flyingP.length));
    this.start();
  }
}

Game.prototype.checkImg=function(imgDOM){
  var r=this.i;
  if(imgDOM==this.flyingP[r].id){
    this.points++;
    if(this.points>=8){
      this.youWin();
    } else {
      document.getElementById("scoreTxt").innerText=this.points;
      this.flyingP.splice(r,1);
      this.i = Math.floor(Math.random()*(this.flyingP.length));
      this.start();
    }
    
  } else {
    this.life--;
      if(this.life<=0){
        this.gameOver();
      } else {
        document.getElementById("lifeTxt").innerText=this.life;
        this.flyingP.splice(r,1);
        this.i = Math.floor(Math.random()*(this.flyingP.length));
        this.start();
    } 
  }

}

Game.prototype.generateDOM=function(){
  var displayArr=randomArray(srcPumpArray);
  crearTablaDOM(displayArr);
  document.getElementById("scoreTxt").innerText=0;
  document.getElementById("lifeTxt").innerText=3;
}

Game.prototype.generatePumpkins=function(){
  for(i=0; i<srcPumpArray.length; i++){
    //genera X random de la calabaza
    var xRam = Math.floor(Math.random()*(800-100)+100);
    //genera la src random de la calabaza
    var iRam= Math.floor(Math.random()*7);
    var srcRam=srcPumpArray[iRam];
   
    this.flyingP.push(new ComponentPumpkin(this));
    this.flyingP[i].x=xRam;
    this.flyingP[i].img.src=srcRam;
    this.flyingP[i].id=srcRam;
  
  }
}

Game.prototype.gameOver = function() {
  console.log("pierde");
  this.ctx.font = "150px 'Creepster'";
  this.ctx.fillStyle = "white";
  this.ctx.textAlign = "center";
  this.ctx.fillText("Game Over", this.canvas.width/2, this.canvas.height/2); 
}

Game.prototype.youWin = function() {
  console.log("gana");
  this.ctx.font = "150px 'Creepster'";
  this.ctx.fillStyle = "white";
  this.ctx.textAlign = "center";
  this.ctx.fillText("You Win!!", this.canvas.width/2, this.canvas.height/2); 
}

function randomArray(arr){
  var m = arr.length, t, i;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = arr[m];
    arr[m] = arr[i];
    arr[i] = t;
  }
  return arr;
}


function crearTablaDOM(arr){
  for (i=0; i < arr.length; i++) {
    var img=document.getElementById("item"+i);
    img.src=arr[i];
  }
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


