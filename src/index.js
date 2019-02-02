import * as Phaser from 'phaser'
import GameScene from './GameScene'

const config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 600,
  height: 600,
  scene: GameScene
}

const game = new Phaser.Game(config)

window.game = game
