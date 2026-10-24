const getRandom = (min, max) => {
  return Math.floor(Math.random() * (max - min)) + min;
};

const PUMPKIN_SPRITES = 16;
const FAUX_SPRITES = 7;
const FOG_IMAGES = 3;

function spriteSrc(index, faux) {
  const padIndex = `${index}`.padStart(3, "0");
  return faux
    ? `./assets/img/${padIndex}-faux.png`
    : `./assets/img/${padIndex}.png`;
}

// One shared Image per file, so a sprite is fetched once and is ready to
// draw the first time it falls.
const imageCache = new Map();

function getImage(src) {
  if (!imageCache.has(src)) {
    const img = new Image();
    img.src = src;
    imageCache.set(src, img);
  }
  return imageCache.get(src);
}

function preloadAssets() {
  for (let i = 1; i <= PUMPKIN_SPRITES; i++) getImage(spriteSrc(i, false));
  for (let i = 1; i <= FAUX_SPRITES; i++) getImage(spriteSrc(i, true));
  // The opening fog is a background in the stylesheet: fetching it now means
  // it is ready on the first frame of the first game.
  for (let i = 1; i <= FOG_IMAGES; i++) getImage(`./assets/img/fog${i}.webp`);
}

// A random sprite of the wanted kind, with the points it is worth.
function randomSprite(faux) {
  const index = faux
    ? getRandom(1, FAUX_SPRITES + 1)
    : getRandom(1, PUMPKIN_SPRITES + 1);
  return { src: spriteSrc(index, faux), points: faux ? -1 : 1, faux };
}
