


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
  var btns=document.getElementById("botones");
  for (i=0; i < arr.length; i++) {
    var img=document.createElement("img");
    img.src=arr[i];
    img.id="item"+i;
    btns.appendChild(img);
  }
}

function crearScore() {
  var scoreArea=document.getElementById("puntos");
    var imgStar=document.createElement("img");
    imgStar.src="././img/001-star.svg";
    imgStar.id="puntos";
    scoreArea.appendChild(imgStar);

    var score=document.createElement("span");
    score.id="scoreTxt";
    score.innerText="10";
    scoreArea.appendChild(score);


    var lifeArea=document.getElementById("vidas");
      var imgLife=document.createElement("img");
      imgLife.src="././img/002-like.svg";
      lifeArea.appendChild(imgLife);

      var life=document.createElement("span");
      life.id="lifeTxt";
      life.innerText="3";
      lifeArea.appendChild(life);
}