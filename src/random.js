/**
 * Generates a random integer between min and max (inclusive).
 *
 * @param {number} min
 * @param {number} max
 */
function randomInteger ({ min, max }) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

/**
 * Pick a random element in the given array.
 *
 * @param {any[]} array
 */
function pickOne (array) {
  return array[randomInteger({ min: 0, max: array.length - 1 })]
}

export default {
  integer: randomInteger,
  pickOne
}
