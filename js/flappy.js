/**
 * Gets a CSS property of an element as percentage. The property value returned by getComputedStyle
 * must contain pixel value and the property must specified as (relative) value in percentage in
 * the css files/html head.
 * 
 * @param {*} element The HTML element to read the CSS property
 * @param {*} property The CSS property to read.
 * @returns The CSS property as a percentage and as a number type. If the property is specified in
 * pixels in the CSS files, then end result will be just the value in pixels converted to number
 * type.
 */
 function getCSSPropertyAsPercentage(element, property) {
	// If we take the property value directly from getComputedStyle function, the value returned will
	// be in pixels even if the property is specified in percentage in the CSS files. However,
	// curiously, if the display property is 'none' then getComputedStyle will return the value as
	// percentage as we want.
	let originalDisplayValue = element.style.display
	element.style.display = 'none'
	let propertyValue = parseInt(window.getComputedStyle(element)[property])
	element.style.display = originalDisplayValue
	return propertyValue
}

function Obstacle(parent) {
	// Html structure construction
	const topPipe = document.createElement('div')
	topPipe.classList.add('pipe')
	topPipe.appendChild(document.createElement('div'))
	topPipe.appendChild(document.createElement('div'))

	const bottomPipe = topPipe.cloneNode(true)

	topPipe.classList.add('top')
	bottomPipe.classList.add('bottom')

	const freePath = document.createElement('div')
	freePath.classList.add('free-path')

	const obstacle = document.createElement('div')
	obstacle.classList.add('obstacle')
	obstacle.appendChild(topPipe)
	obstacle.appendChild(freePath)
	obstacle.appendChild(bottomPipe)

	this._topPipeNode = topPipe
	this._bottonPipeNode = bottomPipe
	this._freePathNode = freePath
	this._obstacleNode = obstacle

	parent.appendChild(obstacle)

	this._position = getCSSPropertyAsPercentage(this._obstacleNode, 'right')
	this._width = getCSSPropertyAsPercentage(this._obstacleNode, 'width')
	this._freePathSize = getCSSPropertyAsPercentage(this._freePathNode, 'height')
	this._freePathPosition = getCSSPropertyAsPercentage(this._bottonPipeNode, 'height')

	// JS properties to ease obstacle manipulation
	Object.defineProperty(this, 'position', {
		get() {
			return this._position
		},
		set(newValue) {
			this._position = newValue
			this._obstacleNode.style.right = `${newValue}%`
		}
	})

	Object.defineProperty(this, 'width', {
		get() {
			return this._width
		},
		set(newValue) {
			this._width = newValue
			this._obstacleNode.style.width = `${newValue}%`
		}
	})

	Object.defineProperty(this, 'freePathSize', {
		get() {
			return this._freePathSize
		},
		set(newValue) {
			this._freePathSize = newValue
			this._freePathNode.style.height = `${newValue}%`
		}
	})

	Object.defineProperty(this, 'freePathPosition', {
		get() {
			return this._freePathPosition
		},
		set(newValue) {
			this._freePathPosition = newValue
			this._bottonPipeNode.style.height = `${newValue}%`
		}
	})
}

function Score(parent) {
	const score = document.createElement('div')
	score.classList.add('score')
	score.textContent = '0'
	parent.appendChild(score)
	
	this._scoreNode = score
	this._points = 0

	this.reset = function() {
		this._points = 0
		this._scoreNode.textContent = 0
	}

	this.increment = function(incrementValue = 1) {
		this._points += incrementValue
		this._scoreNode.textContent = this._points
	}
}

function Bird(parent) {
	const bird = document.createElement('img')
	bird.src = 'imgs/passaro.png'
	bird.classList.add('bird')
	parent.appendChild(bird)

	this._birdNode = bird
	this._horizontalPosition = getCSSPropertyAsPercentage(this._birdNode, 'right')
	this._verticalPosition = getCSSPropertyAsPercentage(this._birdNode, 'bottom')
	this._height = getCSSPropertyAsPercentage(this._birdNode, 'height')

	Object.defineProperty(this, 'height', {
		get() {
			return this._height
		}
	})

	Object.defineProperty(this, 'horizontalPosition', {
		get() {
			return this._horizontalPosition
		},
		set(newValue) {
			this._horizontalPosition = newValue
			this._birdNode.style.right = `${newValue}%`
		}
	})

	Object.defineProperty(this, 'verticalPosition', {
		get() {
			return this._verticalPosition
		},
		set(newValue) {
			this._verticalPosition = newValue
			this._birdNode.style.bottom = `${newValue}%`
		}
	})
}

const gameStage = document.querySelector('.content [wm-flappy]')
const score = new Score(gameStage)
const bird = new Bird(gameStage)

// Values in % of the stage size
//const OBSTACLES_INITIAL_POSITION = 0 // start out of stage
const OBSTACLES_WIDTH = 10
const OBSTACLES_DISTANCE_BETWEEN = 15
const OBSTACLES_POSITION_OFFSET = OBSTACLES_WIDTH + OBSTACLES_DISTANCE_BETWEEN

// Maximum number of obstacles visible on screen possible
const OBSTACLES_MAX_NUMBER_OF = Math.floor(100 / OBSTACLES_POSITION_OFFSET) + 1


const obstacle = Array(OBSTACLES_MAX_NUMBER_OF)

for (i = 0; i < OBSTACLES_MAX_NUMBER_OF; i++) {
	obstacle[i] = new Obstacle(gameStage)
	// obstacle[i].position = OBSTACLES_INITIAL_POSITION
}

const BIRD_FIXED_HORIZONTAL_POSITION = 85 // in % of the stage size
bird.horizontalPosition = BIRD_FIXED_HORIZONTAL_POSITION

const GAME_FRAME_INTERVAL = 30 // in ms
const GAME_OBSTACLE_POSITION_INCREMENT = 0.3 // in % of the stage size
const GAME_BIRD_HPOSITION_INCREMENT = 0.8 // in % of the stage size
const GAME_BIRD_HPOSITION_DECREMENT = 0.5 // in % of the stage size

let userInputMouseClicked = false
let userInputKeyPressed = false

document.onmousedown = () => {
	userInputMouseClicked = true
	inputBirdIsFlying = true
}

document.onmouseup = () => {
	userInputMouseClicked = false
}

document.onkeydown = () => {
	userInputKeyPressed = true
}

document.onkeyup = () => {
	userInputKeyPressed = false
}

bird.verticalPosition = 50

const obstacleEndOfCourse = 100 // 100%
const obstacleStartOfCourse = 0 - obstacle[0].width // 0% - width

obstacle.forEach(o => o.position = obstacleStartOfCourse)

window.setInterval(() => {

	obstacle[0].position += GAME_OBSTACLE_POSITION_INCREMENT
	for (let i = 1; i < obstacle.length; i++) {
		if ((obstacle[i - 1].position - obstacle[i].position) >= OBSTACLES_POSITION_OFFSET) {
			obstacle[i].position += GAME_OBSTACLE_POSITION_INCREMENT
		}
	}

	if (obstacle[0].position >= obstacleEndOfCourse) {
		obstacle[0].position = obstacleStartOfCourse
		const swapTemp = obstacle[0]
		let i
		for (i = 1; i < obstacle.length; i++) {
			obstacle[i - 1] = obstacle[i]
		}
		obstacle[i - 1] = swapTemp
	}

	const birdUpperEndOfCourse = 100 // 100%
	const birdLowerEndOfCourse = 0 - bird.height

	const inputBirdIsFlying = userInputKeyPressed || userInputMouseClicked
	if (inputBirdIsFlying) {
		if (bird.verticalPosition < birdUpperEndOfCourse) {
			bird.verticalPosition += GAME_BIRD_HPOSITION_INCREMENT
		}
	}	else {
		if (bird.verticalPosition > birdLowerEndOfCourse) {
			bird.verticalPosition -= GAME_BIRD_HPOSITION_DECREMENT
		}
	}

}, GAME_FRAME_INTERVAL)

//for ()