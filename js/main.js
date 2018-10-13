window.onload = function() {
  var game;
  document.getElementById("start-button").onclick = function() {
      startGame();
  };


  function startGame(){
    document.getElementById("start-button").disabled=true;
    game= new Game();
    game.generateDOM();
    game.generatePumpkins();
    updateGameArea();
  }

  function updateGameArea() {
    console.log(game);
    game.printPumpkin();
  
    
    requestAnimationFrame(updateGameArea);
  } 

}



