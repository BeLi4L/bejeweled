# Bejeweled

Clone of the famous Bejeweled game, built with [Phaser](https://github.com/photonstorm/phaser).

## How to run

Install [Node.js](https://nodejs.org/en/download) and run:

```bash
npm ci
npm start
```

Open http://localhost:8000 to play the game ;)

## Backlog

- bug: new game: some old gems are still here
- bug: new game: click propagates from the popup to the game

- hint button: random.pick(winningMoves)

- Game & Menu extends Zone/Container/Scene?

- add local leaderboard
- maybe extract Board/Cell classes?
- explosion animation: shrink, like bejeweled 1
- improve selected gem: add 4 white corners ? and also on the 2nd gem
- add sounds/score on sprites (like candy crush, or try the original Bejeweled 1 sound) + cascade sounds (à la dota & co: Godlike, Monster kill...)
- use Smash sprites (add a toggle button to switch?)
- add screenshot in README
- swipe
