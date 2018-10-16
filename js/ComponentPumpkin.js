
function ComponentPumpkin(game) {
  this.game=game;
  this.img = new Image();
  this.img.src="";
  this.id="";
  this.width = 96;
  this.height = 96;
  this.x=0;
  this.y=-96;
  this.gravity = 1;
  }
  //update
  ComponentPumpkin.prototype.draw = function(){
    this.game.ctx.drawImage(this.img,this.x, this.y,this.width,this.height);
}

  //newPosition
  ComponentPumpkin.prototype.move = function() {
      this.y += this.gravity; 

  }
  
  

  