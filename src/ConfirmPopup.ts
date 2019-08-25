import * as Phaser from 'phaser'

import { TextButton } from './TextButton'

export class ConfirmPopup extends Phaser.GameObjects.Container {
  constructor (scene: Phaser.Scene, x: number, y: number, text: string, onConfirm: () => void) {
    super(scene, x, y)

    scene.add.existing(this)

    const confirmPopupBackground = scene.add.rectangle(0, 0, 400, 230)
      .setFillStyle(0x000000)

    const confirmPopupText = scene.add.text(0, 0, text)
      .setFontFamily('Arial')
      .setFontSize(25)
      .setColor('white')
      .setAlign('center')
      .setWordWrapWidth(350)

    const confirmPopupYesButton = new TextButton(scene, 0, 0, 'Yes')
    confirmPopupYesButton.on('pointerup', () => {
      this.destroy()
      onConfirm()
    })

    const confirmPopupNoButton = new TextButton(scene, 0, 0, 'No')
    confirmPopupNoButton.on('pointerup', () => {
      this.destroy()
    })

    this.add(confirmPopupBackground)
    this.add(confirmPopupText)
    this.add(confirmPopupYesButton)
    this.add(confirmPopupNoButton)

    this.setDepth(2)

    Phaser.Display.Align.In.TopCenter(confirmPopupText, confirmPopupBackground, 0, -25)
    Phaser.Display.Align.In.TopCenter(confirmPopupYesButton, confirmPopupBackground, -50, -150)
    Phaser.Display.Align.In.TopCenter(confirmPopupNoButton, confirmPopupBackground, 50, -150)
  }
}
