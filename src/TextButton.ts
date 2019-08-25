import * as Phaser from 'phaser'

const defaultStyle = {
  fontFamily: 'Arial',
  fontSize: '25px',
  fill: '#ffffff',
  align: 'center'
}

export class TextButton extends Phaser.GameObjects.Text {
  constructor (scene: Phaser.Scene, x: number, y: number, text: string | string[], style?: object) {
    super(scene, x, y, text, { ...defaultStyle, ...style })

    scene.add.existing(this)

    this.setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.setAlpha(0.5))
      .on('pointerout', () => this.setAlpha(1))
      .on('pointerup', () => this.setAlpha(0.5))
  }
}
