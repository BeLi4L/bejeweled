import * as Phaser from 'phaser'
import GameScene from './GameScene'

declare global {
  interface Window {
    game: Phaser.Game
  }
}

const config: GameConfig = {
  title: 'Bejeweled',
  width: 520,
  height: 520,
  scene: GameScene,
  disableContextMenu: true
}

const game = new Phaser.Game(config)

window.game = game
