const getRandom = (min, max) => {
  return Math.floor(Math.random() * (max - min)) + min;
};

function createLi(id) {
  const li = document.createElement("li");
  li.setAttribute("class", "nav-item");

  const icon = document.createElement("span");
  icon.setAttribute("class", "nav-link");
  icon.setAttribute("id", id);
  icon.innerHTML = "⏸";
  li.appendChild(icon);

  return li;
}

function createLiCount(id, countId, emoji) {
  const li = document.createElement("li");
  li.setAttribute("id", id);
  li.setAttribute("class", "nav-item");

  const span = document.createElement("span");
  span.setAttribute("class", "nav-link text-nowrap");

  const count = document.createElement("span");
  count.setAttribute("id", countId);
  count.innerHTML = "0";
  span.appendChild(count);

  const icon = document.createElement("span");
  icon.innerHTML = emoji;
  span.appendChild(icon);
  li.appendChild(span);

  return li;
}

function getCanvasSize() {
  const viewport = document.getElementById("main-vp");
  const style = window.getComputedStyle(viewport);
  const padding =
    (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
  const chrome =
    document.querySelector("header").offsetHeight +
    document.querySelector("footer").offsetHeight;
  // The extra pixels cover the gap an inline canvas leaves under itself.
  const free = viewport.clientHeight - padding - chrome - 8;
  return {
    width: viewport.clientWidth * 0.9,
    height: Math.min(viewport.clientHeight * 0.8, free),
  };
}

function renderCanvas() {
  const { width, height } = getCanvasSize();
  const canvas = document.createElement("canvas");
  canvas.setAttribute("id", "canvas");
  canvas.setAttribute("width", width);
  canvas.setAttribute("height", height);

  document.querySelector("main").appendChild(canvas);
  return new Canvas();
}

function renderControls() {
  const group = document.createElement("ul");
  group.setAttribute("class", "nav justify-content-center");
  group.setAttribute("id", "controls");

  const points = createLiCount("points", "pointCount", "⭐️");

  const lifes = createLiCount("lifes", "lifeCount", "🧡");

  const pause = createLi("pause");

  group.appendChild(points);
  group.appendChild(lifes);
  group.appendChild(pause);

  document.querySelector("nav").appendChild(group);
}

function renderIntro() {
  const div = document.createElement("div");
  div.setAttribute("id", "intro");
  div.setAttribute("class", "container");
  const row = document.createElement("div");
  row.setAttribute("class", "row justify-content-center");

  div.appendChild(row);

  const card = document.createElement("div");
  card.setAttribute("class", "card bg-dark");

  row.appendChild(card);

  const cardBody = document.createElement("div");
  cardBody.setAttribute("class", "card-body");

  const cardTitle = document.createElement("h3");
  cardTitle.setAttribute("class", "card-title");
  cardTitle.innerHTML = "Catch all the pumpkins and make the highest score!";

  cardBody.appendChild(cardTitle);

  const cardText1 = document.createElement("p");
  cardText1.setAttribute("class", "card-text");
  cardText1.innerHTML =
    "Be careful because the witches throw more than pumpkins, and these will take points of your score!";
  cardBody.appendChild(cardText1);

  const cardText2 = document.createElement("p");
  cardText2.setAttribute("class", "card-text");
  cardText2.innerHTML = "While your score more and more, witches get mad!!";
  cardBody.appendChild(cardText2);

  const start = document.createElement("button");
  start.setAttribute("type", "button");
  start.setAttribute("class", "btn btn-danger m-1");
  start.innerHTML = "Go!";
  start.setAttribute("id", "start");
  start.onclick = (e) => startGame(e);
  cardBody.appendChild(start);

  card.appendChild(cardBody);
  document.querySelector("main").appendChild(div);
}

function renderEndGame(score = 0) {
  const div = document.createElement("div");
  div.setAttribute("id", "intro");
  div.setAttribute("class", "container");
  const row = document.createElement("div");
  row.setAttribute("class", "row justify-content-center");

  div.appendChild(row);

  const card = document.createElement("div");
  card.setAttribute("class", "card bg-dark");

  row.appendChild(card);

  const cardBody = document.createElement("div");
  cardBody.setAttribute("class", "card-body");

  const cardTitle = document.createElement("h3");
  cardTitle.setAttribute("class", "card-title");
  cardTitle.innerHTML = "Game over!";

  cardBody.appendChild(cardTitle);

  const cardText1 = document.createElement("p");
  cardText1.setAttribute("class", "card-text");
  cardText1.innerHTML = `You scored ${score} ⭐️ `;

  cardBody.appendChild(cardText1);

  const start = document.createElement("button");
  start.setAttribute("type", "button");
  start.setAttribute("class", "btn btn-danger m-1");
  start.innerHTML = "Play Again!";
  start.setAttribute("id", "start");
  start.onclick = (e) => startGame(e);
  cardBody.appendChild(start);

  card.appendChild(cardBody);
  document.querySelector("main").appendChild(div);
}

function getAsset(faux) {
  const index = faux ? getRandom(1, 8) : getRandom(1, 17);
  const padIndex = `${index}`.padStart(3, "0");

  const src = faux
    ? `./assets/img/${padIndex}-faux.png`
    : `./assets/img/${padIndex}.png`;
  const points = faux ? -1 : 1;
  const lifes = faux ? 0 : 0;
  return { src, points, lifes, faux };
}
