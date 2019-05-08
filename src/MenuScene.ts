import * as Phaser from 'phaser'

import { BOARD_SIZE, MENU_WIDTH } from './constants'

const MENU_HEIGHT = BOARD_SIZE

export default class MenuScene extends Phaser.Scene {
  zone: Phaser.GameObjects.Zone
  scoreContainer: Phaser.GameObjects.Container
  scoreLabel: Phaser.GameObjects.Text
  scoreValue: Phaser.GameObjects.Text

  constructor () {
    super({
      key: 'MenuScene',
      active: true
    })
  }

  create () {
    this.cameras.main.setViewport(0, 0, MENU_WIDTH, MENU_HEIGHT)
    this.zone = this.add.zone(0, 0, MENU_WIDTH, MENU_HEIGHT).setOrigin(0, 0)

    this.scoreLabel = this.add.text(0, 0, 'Score', {
      fontFamily: 'Arial',
      fontSize: '25px',
      fill: '#ff0000',
      align: 'center'
    })

    this.scoreValue = this.add.text(0, 35, '0', {
      fontFamily: 'Arial',
      fontSize: '25px',
      fill: '#ff0000',
      align: 'center'
    })

    this.scoreContainer = this.add.container(0, 0, [this.scoreLabel, this.scoreValue])

    // Phaser.Display.Align.In.BottomCenter(this.scoreLabel, this.scoreContainer)
    // Phaser.Display.Align.In.TopCenter(this.scoreValue, this.scoreContainer)
    // Phaser.Display.Align.In.Center(this.scoreContainer, this.zone)

    this.registry.events.on('changedata', this.updateData, this)
  }

  updateData (parent: any, key: string, data: any, previousData: any) {
    if (key === 'score') {
      this.scoreValue.setText(data)
      // Phaser.Display.Align.In.Center(this.scoreValue, this.zone)
    }
  }
}
