import * as Phaser from 'phaser'

import {
  BOARD_SIZE,
  CELL_SIZE,
  MENU_WIDTH,
  NUMBER_OF_CELLS_PER_ROW as size
} from './constants'
import { ConfirmPopup } from './ConfirmPopup'

const gems = [
  'blue',
  'green',
  'orange',
  'red',
  'white',
  'yellow'
]

/**
 * Number of cells required to trigger an explosion
 */
const explosionThreshold = 3
const swapDuration = 180 // ms
const destroyDuration = 180 // ms

type Cell = {
  row: number
  column: number
  color: string
  sprite: Phaser.GameObjects.Sprite
  empty: boolean
}

export default class GameScene extends Phaser.Scene {
  board: Cell[][]
  selectedCell: Cell
  moveInProgress: boolean
  score: number
  zone: Phaser.GameObjects.Zone
  isGameOver: boolean
  gameOverScreen: Phaser.GameObjects.Container

  constructor () {
    super({
      key: 'GameScene',
      active: true
    })
  }

  preload () {
    gems.forEach(gem => this.load.image(gem, `assets/${gem}.png`))
  }

  create () {
    this.cameras.main.setPosition(MENU_WIDTH, 0)
    this.zone = this.add.zone(0, 0, BOARD_SIZE, BOARD_SIZE).setOrigin(0)

    this.createBackground()

    this.initBoard()

    this.setScore(0)

    // TODO: clicking on "new game" triggers this...
    this.input.on('pointerdown', this.onPointerDown, this)

    this.registry.events.on('NEW_GAME', () => {
      this.handleStartNewGame()
    })
  }

  handleStartNewGame () {
    if (this.isGameOver) {
      this.startNewGame()
    } else {
      const confirmPopup = new ConfirmPopup(this, 0, 0, 'Are you sure you want to start a new game? You will lose current progress!', () => {
        this.startNewGame()
      })
      Phaser.Display.Align.In.Center(confirmPopup, this.zone)
    }
  }

  startNewGame () {
    this.isGameOver = false
    this.destroyBoard()
    this.initBoard()
    this.setScore(0)
  }

  destroyBoard () {
    this.board.forEach(row => row.forEach(cell => cell.sprite.destroy()))
  }

  createBackground () {
    this.add.grid(
      BOARD_SIZE / 2, // x
      BOARD_SIZE / 2, // y
      BOARD_SIZE, // width
      BOARD_SIZE, // height
      CELL_SIZE, // cellWidth
      CELL_SIZE // cellHeight
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

        const x = column * CELL_SIZE + CELL_SIZE / 2
        const y = row * CELL_SIZE + CELL_SIZE / 2
        cell.sprite = this.add.sprite(x, y, cell.color).setInteractive()
      }
    }
  }

  setScore (score: number) {
    this.score = score
    this.registry.set('score', score)
  }

  async onPointerDown (pointer: Phaser.Input.Pointer) {
    // console.log('pointer down', { ...pointer })

    if (pointer.camera !== this.cameras.main) {
      console.log('ignore other cameras')
      return
    }
    if (this.moveInProgress) {
      return
    }

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

    this.moveInProgress = true

    this.swapCells(firstCell, secondCell)

    await this.moveSpritesWhereTheyBelong()

    if (this.boardShouldExplode()) {
      let cascades = 0
      while (this.boardShouldExplode()) {
        const chains = this.getExplodingChains()

        await this.destroyCells()

        this.setScore(this.score + this.computeScore(chains, cascades))

        await this.makeCellsFall()

        await this.refillBoard()

        // TODO: add score in leaderboard

        cascades++
      }
      const winningMoves = this.getWinningMoves()
      console.log(`${winningMoves.length} winning moves`)
      if (winningMoves.length === 0) {
        this.gameOver()
      }
    } else {
      this.swapCells(firstCell, secondCell)
      await this.moveSpritesWhereTheyBelong()
    }

    this.moveInProgress = false
  }

  getWinningMoves (): { cell1: Cell, cell2: Cell }[] {
    const winningMoves: { cell1: Cell, cell2: Cell }[] = []

    for (let row = 0; row < size - 1; row++) {
      for (let column = 0; column < size - 1; column++) {
        const cell = this.board[row][column]
        const right = this.board[row][column + 1]
        const down = this.board[row + 1][column]

        // Swap right
        this.swapCells(cell, right)
        if (this.boardShouldExplode()) {
          winningMoves.push({ cell1: cell, cell2: right })
        }
        this.swapCells(cell, right)

        // Swap down
        this.swapCells(cell, down)
        if (this.boardShouldExplode()) {
          winningMoves.push({ cell1: cell, cell2: down })
        }
        this.swapCells(cell, down)
      }
    }

    return winningMoves
  }

  gameOver () {
    this.isGameOver = true

    const gameOverBackground = this.add.rectangle(0, 0, this.zone.width, this.zone.height)
      .setOrigin(0)
      .setFillStyle(0x000000, 0.5)

    const gameOverText = this.add.text(0, 0, 'Game over')
      .setOrigin(0.5)
      .setFontFamily('Arial')
      .setFontSize(35)
      .setColor('white')

    this.gameOverScreen = this.add.container(0, 0)
      .add(gameOverBackground)
      .add(gameOverText)
      .setDepth(1)

    Phaser.Display.Align.In.Center(gameOverText, gameOverBackground)

    // TODO: disable click & remove gameover screen on new game
  }

  computeScore (chains: Cell[][], cascades: number): number {
    return chains
      .map(chain => 50 * (chain.length + 1 - explosionThreshold))
      .reduce((score, chainScore) => score + chainScore, 0) * (cascades + 1)
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

        const x = column * CELL_SIZE + CELL_SIZE / 2
        const y = (row - numberOfEmptyCells) * CELL_SIZE + CELL_SIZE / 2
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
      const expectedX = cell.column * CELL_SIZE + CELL_SIZE / 2
      const expectedY = cell.row * CELL_SIZE + CELL_SIZE / 2
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

    await Promise.all(animationsPromises)
  }

  getLowestEmptyCellBelow (cell: Cell): Cell {
    for (let row = size - 1; row > cell.row; row--) {
      const belowCell = this.board[row][cell.column]
      if (belowCell.empty) {
        return belowCell
      }
    }
    return null
  }

  getExplodingChains (): Cell[][] {
    const rows = this.board
    const columns = Phaser.Utils.Array.Matrix.TransposeMatrix(this.board)

    return [...rows, ...columns].flatMap(line => this.getExplodingChainsOnLine(line))
  }

  getExplodingChainsOnLine (line: Cell[]): Cell[][] {
    const chains: Cell[][] = []

    let i = 0
    while (i < line.length) {
      let j = i + 1
      while (j < line.length && line[j].color === line[i].color) {
        j++
      }

      const chain = line.slice(i, j)
      if (chain.length >= explosionThreshold) {
        chains.push(chain)
        i = j
      } else {
        i++
      }
    }

    return chains
  }

  async destroyCells () {
    const cellsToDestroy = this.getCellsToDestroy()

    await Promise.all(
      cellsToDestroy.map(cell => this.destroyCell(cell))
    )
  }

  destroyCell (cell: Cell) {
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

  getCellsToDestroy (): Cell[] {
    return this.board.flat().filter(cell => this.shouldExplode(cell))
  }

  selectCell (cell: Cell) {
    this.selectedCell = cell
    this.selectedCell.sprite.setScale(1.2)
  }

  deselectCell () {
    this.selectedCell.sprite.setScale(1)
    this.selectedCell = null
  }

  swapCells (firstCell: Cell, secondCell: Cell) {
    const firstCellCopy = { ...firstCell }
    firstCell.row = secondCell.row
    firstCell.column = secondCell.column
    secondCell.row = firstCellCopy.row
    secondCell.column = firstCellCopy.column

    this.board[firstCell.row][firstCell.column] = firstCell
    this.board[secondCell.row][secondCell.column] = secondCell
  }

  boardShouldExplode (): boolean {
    return this.board.some(row => row.some(cell => this.shouldExplode(cell)))
  }

  shouldExplode (cell: Cell): boolean {
    return this.shouldExplodeHorizontally(cell) || this.shouldExplodeVertically(cell)
  }

  shouldExplodeHorizontally ({ row, column }: Cell): boolean {
    // TODO: optim: expand left/right and return right - left >= threshold
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

  shouldExplodeVertically ({ row, column }: Cell): boolean {
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

  getCellAt (pointer: Phaser.Input.Pointer): Cell {
    const row = Math.floor(pointer.worldY / CELL_SIZE)
    const column = Math.floor(pointer.worldX / CELL_SIZE)

    return this.board[row][column]
  }

  cellsAreNeighbours (cell1: Cell, cell2: Cell): boolean {
    return (cell1.row === cell2.row && (cell1.column === cell2.column + 1 || cell1.column === cell2.column - 1)) ||
      (cell1.column === cell2.column && (cell1.row === cell2.row + 1 || cell1.row === cell2.row - 1))
  }
}

function createEmptyBoard (size: number): Cell[][] {
  const board = new Array(size)
  for (let row = 0; row < size; row++) {
    board[row] = new Array(size)
    for (let column = 0; column < size; column++) {
      board[row][column] = { row, column, color: null, sprite: null, empty: true }
    }
  }
  return board
}
