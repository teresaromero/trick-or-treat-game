var game;
var srcPumpArray=["./img/001.png","./img/002.png","./img/003.png","./img/004.png","./img/005.png","./img/006.png","./img/007.png","./img/008.png"];



function Game() {
  this.canvas= document.getElementById("canvas");
  this.ctx= this.canvas.getContext("2d");

  //datos iniciales de puntos y vidas
  this.life=3;
  this.points=0;


  this.outCanvas=false;
}

Game.prototype.start=function(){
  var that=this;
      that.interval = setInterval(function(){
      that.flyingP.move();
      that.ctx.clearRect(0, 0, that.canvas.width, that.canvas.height);
      that.flyingP.draw();
      
      //SOLUCION CUANDO LA CALABAZA PASA POR EL CANVAS SIN CLICK - RESTA VIDA
      if(that.flyingP.y>that.canvas.height){
        that.life--;
        document.getElementById("lifeTxt").innerText=that.life;
        if(that.life<=0){
          clearInterval(that.interval);
          that.gameOver();
        } else {
          clearInterval(that.interval);
          that.generatePumpkin();
          that.start();
        } 
      }
      
    },30);
}


Game.prototype.checkImg=function(imgDOM){
  if(imgDOM==this.flyingP.id){
    this.points++;
    clearInterval(this.interval);
    if(this.points>=8){
      document.getElementById("scoreTxt").innerText=this.points;
      this.youWin();
    } else {
      document.getElementById("scoreTxt").innerText=this.points;
      this.generatePumpkin();
      this.start();
    }
    
  } else {
    this.life--;
    clearInterval(this.interval);
      if(this.life<=0){
        document.getElementById("lifeTxt").innerText=this.life;
        this.gameOver();
      } else {
        document.getElementById("lifeTxt").innerText=this.life;
        this.generatePumpkin();
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

Game.prototype.generatePumpkin=function(){

    //genera X random de la calabaza
    var xRam = Math.floor(Math.random()*(800-100)+100);
    //genera la src random de la calabaza
    var iRam= Math.floor(Math.random()*7);
    var srcRam=srcPumpArray[iRam];
   //genera calabaza que aparece en canvas
    this.flyingP=new ComponentPumpkin(this);
    this.flyingP.x=xRam;
    this.flyingP.img.src=srcRam;
    this.flyingP.id=srcRam;

}

Game.prototype.gameOver = function() {
  this.ctx.font = "150px 'Creepster'";
  this.ctx.fillStyle = "white";
  this.ctx.textAlign = "center";
  this.ctx.fillText("Game Over", this.canvas.width/2, this.canvas.height/2); 
}

Game.prototype.youWin = function() {
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



