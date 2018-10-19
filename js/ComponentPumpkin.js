
function Component(game) {
  this.game=game;
  this.img = new Image();
  this.img.src="";
  this.id="";
  this.width = 96;
  this.height = 96;
  this.x=0;
  this.y=-100;
  this.gravity = 1;
  }
  //update
  Component.prototype.draw = function(){
    this.game.ctx.drawImage(this.img,this.x, this.y,this.width,this.height);
}

  //newPosition
  Component.prototype.move = function() {
      this.y += this.gravity; 

  }
  
  

  