import { Scene } from 'phaser'
import random from './random'

const colors = [
  'blue',
  'green',
  'orange',
  'red',
  'white',
  'yellow'
]

const cellSize = 75
const cellCount = 8
const boardSize = cellCount * cellSize

export default class GameScene extends Scene {
  preload () {
    colors.forEach(item => this.load.image(item, `assets/${item}.png`))
  }

  create () {
    this.createBackground()

    this.initBoard()
  }

  createBackground () {
    this.add.grid(
      boardSize / 2, // x
      boardSize / 2, // y
      boardSize, // width
      boardSize, // height
      cellSize, // cellWidth
      cellSize // cellHeight
    )
      .setFillStyle(0x252e38)
      .setAltFillStyle(0x363e48)
      .setOutlineStyle()
  }

  initBoard () {
    this.board = new BejeweledBoard({ size: cellCount, colorCount: colors.length })

    // Draw initial board
    for (let i = 0; i < this.board.size; i++) {
      for (let j = 0; j < this.board.size; j++) {
        this.add.sprite(i * cellSize + cellSize / 2, j * cellSize + cellSize / 2, colors[this.board.getValue(i, j)])
      }
    }
  }
}

class BejeweledBoard {
  constructor ({ size, colorCount }) {
    this.size = size
    this.colorCount = colorCount

    this.initBoard()
  }

  initBoard () {
    // Create empty board
    const board = new Array(this.size)
    for (let i = 0; i < this.size; i++) {
      board[i] = new Array(this.size).fill(null)
    }
    this.board = board

    // Fill board
    for (let i = 0; i < board.length; i++) {
      const row = board[i]
      for (let j = 0; j < row.length; j++) {
        const possibleColors = []

        for (let color = 0; color < this.colorCount; color++) {
          row[j] = color
          if (!this.shouldExplode(i, j)) {
            possibleColors.push(color)
          }
        }

        row[j] = random.pickOne(possibleColors)
      }
    }
  }

  shouldExplode (i, j) {
    return this.shouldExplodeHorizontally(i, j) || this.shouldExplodeVertically(i, j)
  }

  shouldExplodeHorizontally (i, j) {
    const explosionThreshold = 3

    for (let startPosition = j - explosionThreshold + 1; startPosition <= j; startPosition++) {
      const endPosition = startPosition + explosionThreshold - 1
      if (startPosition >= 0 && endPosition < this.size) {
        let explosion = true
        for (let index = startPosition; index < endPosition; index++) {
          if (this.board[i][index] !== this.board[i][index + 1]) {
            explosion = false
            break
          }
        }
        if (explosion) {
          return true
        }
      }
    }
    return false
  }

  shouldExplodeVertically (i, j) {
    const explosionThreshold = 3

    for (let startPosition = i - explosionThreshold + 1; startPosition <= i; startPosition++) {
      const endPosition = startPosition + explosionThreshold - 1
      if (startPosition >= 0 && endPosition < this.size) {
        let explosion = true
        for (let index = startPosition; index < endPosition; index++) {
          if (this.board[index][j] !== this.board[index + 1][j]) {
            explosion = false
            break
          }
        }
        if (explosion) {
          return true
        }
      }
    }
    return false
  }

  getValue (i, j) {
    return this.board[i][j]
  }
}
