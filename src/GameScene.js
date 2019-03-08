import * as Phaser from 'phaser'

const gems = [
  'blue',
  'green',
  'orange',
  'red',
  'white',
  'yellow'
]

const cellSize = 65
const cellsPerRow = 8
const size = cellsPerRow
const boardSize = cellsPerRow * cellSize
const swapDuration = 180 // ms
const destroyDuration = 180 // ms

export default class GameScene extends Phaser.Scene {
  preload () {
    gems.forEach(gem => this.load.image(gem, `assets/${gem}.png`))
  }

  create () {
    this.createBackground()

    this.initBoard()

    this.input.on('pointerdown', this.onPointerDown, this)
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
      .setAltFillStyle(0x212933)
      .setOutlineStyle()
  }

  initBoard () {
    // Create empty board
    this.board = createEmptyBoard(size)

    // Fill board
    for (let row = 0; row < size; row++) {
      for (let column = 0; column < size; column++) {
        const cell = this.board[row][column]

        const possibleColors = []
        for (let color of gems) {
          cell.color = color
          if (!this.shouldExplode(cell)) {
            possibleColors.push(color)
          }
        }
        cell.color = Phaser.Math.RND.pick(possibleColors)
        cell.empty = false

        const x = column * cellSize + cellSize / 2
        const y = row * cellSize + cellSize / 2
        cell.sprite = this.add.sprite(x, y, cell.color).setInteractive()
      }
    }
  }

  async onPointerDown (pointer) {
    const pointedCell = this.getCellAt(pointer)

    if (this.selectedCell == null) {
      this.selectCell(pointedCell)
      return
    }

    const firstCell = this.selectedCell
    const secondCell = pointedCell
    this.deselectCell()

    if (firstCell === secondCell) {
      return
    }

    if (!this.cellsAreNeighbours(firstCell, secondCell)) {
      this.selectCell(secondCell)
      return
    }

    await this.swapCells(firstCell, secondCell)

    await this.moveSpritesWhereTheyBelong()

    if (this.boardShouldExplode()) {
      while (this.boardShouldExplode()) {
        await this.destroyCells()

        await this.makeCellsFall()

        await this.refillBoard()
      }
    } else {
      await this.swapCells(firstCell, secondCell)
      await this.moveSpritesWhereTheyBelong()
    }
  }

  async makeCellsFall () {
    for (let column = 0; column < size; column++) {
      for (let row = size - 1; row >= 0; row--) {
        const cell = this.board[row][column]
        const lowestEmptyCell = this.getLowestEmptyCellBelow(cell)

        if (lowestEmptyCell !== null && !cell.empty) {
          this.swapCells(cell, lowestEmptyCell)
        }
      }
    }
    await this.moveSpritesWhereTheyBelong()
  }

  async refillBoard () {
    for (let column = 0; column < size; column++) {
      let numberOfEmptyCells = 0
      while (numberOfEmptyCells < size && this.board[numberOfEmptyCells][column].empty) {
        numberOfEmptyCells++
      }

      for (let row = 0; row < numberOfEmptyCells; row++) {
        const cell = this.board[row][column]
        cell.color = Phaser.Math.RND.pick(gems)
        cell.empty = false

        const x = column * cellSize + cellSize / 2
        const y = (row - numberOfEmptyCells) * cellSize + cellSize / 2
        cell.sprite = this.add.sprite(x, y, cell.color).setInteractive()
      }
    }
    await this.moveSpritesWhereTheyBelong()
  }

  async moveSpritesWhereTheyBelong () {
    const cells = this.board.flat()
    const animationsPromises = []

    for (const cell of cells) {
      const sprite = cell.sprite
      const expectedX = cell.column * cellSize + cellSize / 2
      const expectedY = cell.row * cellSize + cellSize / 2
      if (sprite.x !== expectedX || sprite.y !== expectedY) {
        const animationPromise = new Promise(resolve => {
          this.tweens.add({
            targets: sprite,
            x: expectedX,
            y: expectedY,
            duration: swapDuration,
            onComplete: () => resolve()
          })
        })
        animationsPromises.push(animationPromise)
      }
    }

    return Promise.all(animationsPromises)
  }

  getLowestEmptyCellBelow (cell) {
    for (let row = size - 1; row > cell.row; row--) {
      const belowCell = this.board[row][cell.column]
      if (belowCell.empty) {
        return belowCell
      }
    }
    return null
  }

  async destroyCells () {
    const cellsToDestroy = this.getCellsToDestroy()

    await Promise.all(
      cellsToDestroy.map(cell => this.destroyCell(cell))
    )
  }

  destroyCell (cell) {
    return new Promise(resolve => {
      cell.empty = true
      this.tweens.add({
        targets: cell.sprite,
        alpha: 0,
        duration: destroyDuration,
        onComplete: () => resolve()
      })
    })
  }

  getCellsToDestroy () {
    return this.board.flat().filter(cell => this.shouldExplode(cell))
  }

  selectCell (cell) {
    this.selectedCell = cell
    this.selectedCell.sprite.setScale(1.2)
  }

  deselectCell () {
    this.selectedCell.sprite.setScale(1)
    this.selectedCell = null
  }

  async swapCells (firstCell, secondCell) {
    const firstCellCopy = { ...firstCell }
    firstCell.row = secondCell.row
    firstCell.column = secondCell.column
    secondCell.row = firstCellCopy.row
    secondCell.column = firstCellCopy.column

    this.board[firstCell.row][firstCell.column] = firstCell
    this.board[secondCell.row][secondCell.column] = secondCell
  }

  boardShouldExplode () {
    return this.board.some(row => row.some(cell => this.shouldExplode(cell)))
  }

  shouldExplode (cell) {
    return this.shouldExplodeHorizontally(cell) || this.shouldExplodeVertically(cell)
  }

  shouldExplodeHorizontally ({ row, column }) {
    const explosionThreshold = 3

    for (let startPosition = column - explosionThreshold + 1; startPosition <= column; startPosition++) {
      const endPosition = startPosition + explosionThreshold - 1
      if (startPosition >= 0 && endPosition < size) {
        let explosion = true
        for (let index = startPosition; index < endPosition; index++) {
          if (this.board[row][index].color !== this.board[row][index + 1].color) {
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

  shouldExplodeVertically ({ row, column }) {
    const explosionThreshold = 3

    for (let startPosition = row - explosionThreshold + 1; startPosition <= row; startPosition++) {
      const endPosition = startPosition + explosionThreshold - 1
      if (startPosition >= 0 && endPosition < size) {
        let explosion = true
        for (let index = startPosition; index < endPosition; index++) {
          if (this.board[index][column].color !== this.board[index + 1][column].color) {
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

  getCellAt (pointer) {
    const row = Math.floor(pointer.y / cellSize)
    const column = Math.floor(pointer.x / cellSize)

    return this.board[row][column]
  }

  cellsAreNeighbours (cell1, cell2) {
    return (cell1.row === cell2.row && (cell1.column === cell2.column + 1 || cell1.column === cell2.column - 1)) ||
      (cell1.column === cell2.column && (cell1.row === cell2.row + 1 || cell1.row === cell2.row - 1))
  }
}

function createEmptyBoard (size) {
  const board = new Array(size)
  for (let row = 0; row < size; row++) {
    board[row] = new Array(size)
    for (let column = 0; column < size; column++) {
      board[row][column] = { row, column, color: null, sprite: null, empty: true }
    }
  }
  return board
}
