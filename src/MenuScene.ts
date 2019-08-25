import * as Phaser from 'phaser'

import { BOARD_SIZE, MENU_WIDTH } from './constants'
import { TextButton } from './TextButton'

const MENU_HEIGHT = BOARD_SIZE

export default class MenuScene extends Phaser.Scene {
  zone: Phaser.GameObjects.Zone
  scoreLabel: Phaser.GameObjects.Text
  scoreValue: Phaser.GameObjects.Text
  newGameButton: Phaser.GameObjects.Text

  constructor () {
    super({
      key: 'MenuScene',
      active: true
    })
  }

  create () {
    this.cameras.main.setViewport(0, 0, MENU_WIDTH, MENU_HEIGHT)

    this.scoreLabel = this.add.text(0, 0, 'Score')
      .setFontFamily('Arial')
      .setFontSize(25)
      .setColor('white')
      .setAlign('center')

    this.scoreValue = this.add.text(0, 35, '0')
      .setFontFamily('Arial')
      .setFontSize(25)
      .setColor('white')
      .setAlign('center')

    this.newGameButton = new TextButton(this, 0, 150, 'New Game')
    this.newGameButton.on('pointerup', () => {
      this.registry.events.emit('NEW_GAME')
    })

    this.zone = this.add.zone(0, 0, MENU_WIDTH, MENU_HEIGHT).setOrigin(0)
    Phaser.Display.Align.In.TopCenter(this.scoreLabel, this.zone, 0, -20)
    Phaser.Display.Align.In.TopCenter(this.scoreValue, this.zone, 0, -60)
    Phaser.Display.Align.In.TopCenter(this.newGameButton, this.zone, 0, -250)

    // TODO: hint button

    // TODO: high scores

    this.registry.events.on('changedata', this.updateData, this)
  }

  updateData (parent: any, key: string, data: any, previousData: any) {
    if (key === 'score') {
      this.scoreValue.setText(data)
      Phaser.Display.Align.In.TopCenter(this.scoreValue, this.zone, 0, -60)
    }
  }
}
