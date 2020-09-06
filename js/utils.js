const getRandom = (min, max) => {
  return Math.floor(Math.random() * (max - min)) + min;
};

function createLi(id) {
  const li = document.createElement("li");
  li.setAttribute("class", "nav-item");

  const icon = document.createElement("span");
  icon.setAttribute("class", "nav-link");
  icon.setAttribute("type", "button");
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

function renderModal() {
  const modal = document.createElement("div");
  modal.setAttribute("id", "end-modal");
  modal.setAttribute("class", "modal-dialog modal-dialog-centered fade");
  modal.setAttribute("tabindex", "-1");

  const dialog = document.createElement("div");
  dialog.setAttribute("class", "modal-dialog");
  modal.appendChild(dialog);

  const content = document.createElement("div");
  content.setAttribute("class", "modal-content");

  dialog.appendChild(content);

  const header = document.createElement("div");
  header.setAttribute("class", "modal-header");

  const body = document.createElement("div");
  body.setAttribute("class", "modal-body");

  const footer = document.createElement("div");
  footer.setAttribute("class", "modal-footer");

  content.appendChild(header);
  content.appendChild(body);
  content.appendChild(footer);

  document.body.insertBefore(modal, document.getElementById("main-vp"));
}

function renderCanvas() {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("id", "canvas");
  canvas.setAttribute(
    "width",
    document.getElementById("main-vp").clientWidth * 0.9
  );
  canvas.setAttribute(
    "height",
    document.getElementById("main-vp").clientHeight * 0.8
  );
  document.querySelector("main").appendChild(canvas);
}

function renderControls() {
  const group = document.createElement("ul");
  group.setAttribute("class", "nav justify-content-center");
  group.setAttribute("id", "controls");

  const points = createLiCount("points", "pointCount", "⭐️");

  const lifes = createLiCount("lifes", "lifeCount", "🧡");

  const pause = createLi("pause");
  pause.onclick = (e) => pauseGame();

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

  const allScores = document.createElement("a");
  allScores.setAttribute("href", "#");
  allScores.innerHTML = "Hall of Fame";

  card.appendChild(cardBody);
  card.appendChild(allScores);
  document.querySelector("main").appendChild(div);
}
