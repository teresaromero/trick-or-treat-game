window.onload = function() {
  var game;
  document.getElementById("start-button").onclick = function() {
    document.getElementById("game-board").classList.toggle("hide");  
    startGame();
  };

  
  
  function startGame(){
    document.getElementById("start-button").disabled=true;
    game=new Game();
    game.generateDOM();
    game.generatePumpkin();

    //sale la primera calabaza
    game.start();
  
    document.getElementById("botones").onclick=function(e){
      //cuando click en calabaza obtengo su src para comparar
      event=e;
      var tarjetElement=event.target;
      if(tarjetElement.tagName=="IMG"){

        //se guarda la src del elemento clickado
        var imgDOM=tarjetElement.getAttribute("src");

        //comparamos src de click con id de canvas
        game.checkImg(imgDOM);
      }
    }

  }

}

