
function ComponentPumpkin(game) {
  this.game=game;
  this.img = new Image();
  this.img.src="";
  this.width = 96;
  this.height = 96;
  this.x=0;
  this.y=150;
  this.speedX = 0;
  this.speedY = 0;
  this.gravity = 1.5;
  }

  ComponentPumpkin.prototype.draw = function(){
    this.game.ctx.drawImage(this.img,this.x, this.y,this.width,this.height);
    console.log("dibujado");
}


  //la calabaza cae al vacio - solo para y desaparece cuando onclik en el tablero
  ComponentPumpkin.prototype.move = function() {
      this.y += this.gravity; 
      console.log("movido");
  }
  
  

  