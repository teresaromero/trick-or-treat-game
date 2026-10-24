// Sound: short effects plus a looping music track. Plain audio elements
// (not Web Audio) so the game still works when opened from file://.
const SOUND_DIR = "./assets/sound/";
const SOUND_FILES = {
  point: "punto.mp3",
  error: "error.mp3",
  levelUp: "level-up.mp3",
  gameOver: "try-again.mp3",
  newBest: "you-win.mp3",
};
const MUSIC_FILE = "audioGame.mp3";

const effects = new Map();
let music;
let muted = false;

function preloadSounds() {
  if (!SOUND_ENABLED) return;
  muted = loadMuted();
  for (const [name, file] of Object.entries(SOUND_FILES)) {
    const audio = new Audio(SOUND_DIR + file);
    audio.preload = "auto";
    audio.volume = SOUND_VOLUME.effects;
    effects.set(name, audio);
  }
  // The music is large: it loads when the first game starts.
  music = new Audio(SOUND_DIR + MUSIC_FILE);
  music.preload = "none";
  music.loop = true;
  music.volume = SOUND_VOLUME.music;
  music.muted = muted;
}

// Browsers may refuse to play (no user gesture yet): the game goes on silent.
function play(audio) {
  audio.play()?.catch(() => {});
}

function playSound(name) {
  const audio = effects.get(name);
  if (muted || !audio) return;
  audio.currentTime = 0;
  play(audio);
}

function startMusic() {
  if (music) play(music);
}

function pauseMusic() {
  music?.pause();
}

function stopMusic() {
  if (!music) return;
  music.pause();
  music.currentTime = 0;
}

function isMuted() {
  return muted;
}

// The music keeps its place while muted, so unmuting needs no restart.
function toggleMuted() {
  if (!SOUND_ENABLED) return;
  muted = !muted;
  saveMuted(muted);
  track(muted ? EVENTS.soundOff : EVENTS.soundOn);
  if (music) music.muted = muted;
  document
    .querySelectorAll("[data-mute]")
    .forEach((button) => setMuteIcon(button, muted));
}
