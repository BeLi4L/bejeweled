import * as Phaser from 'phaser'

import {
  BOARD_SIZE,
  MENU_WIDTH
} from './constants'
import GameScene from './GameScene'
import MenuScene from './MenuScene'

declare global {
  interface Window {
    game: Phaser.Game
  }
}

const config: GameConfig = {
  title: 'Bejeweled',
  width: BOARD_SIZE + MENU_WIDTH,
  height: BOARD_SIZE,
  parent: document.getElementsByClassName('CanvasContainer')[0] as HTMLElement,
  scene: [MenuScene, GameScene]
}

const game = new Phaser.Game(config)

window.game = game
