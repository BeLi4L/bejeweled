import * as Phaser from 'phaser'
import GameScene from './GameScene'

const config = {
  title: 'Bejeweled',
  width: 520,
  height: 520,
  scene: GameScene,
  disableContextMenu: true
}

const game = new Phaser.Game(config)

window.game = game
