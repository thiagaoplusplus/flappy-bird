/**
 * Gets a CSS property of an element as percentage. The property value returned by getComputedStyle
 * must contain pixel value and the property must specified as (relative) value in percentage in
 * the css files/html head.
 * 
 * @param {*} element The HTML element to read the CSS property
 * @param {string} property The CSS property to read.
 * @returns The CSS property as a percentage and as a number type. If the property is specified in
 * pixels in the CSS files, then end result will be just the value in pixels converted to number
 * type.
 */
 function getCSSPropertyAsPercentage(element, parentElement, property) {
	const elementPropertyValue = parseInt(window.getComputedStyle(element)[property])
	const parentPropertyValue = parseInt(window.getComputedStyle(parentElement)[property])
	return elementPropertyValue / parentPropertyValue * 100
}

function Rectangle(originX = 0, originY = 0, width = 0, height = 0) {

	this.originX = originX
	this.originY = originY
	this.width = width
	this.height = height

	this.isOverlapping = function(rectangle) {

		function makePoint(x = 0, y = 0) {
			return {x, y}
		}

		const points = [
			// Lower left corner
			makePoint(this.originX,              this.originY),
			// Upper left corner
			makePoint(this.originX,              this.originY + this.height),
			// Lower right corner
			makePoint(this.originX + this.width, this.originY),
			// Upper right corner
			makePoint(this.originX + this.width, this.originY + this.height)
		]

		const startX = rectangle.originX
		const endX   = rectangle.originX + rectangle.width
		const startY = rectangle.originY
		const endY   = rectangle.originY + rectangle.height

		return points.some(point => {
			if ( ((point.x >= startX) && (point.x <= endX)) &&
			     ((point.y >= startY) && (point.y <= endY)) ) {
				return true
			} else {
				return false
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
	// +------------+ <---+  <-------+           100% verticalPosition + height
	// |            |     |          |
	// |  topPipe   |     |      topPipeSize
	// |            |     |          |
	// +------------+     |  <-------+
	// |            |     |
	// |  opening   |  height
	// |            |     |
	// +------------+     |  <-------+
	// |            |     |          |
	// | bottomPipe |     |      bottomPipeSize
	// |            |     |          |
	// +------------+ <---+  <-------+             0% verticalPosition
	// ^            ^
	// |   width    |

	this._horizontalPosition = getCSSPropertyAsPercentage(this._obstacleNode, parent, 'left')
	this._width = getCSSPropertyAsPercentage(this._obstacleNode, parent, 'width')
	this._bottonPipeSize = getCSSPropertyAsPercentage(this._bottonPipeNode, parent, 'height')
	this._topPipeSize = getCSSPropertyAsPercentage(this._topPipeNode, parent, 'height')

	// JS properties to ease obstacle manipulation
	Object.defineProperty(this, 'position', {
		get() {
			return this._horizontalPosition
		},
		set(newValue) {
			this._horizontalPosition = newValue
			this._obstacleNode.style.left = `${newValue}%`
		}
	})

	/**
	 * Width property.
	 * 
	 * @remark Although the current game implementation uses fixed width, I'm implementing the
	 *    'set' method for the case of a future reuse.
	 */
	Object.defineProperty(this, 'width', {
		get() {
			return this._width
		},
		set(newValue) {
			this._width = newValue
			this._obstacleNode.style.width = `${newValue}%`
		}
	})

	Object.defineProperty(this, 'bottomPipeSize', {
		get() {
			return this._bottonPipeSize
		},
		set(newValue) {
			this._bottonPipeSize = newValue
			this._bottonPipeNode.style.height = `${newValue}%`
		}
	})

	Object.defineProperty(this, 'topPipeSize', {
		get() {
			return this._topPipeSize
		},
		set(newValue) {
			this._topPipeSize = newValue
			this._topPipeNode.style.height = `${newValue}%`
		}
	})

	Object.defineProperty(this, 'rectangles', {
		get() {
			const obstacleVerticalPosition = 0
			const obstacleHeight = 100
			const bottomPipeVerticalPosition = obstacleVerticalPosition
			const topPipeVerticalPosition = obstacleHeight - this._topPipeSize

			const bottomPipeRectangle = new Rectangle(
				this._horizontalPosition, bottomPipeVerticalPosition,
				this._width, this._bottonPipeSize
			)

			const topPipeRectangle = new Rectangle(
				this._horizontalPosition, topPipeVerticalPosition,
				this._width, this._topPipeSize
			)
			return [bottomPipeRectangle, topPipeRectangle]
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
	this._horizontalPosition = getCSSPropertyAsPercentage(this._birdNode, parent, 'left')
	this._verticalPosition = getCSSPropertyAsPercentage(this._birdNode, parent, 'bottom')
	this.width = getCSSPropertyAsPercentage(this._birdNode, parent, 'width')
	this.height = getCSSPropertyAsPercentage(this._birdNode, parent, 'height')

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

	Object.defineProperty(this, 'rectangles', {
		get() {
			return [
				new Rectangle(this._horizontalPosition, this._verticalPosition,
					this.width, this.height)
			]
		}
	})
}

const gameStage = document.querySelector('.content [wm-flappy]')

// Values here and below for positioning/sizing are in % of the stage size
const STAGE_HORIZONTAL_UPPER_LIMIT = 100
const STAGE_HORIZONTAL_LOWER_LIMIT = 0
const STAGE_VERTICAL_UPPER_LIMIT = 100
const STAGE_VERTICAL_LOWER_LIMIT = 0

const OBSTACLES_INITIAL_POSITION = STAGE_HORIZONTAL_UPPER_LIMIT // start out of stage
const OBSTACLES_WIDTH = 10
const OBSTACLES_DISTANCE_BETWEEN = 15
const OBSTACLES_POSITION_OFFSET = OBSTACLES_WIDTH + OBSTACLES_DISTANCE_BETWEEN
const OBSTACLES_OPENING_SIZE = 30
const OBSTACLES_OPENING_HEIGHT_UPPER_LIMIT = STAGE_VERTICAL_UPPER_LIMIT - OBSTACLES_OPENING_SIZE
const OBSTACLES_OPENING_HEIGHT_LOWER_LIMIT = 0

// Maximum number of obstacles visible on screen possible
const OBSTACLES_MAX_NUMBER_OF = Math.floor(
	STAGE_HORIZONTAL_UPPER_LIMIT / OBSTACLES_POSITION_OFFSET) + 1

const BIRD_INITIAL_VERTICAL_POSITION = 50
const BIRD_FIXED_HORIZONTAL_POSITION = 10

const GAME_FRAME_INTERVAL = 30 // in ms
const GAME_OBSTACLE_POSITION_DECREMENT = 0.3
const GAME_BIRD_VPOSITION_INCREMENT = 0.8
const GAME_BIRD_VPOSITION_DECREMENT = 0.5


function GameApp(stage) {
	const gameStage = stage
	let userInputMouseClicked = false
	let userInputKeyPressed = false
	let obstacleScoredAlready = false

	const score = new Score(gameStage)
	const bird = new Bird(gameStage)
	const obstacles = Array(OBSTACLES_MAX_NUMBER_OF)

	const GAME_FRAMES_BETWEEN_OBSTACLES =
		Math.floor((OBSTACLES_DISTANCE_BETWEEN - bird.width) / GAME_OBSTACLE_POSITION_DECREMENT)
	const GAME_BIRD_MAX_UP_TRAVEL_BETWEEN_OBSTACLES =
		GAME_FRAMES_BETWEEN_OBSTACLES * GAME_BIRD_VPOSITION_INCREMENT
	const GAME_BIRD_MAX_DOWN_TRAVEL_BETWEEN_OBSTACLES =
		GAME_FRAMES_BETWEEN_OBSTACLES * GAME_BIRD_VPOSITION_DECREMENT
	const GAME_BIRD_TRAVEL_GAP = bird.height * 2

	function setRandomOpeningPosition(obstacle, openingSize, minPosition, maxPosition) {
		obstacle.bottomPipeSize = Math.random() * (maxPosition - minPosition) + minPosition
		obstacle.topPipeSize = STAGE_HORIZONTAL_UPPER_LIMIT - (obstacle.bottomPipeSize + openingSize)
	}
	
	function setRandomOpeningPositionForNextObstacle(nextObstacle, previousObstacle) {
		//                 Previous
		//                          Next
		//                         | |                                          | |
		//        +-----> +-+\     | | <----------+        +---------> +-+\     | |
		//        |       | | \    | |            |        |           | | \    | |
		// bottomPipeSize | |  \   | |             Bird max            | |  \   +-+ <--+-------+
		//                | |   \  | |            down travel          | |   \         |       |
		//                | |    \ | |            |        |           | |    \       Gap      |
		//                | |     \+-+ <----------+        +---------> | |     \    <--+     Opening
		//                | |           (Gap = 0) |                    | |                    size
		//                | |                     |                    | |                     |
		//                | |                   Opening                | |      +-+ <----------+
		//                | |                    size                  | |      | |
		//                | |                     |                    | |      | |
		//                | |      +-+ <----------+                    | |      | |
		//                | |      | |                                 | |      | |
		//                 Without Gap                                   With Gap
		//                        (the greater the gap, the easier the game)
		// From the image above we derive the calculus below:
		let minBottomPipeSize = (previousObstacle.bottomPipeSize -
			GAME_BIRD_MAX_DOWN_TRAVEL_BETWEEN_OBSTACLES - OBSTACLES_OPENING_SIZE) + GAME_BIRD_TRAVEL_GAP
		if (minBottomPipeSize < OBSTACLES_OPENING_HEIGHT_LOWER_LIMIT) {
			minBottomPipeSize = OBSTACLES_OPENING_HEIGHT_LOWER_LIMIT
		}
	
		//                  Previous
		//                           Next
		//                 | |      | |                                 | |      | |
		//                 | |      +-+ <----------+                    | |      | |
		//                 | |                     |                    | |      | |
		//                 | |                  Opening                 | |      | |
		//                 | |                   size                   | |      +-+ <----------+
		//                 | |                     |                    | |                     |
		//                 | |           (Gap = 0) |                    | |                     |
		//                 | |     /+-+ <----------+        +---------> | |     /    <--+     Opening
		//                 | |    / | |            |        |           | |    /       Gap     size
		//                 | |   /  | |             Bird max            | |   /         |       |
		//                 | |  /   | |             up travel           | |  /   +-+ <--+-------+
		//                 | | /    | |            |        |           | | /    | |
		//       +-------> +-+/     | | <----------+        +---------> +-+/     | |
		//       |                  | |                                          | |
		// (bottomPipeSize          | |                                          | |
		//       +                  | |                                          | |
		//  openingSize)            | |                                          | |
		//                  Without Gap                                   With Gap
		//                         (the greater the gap, the easier the game)
		// From the image above we derive the calculus below:
		let maxBottomPipeSize = (previousObstacle.bottomPipeSize + OBSTACLES_OPENING_SIZE +
			GAME_BIRD_MAX_UP_TRAVEL_BETWEEN_OBSTACLES) - GAME_BIRD_TRAVEL_GAP
		if (maxBottomPipeSize > OBSTACLES_OPENING_HEIGHT_UPPER_LIMIT) {
			maxBottomPipeSize = OBSTACLES_OPENING_HEIGHT_UPPER_LIMIT
		}
	
		setRandomOpeningPosition(nextObstacle, OBSTACLES_OPENING_SIZE, minBottomPipeSize, maxBottomPipeSize)
	}
	
	function didPlayerScoreOnePoint(bird, obstacle, obstacleScoredAlready) {
		if (bird.horizontalPosition > (obstacle.position + obstacle.width)) {
			return (!obstacleScoredAlready)
		} else {
			return false
		}
	}

	this.onMouseDown = function() {
		userInputMouseClicked = true
	}
	
	this.onMouseUp = function() {
		userInputMouseClicked = false
	}
	
	this.onKeyDown = function() {
		userInputKeyPressed = true
	}
	
	this.onKeyUp = function() {
		userInputKeyPressed = false
	}

	this.onFrameUpdate = function() {
		// Obstacles position update
		obstacles[0].position -= GAME_OBSTACLE_POSITION_DECREMENT
		for (let i = 1; i < obstacles.length; i++) {
			if ((obstacles[i].position - obstacles[i - 1].position) >= OBSTACLES_POSITION_OFFSET) {
				obstacles[i].position -= GAME_OBSTACLE_POSITION_DECREMENT
			}
		}
		
		// End of obstacle course condition
		const obstacleStartOfCourse = OBSTACLES_INITIAL_POSITION
		const obstacleEndOfCourse = STAGE_HORIZONTAL_LOWER_LIMIT - obstacles[0].width // 0% - width
		if (obstacles[0].position <= obstacleEndOfCourse) {
			obstacles[0].position = obstacleStartOfCourse
			const swapTemp = obstacles[0]
			let i
			for (i = 1; i < obstacles.length; i++) {
				obstacles[i - 1] = obstacles[i]
			}
			obstacles[i - 1] = swapTemp

			setRandomOpeningPositionForNextObstacle(obstacles[i - 1], obstacles[i - 2])
			obstacleScoredAlready = false
		}

		// Bird position update
		const birdUpperEndOfCourse = STAGE_VERTICAL_UPPER_LIMIT - bird.height // i.e. 100% - height
		const birdLowerEndOfCourse = STAGE_VERTICAL_LOWER_LIMIT

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

		// Score update
		let playerScoredOnePoint = didPlayerScoreOnePoint(bird, obstacles[0], obstacleScoredAlready)
		if (playerScoredOnePoint) {
			score.increment()
		}
		obstacleScoredAlready |= playerScoredOnePoint

		// Game over condition
		const birdRectangle = bird.rectangles[0]
		const obstacleRectangles = obstacles[0].rectangles
		let gameIsOver = obstacleRectangles.some(rectangle => birdRectangle.isOverlapping(rectangle))
		return !gameIsOver
	}

	// init
	obstacles[0] = new Obstacle(gameStage)
	obstacles[0].position = OBSTACLES_INITIAL_POSITION
	setRandomOpeningPosition(obstacles[0], OBSTACLES_OPENING_SIZE,
		OBSTACLES_OPENING_HEIGHT_LOWER_LIMIT, OBSTACLES_OPENING_HEIGHT_UPPER_LIMIT)

	for (i = 1; i < OBSTACLES_MAX_NUMBER_OF; i++) {
		obstacles[i] = new Obstacle(gameStage)
		obstacles[i].position = OBSTACLES_INITIAL_POSITION
		setRandomOpeningPositionForNextObstacle(obstacles[i], obstacles[i - 1])
	}

	bird.horizontalPosition = BIRD_FIXED_HORIZONTAL_POSITION
	bird.verticalPosition = BIRD_INITIAL_VERTICAL_POSITION
}

const gameApp = new GameApp(gameStage)

document.onmousedown = gameApp.onMouseDown
document.onmouseup = gameApp.onMouseUp
document.onkeydown = gameApp.onKeyDown
document.onkeyup = gameApp.onKeyUp

const intervalId = window.setInterval(() => {
	if (!gameApp.onFrameUpdate()) {
		clearInterval(intervalId)
	}
}, GAME_FRAME_INTERVAL)
