// The rules and the score of one game: lives, points, level and streak.
// Pure state: no DOM and no timers. The caller (Session) shows what happened.
class Game {
  // `pace` scales the speed of the whole game: 1 is normal, less is slower.
  constructor({ pace = 1 } = {}) {
    this.pace = pace;
    this.lives = START_LIVES;
    this.points = 0;
    this.level = 0;
    this.streak = 0;
    this.caught = 0;
    // Faux items clicked, even at 0 points where they cost nothing.
    this.fauxHit = 0;
    this.bestStreak = 0;
    this.healed = 0;
  }

  get isOver() {
    return this.lives <= 0;
  }

  // Milliseconds between spawns at the current level.
  get spawnMs() {
    return LEVELS[this.level].ms / this.pace;
  }

  // Notches filled toward the next level, or undefined on the last one.
  get levelProgress() {
    if (this.level === LEVELS.length - 1) return undefined;
    return Math.max(0, this.points - LEVELS[this.level].at);
  }

  // Numbers for the game over card.
  get stats() {
    return {
      score: this.points,
      level: this.level + 1,
      caught: this.caught,
      fauxHit: this.fauxHit,
      bestStreak: this.bestStreak,
    };
  }

  // Points never go below 0. Returns how many levels were gained: levels
  // only go up, so a faux item can't take you back one.
  addPoints(delta) {
    this.points = Math.max(0, this.points + delta);
    let gained = 0;
    while (
      this.level < LEVELS.length - 1 &&
      this.points >= LEVELS[this.level + 1].at
    ) {
      this.level++;
      gained++;
    }
    return gained;
  }

  loseLife() {
    this.lives--;
  }

  // Pumpkins caught in a row; returns the streak so far.
  catchPumpkin() {
    this.caught++;
    this.bestStreak = Math.max(this.bestStreak, ++this.streak);
    return this.streak;
  }

  // Every HEAL_STREAK pumpkins in a row bring back a lost heart; returns
  // whether one came back. Call it after catchPumpkin().
  healOnStreak() {
    if (this.lives >= START_LIVES || this.streak % HEAL_STREAK !== 0) {
      return false;
    }
    this.lives++;
    this.healed++;
    return true;
  }

  // A faux click or a lost pumpkin resets the streak.
  hitFaux() {
    this.fauxHit++;
    this.breakStreak();
  }

  breakStreak() {
    this.streak = 0;
  }

  // What the next item should look like, from the current level.
  nextSpawn() {
    // Nothing to lose at 0 points, so faux items only start once you score.
    const faux = this.points > 0 && Math.random() >= 1 - FAUX_CHANCE;
    const { gravity, wind: windSpeed } = LEVELS[this.level];
    const wind = windSpeed && Math.random() < 0.5 ? -windSpeed : windSpeed;
    return { faux, wind: wind * this.pace, gravity: gravity * this.pace };
  }
}
