
function Component(game) {
  this.game=game;
  this.img = new Image();
  this.img.src="";
  this.id="";
  this.width = 96;
  this.height = 96;
  this.x=0;
  this.y=-100;
  this.gravity = 1.5;
  this.wind=2;
  }
  //update
  Component.prototype.draw = function(){
    this.game.ctx.drawImage(this.img,this.x, this.y,this.width,this.height);

}

  //newPosition
  Component.prototype.move = function() {


    //NIVEL 2 - 3 - 4 - DESPLAZAMIENTO DIAGONAL

    if(this.game.points>20){

      if(this.game.xRamP>this.game.canvas/2){
        
        this.wind=-this.wind;
        
        if(this.x + this.wind > this.game.canvas.width - this.width || this.x + this.wind < this.width){
          this.wind = -this.wind;
        }
      
        this.x += this.wind;
      
      } else {
       
        if(this.x + this.wind > this.game.canvas.width - this.width || this.x + this.wind < this.width){
          this.wind = -this.wind;
        }
      
        this.x += this.wind;
      }
  
    }
    
    //NIVEL 0 - 1 - SOLO DESPLAZAMIENTO VERTIZAL

    this.y += this.gravity; 

       

     

  }
  
  

  