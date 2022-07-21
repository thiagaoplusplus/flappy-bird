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

function Rectangle(originX = 0, originY = 0, width = 0, height = 0) {
	
	function makePoint(x = 0, y = 0) {
		return {x, y}
	}

	this._origin = makePoint(originX, originY)
	this._width = width
	this._height = height

	Object.defineProperty(this, 'originX', {
		get() {
			return this._origin.x
		},
		set(newValue) {
			this._origin.x = newValue
		}
	})
	Object.defineProperty(this, 'originY', {
		get() {
			return this._origin.y
		},
		set(newValue) {
			this._origin.y = newValue
		}
	})
	Object.defineProperty(this, 'width', {
		get() {
			return  this._width
		},
		set(newValue) {
			this._width = newValue
		}
	})
	Object.defineProperty(this, 'height', {
		get() {
			return this._height
		},
		set(newValue) {
			this._height = newValue
		}
	})

	this.isOverlapping = function(rectangle) {
		const points = [
			// Lower left corner
			makePoint(originX,         originY),
			// Upper left corner
			makePoint(originX,         originY + height),
			// Lower right corner
			makePoint(originX + width, originY),
			// Upper right corner
			makePoint(originX + width, originY + height)
		]

		const startX = rectangle._origin.x
		const endX   = rectangle._origin.x + rectangle._width
		const startY = rectangle._origin.y
		const endY   = rectangle._origin.y + rectangle._height

		points.forEach(point => {
			if ( ((point.x >= startX) && (point.x <= endX)) &&
			     ((point.y >= startY) && (point.y <= endY)) )
			{
				return true
			}
		})
	}
}

function Obstacle(parent) {
	// HTML structure construction
	const topPipe = document.createElement('div')
	topPipe.classList.add('pipe')
	topPipe.appendChild(document.createElement('div'))
	topPipe.appendChild(document.createElement('div'))

	const bottomPipe = topPipe.cloneNode(true)

	topPipe.classList.add('top')
	bottomPipe.classList.add('bottom')

	const opening = document.createElement('div')
	opening.classList.add('opening')

	const obstacle = document.createElement('div')
	obstacle.classList.add('obstacle')
	obstacle.appendChild(topPipe)
	obstacle.appendChild(opening)
	obstacle.appendChild(bottomPipe)

	this._topPipeNode = topPipe
	this._bottonPipeNode = bottomPipe
	this._openingNode = opening
	this._obstacleNode = obstacle

	parent.appendChild(obstacle)

	// overview of the constructed structure:
	// +------------+ <---+                      100% verticalPosition + height
	// |            |     |
	// |  topPipe   |     |
	// |            |     |
	// +------------+     |  <-------+
	// |            |     |          |
	// |  opening   |  height    openingSize
	// |            |     |          |
	// +------------+     |  <-------+
	// |            |     |          | 
	// | bottomPipe |     |      openingPosition
	// |            |     |          | 
	// +------------+ <---+  <-------+             0% verticalPosition
	// ^            ^
	// |   width    |

	const horizontalPosition = getCSSPropertyAsPercentage(this._obstacleNode, 'left')
	const verticalPosition = 0
	const width = getCSSPropertyAsPercentage(this._obstacleNode, 'width')
	const height = 100
	const openingSize = getCSSPropertyAsPercentage(this._openingNode, 'height')
	const openingPosition = getCSSPropertyAsPercentage(this._bottonPipeNode, 'height')

	this._bottomPipeRectangle = new Rectangle(
		horizontalPosition, verticalPosition, width, openingPosition
	)

	const topPipeRectangleVerticalPosition = verticalPosition + openingPosition + openingSize
	this._topPipeRectangle = new Rectangle(
		horizontalPosition, topPipeRectangleVerticalPosition,
		width, height - topPipeRectangleVerticalPosition
	)

	// JS properties to ease obstacle manipulation
	Object.defineProperty(this, 'position', {
		get() {
			return this._bottomPipeRectangle.originX
		},
		set(newValue) {
			this._bottomPipeRectangle.originX = newValue
			this._topPipeRectangle.originX = newValue
			this._obstacleNode.style.left = `${newValue}%`
		}
	})

	Object.defineProperty(this, 'width', {
		get() {
			return this._bottomPipeRectangle.width
		},
		set(newValue) {
			this._bottomPipeRectangle.width = newValue
			this._topPipeRectangle.width = newValue
			this._obstacleNode.style.width = `${newValue}%`
		}
	})

	Object.defineProperty(this, 'openingPosition', {
		get() {
			return this._bottomPipeRectangle.height
		},
		set(newValue) {
			const openingSize = 
				this._topPipeRectangle.originY - this._bottomPipeRectangle.height
			const topPipeNewOriginY = newValue + openingSize
			const obstacleHeight = 100

			this._bottomPipeRectangle.height = newValue
			this._topPipeRectangle.originY = topPipeNewOriginY
			this._topPipeRectangle.height = obstacleHeight - topPipeNewOriginY

			this._bottonPipeNode.style.height = `${newValue}%`
			// top pipe style is ajusted automatically by CSS rules
		}
	})

	Object.defineProperty(this, 'openingSize', {
		get() {
			return this._topPipeRectangle.originY - this._bottomPipeRectangle.height
		},
		set(newValue) {
			const topPipeNewOriginY = this._bottomPipeRectangle.height + newValue
			const obstacleHeight = 100

			this._topPipeRectangle.originY = topPipeNewOriginY
			this._topPipeRectangle.height = obstacleHeight - topPipeNewOriginY

			this._openingNode.style.height = `${newValue}%`
		}
	})

	Object.defineProperty(this, 'rectangles', {
		get() {
			return [this._bottomPipeRectangle, this._topPipeRectangle]
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
	this._horizontalPosition = getCSSPropertyAsPercentage(this._birdNode, 'left')
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
			this._birdNode.style.left = `${newValue}%`
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

const BIRD_FIXED_HORIZONTAL_POSITION = 10 // in % of the stage size
bird.horizontalPosition = BIRD_FIXED_HORIZONTAL_POSITION

const GAME_FRAME_INTERVAL = 30 // in ms
const GAME_OBSTACLE_POSITION_DECREMENT = 0.3 // in % of the stage size
const GAME_BIRD_VPOSITION_INCREMENT = 0.8 // in % of the stage size
const GAME_BIRD_VPOSITION_DECREMENT = 0.5 // in % of the stage size

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

const obstacleStartOfCourse = 100 // 100%
const obstacleEndOfCourse = 0 - obstacle[0].width // 0% - width

obstacle.forEach(o => o.position = obstacleStartOfCourse)

window.setInterval(() => {

	obstacle[0].position -= GAME_OBSTACLE_POSITION_DECREMENT
	for (let i = 1; i < obstacle.length; i++) {
		if ((obstacle[i].position - obstacle[i - 1].position) >= OBSTACLES_POSITION_OFFSET) {
			obstacle[i].position -= GAME_OBSTACLE_POSITION_DECREMENT
		}
	}

	if (obstacle[0].position <= obstacleEndOfCourse) {
		obstacle[0].position = obstacleStartOfCourse
		const swapTemp = obstacle[0]
		let i
		for (i = 1; i < obstacle.length; i++) {
			obstacle[i - 1] = obstacle[i]
		}
		obstacle[i - 1] = swapTemp
	}

	const birdUpperEndOfCourse = 100 - bird.height // i.e. 100% - height
	const birdLowerEndOfCourse = 0

	const inputBirdIsFlying = userInputKeyPressed || userInputMouseClicked
	if (inputBirdIsFlying) {
		if (bird.verticalPosition < birdUpperEndOfCourse) {
			bird.verticalPosition += GAME_BIRD_VPOSITION_INCREMENT
		} else {
			bird.verticalPosition = birdUpperEndOfCourse
		}
	}	else {
		if (bird.verticalPosition > birdLowerEndOfCourse) {
			bird.verticalPosition -= GAME_BIRD_VPOSITION_DECREMENT
		} else {
			bird.verticalPosition = birdLowerEndOfCourse
		}
	}



}, GAME_FRAME_INTERVAL)

//for ()