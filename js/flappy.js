/**
 * Gets a CSS property of an element as percentage relative to its parent.
 * 
 * @param {HTMLElement} element The HTML element to read the CSS property
 * @param {string} property The CSS property to read.
 * @returns The CSS property as a percentage and as a number type.
 */
 function getCSSPropertyAsPercentage(element, parentElement, property) {
	const elementPropertyValue = parseInt(window.getComputedStyle(element)[property])
	const parentPropertyValue = parseInt(window.getComputedStyle(parentElement)[property])
	return elementPropertyValue / parentPropertyValue * 100
}

/**
 * Represents a polygon for the moving objects of the game. As the purpose is just learning,
 * I'm keeping this simple by representing it just as a rectangle. Also, this data type
 * could be remove and the rectangle returned by the DOM function getBoundingClientRect()
 * could be used directly. I'm using this data type because the DOM function works with
 * absolute pixel values and I'm working with relative percentage values. So, I want to
 * store the values in percentage here to avoid conversions.
 * 
 * @param {number} originX The rectangle position on X axis
 * @param {number} originY The rectangle position on Y axis
 * @param {number} width   The width of the rectangle
 * @param {number} height  The height of the rectangle
 */
function Rectangle(originX = 0, originY = 0, width = 0, height = 0) {

	this.originX = originX
	this.originY = originY
	this.width = width
	this.height = height

	/**
	 * Checks if a rectangle is overlapping another rectangle. The algorithm is not perfect
	 * and it only works if rectangle passed as parameter is bigger than "this rectangle".
	 * For learning purposes this is OK.
	 * 
	 * @param {Rectangle} rectangle The rectangle to check the overlapping.
	 * @returns true if the rectangles are overlapping.
	 */
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

/**
 * Encapsulates the HTML elements for the obstacles (pipes) in the game.
 * 
 * @param {HTMLElement} parent The parent HTML element for the obstacle elements.
 */
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
	this._bottomPipeNode = bottomPipe
	this._openingNode = opening
	this._obstacleNode = obstacle

	parent.appendChild(obstacle)

	// overview of the constructed structure:
	// +------------+ <---+  <-------+           100% -> verticalPosition + height
	// |            |     |          |
	// |  topPipe   |     |      topPipeSize
	// |            |     |          |
	// +------------+     |  <-------+  <---+
	// |            |     |                 |
	// |  opening   |  height            openingSize
	// |            |     |                 |
	// +------------+     |  <-------+  <---+--openingPosition
	// |            |     |          |
	// | bottomPipe |     |      bottomPipeSize
	// |            |     |          |
	// +------------+ <---+  <-------+             0% -> verticalPosition
	// ^            ^
	// |   width    |

	this._horizontalPosition = getCSSPropertyAsPercentage(this._obstacleNode, parent, 'left')
	this._width = getCSSPropertyAsPercentage(this._obstacleNode, parent, 'width')
	this._height = getCSSPropertyAsPercentage(this._obstacleNode, parent, 'height')
	this._bottomPipeSize = getCSSPropertyAsPercentage(this._bottomPipeNode, parent, 'height')
	this._topPipeSize = getCSSPropertyAsPercentage(this._topPipeNode, parent, 'height')
	this._openingSize = this._height - (this._bottomPipeSize + this._topPipeSize)
	if (this._openingSize < 0) this._openingSize = 0

	// JS properties to ease obstacle manipulation

	/**
	 * The horizontal position of the obstacle, in percentage units.
	 */
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
	 * The width of the obstacle, in percentage units.
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

	/**
	 * The vertical position of the obstacle opening, in percentage units.
	 */
	Object.defineProperty(this, 'openingPosition', {
		get() {
			return this._bottomPipeSize
		},
		set(newValue) {
			const newBottomPipeSize = newValue
			this._bottomPipeSize = newBottomPipeSize
			this._bottomPipeNode.style.height = `${newBottomPipeSize}%`

			this._adjustTopPipeHeight(newBottomPipeSize, this._openingSize)
		}
	})

	/**
	 * The size of the obstacle opening, in percentage units.
	 */
	Object.defineProperty(this, 'openingSize', {
		get() {
			return this._openingSize
		},
		set(newValue) {
			this._openingSize = newValue
			this._adjustTopPipeHeight(this._bottomPipeSize, this._openingSize)
		}
	})

	/**
	 * The rectangles/polygons representing the obstacle.
	 */
	Object.defineProperty(this, 'rectangles', {
		get() {
			const obstacleVerticalPosition = 0
			const obstacleHeight = this._height
			const bottomPipeVerticalPosition = obstacleVerticalPosition
			const topPipeVerticalPosition = obstacleHeight - this._topPipeSize

			const bottomPipeRectangle = new Rectangle(
				this._horizontalPosition, bottomPipeVerticalPosition,
				this._width, this._bottomPipeSize
			)

			const topPipeRectangle = new Rectangle(
				this._horizontalPosition, topPipeVerticalPosition,
				this._width, this._topPipeSize
			)
			return [bottomPipeRectangle, topPipeRectangle]
		}
	})

	this._adjustTopPipeHeight = function(newBottomPipeSize, newOpeningSize) {
		let newTopPipeSize = this._height - (newBottomPipeSize + newOpeningSize)
		if (newTopPipeSize < 0)
			newTopPipeSize = 0

		this._topPipeSize = newTopPipeSize
		this._topPipeNode.style.height = `${newTopPipeSize}%`
	}
}

/**
 * Encapsulates the HTML elements for the score in the game.
 * 
 * @param {HTMLElement} parent The parent HTML element for the score elements.
 */
function Score(parent) {
	const score = document.createElement('div')
	score.classList.add('score')
	score.textContent = '0'
	parent.appendChild(score)
	
	this._scoreNode = score
	this._points = 0

	/**
	 * Resets the score points.
	 */
	this.reset = function() {
		this._points = 0
		this._scoreNode.textContent = 0
	}

	/**
	 * Adds points to the score.
	 * 
	 * @param {number} incrementValue The number of points to add.
	 */
	this.increment = function(incrementValue = 1) {
		this._points += incrementValue
		this._scoreNode.textContent = this._points
	}
}

/**
 * Encapsulates the HTML elements for the bird in the game.
 * 
 * @param {HTMLElement} parent The parent HTML element for the bird elements.
 */
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

	/**
	 * The horizontal position of the bird, in percentage units.
	 */
	Object.defineProperty(this, 'horizontalPosition', {
		get() {
			return this._horizontalPosition
		},
		set(newValue) {
			this._horizontalPosition = newValue
			this._birdNode.style.left = `${newValue}%`
		}
	})

	/**
	 * The vertical position of the bird, in percentage units.
	 */
	Object.defineProperty(this, 'verticalPosition', {
		get() {
			return this._verticalPosition
		},
		set(newValue) {
			this._verticalPosition = newValue
			this._birdNode.style.bottom = `${newValue}%`
		}
	})

	/**
	 * The rectangles/polygons representing the bird.
	 */
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

const OBSTACLES_WIDTH = 10
const OBSTACLES_DISTANCE_BETWEEN = 15
const OBSTACLES_OPENING_SIZE = 30

const GAME_FRAME_INTERVAL = 30 // in ms
const GAME_OBSTACLE_POSITION_DECREMENT = 0.3
const GAME_BIRD_VPOSITION_INCREMENT = 0.8
const GAME_BIRD_VPOSITION_DECREMENT = 0.5


function BirdAnimator(bird, birdPositionIncrement, birdPositionDecrement,
	stageVerticalLowerLimit, stageVerticalUpperLimit) {

	const BIRD_INITIAL_VERTICAL_POSITION = 50
	const BIRD_FIXED_HORIZONTAL_POSITION = 10

	this._bird = bird
	this._bird.horizontalPosition = BIRD_FIXED_HORIZONTAL_POSITION
	this._bird.verticalPosition = BIRD_INITIAL_VERTICAL_POSITION

	this._userInputMouseClicked = false
	this._userInputKeyPressed = false


	this.onMouseDown = function() {
		this._userInputMouseClicked = true
	}
	
	this.onMouseUp = function() {
		this._userInputMouseClicked = false
	}
	
	this.onKeyDown = function() {
		this._userInputKeyPressed = true
	}
	
	this.onKeyUp = function() {
		this._userInputKeyPressed = false
	}

	this.onFrameUpdate = function() {
		// Bird position update
		const birdUpperEndOfCourse = stageVerticalUpperLimit - this._bird.height // i.e. 100% - height
		const birdLowerEndOfCourse = stageVerticalLowerLimit

		const inputBirdIsFlying = this._userInputKeyPressed || this._userInputMouseClicked
		if (inputBirdIsFlying) {
			if (this._bird.verticalPosition < birdUpperEndOfCourse) {
				this._bird.verticalPosition += birdPositionIncrement
			} else {
				this._bird.verticalPosition = birdUpperEndOfCourse
			}
		}	else {
			if (this._bird.verticalPosition > birdLowerEndOfCourse) {
				this._bird.verticalPosition -= birdPositionDecrement
			} else {
				this._bird.verticalPosition = birdLowerEndOfCourse
			}
		}
	}
}

function ObstaclesAnimator(gameStage,
	birdVerticalPositionIncrement, birdVerticalPositionDecrement, birdWidth, birdHeight) {

	const OBSTACLES_INITIAL_POSITION = STAGE_HORIZONTAL_UPPER_LIMIT // start out of stage
	const OBSTACLES_POSITION_OFFSET = OBSTACLES_WIDTH + OBSTACLES_DISTANCE_BETWEEN
	const OBSTACLES_OPENING_HEIGHT_UPPER_LIMIT = STAGE_VERTICAL_UPPER_LIMIT - OBSTACLES_OPENING_SIZE
	const OBSTACLES_OPENING_HEIGHT_LOWER_LIMIT = 0

	const GAME_FRAMES_BETWEEN_OBSTACLES =
		Math.floor((OBSTACLES_DISTANCE_BETWEEN - birdWidth) / GAME_OBSTACLE_POSITION_DECREMENT)
	const GAME_BIRD_MAX_UP_TRAVEL_BETWEEN_OBSTACLES =
		GAME_FRAMES_BETWEEN_OBSTACLES * birdVerticalPositionIncrement
	const GAME_BIRD_MAX_DOWN_TRAVEL_BETWEEN_OBSTACLES =
		GAME_FRAMES_BETWEEN_OBSTACLES * birdVerticalPositionDecrement
	const GAME_BIRD_TRAVEL_GAP = birdHeight * 2


	this.onFrameUpdate = function() {
		// Obstacles position update
		this._obstacles.forEach((obstacle) => obstacle.position -= GAME_OBSTACLE_POSITION_DECREMENT)
		
		// End of obstacle course condition
		const lastObstacle = this._obstacles[this._obstacles.length - 1]
		const obstacleStartOfCourse = lastObstacle.position + OBSTACLES_POSITION_OFFSET
		const obstacleEndOfCourse = STAGE_HORIZONTAL_LOWER_LIMIT - this._obstacles[0].width // 0% - width
		if (this._obstacles[0].position <= obstacleEndOfCourse) {
			// Each obstacle disapears on the left side of screen (end of course) and reappears on
			// the right side of the screen (start of course) in a circular manner.
			// The same way, its position in the array is circular. Below, I'm shifting the obstacles
			// array and putting the obstacle in the first position back to the end position.
			this._obstacles[0].position = obstacleStartOfCourse
			const swapTemp = this._obstacles[0]
			let i
			for (i = 1; i < this._obstacles.length; i++) {
				this._obstacles[i - 1] = this._obstacles[i]
			}
			this._obstacles[i - 1] = swapTemp

			this._randomizeOpeningPositionForNewObstacle(this._obstacles[i - 1], this._obstacles[i - 2])
			//obstacleScoredAlready = false
		}
	}

	this._setRandomOpeningPositionForObstacle = function(obstacle, minPosition, maxPosition) {
		obstacle.openingPosition = Math.random() * (maxPosition - minPosition) + minPosition
	}

	this._randomizeOpeningPositionForNewObstacle = function(newObstacle, previousObstacle) {
		//                Previous
		//                  v       New
		//                           v
		//                          | |                                          | |
		//        +------> +-+\     | | <----------+        +---------> +-+\     | |
		//        |        | | \    | |            |        |           | | \    | |
		// openingPosition | |  \   | |             Bird max            | |  \   +-+ <--+-------+
		//                 | |   \  | |            down travel          | |   \         |       |
		//                 | |    \ | |            |        |           | |    \       Gap      |
		//                 | |     \+-+ <----------+        +---------> | |     \    <--+     Opening
		//                 | |           (Gap = 0) |                    | |                    size
		//                 | |                     |                    | |                     |
		//                 | |                   Opening                | |      +-+ <----------+
		//                 | |                    size                  | |      | |
		//                 | |                     |                    | |      | |
		//                 | |      +-+ <----------+                    | |      | |
		//                 | |      | |                                 | |      | |
		//                  Without Gap                                   With Gap
		//                         (the greater the gap, the easier the game)
		// From the image above we derive the calculus below:
		let minOpeningPosition = (previousObstacle.openingPosition -
			GAME_BIRD_MAX_DOWN_TRAVEL_BETWEEN_OBSTACLES - OBSTACLES_OPENING_SIZE) + GAME_BIRD_TRAVEL_GAP
		if (minOpeningPosition < OBSTACLES_OPENING_HEIGHT_LOWER_LIMIT) {
			minOpeningPosition = OBSTACLES_OPENING_HEIGHT_LOWER_LIMIT
		}
	
		//                Previous
		//                  v       New
		//                           v
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
		// (OpeningPosition         | |                                          | |
		//       +                  | |                                          | |
		//  openingSize)            | |                                          | |
		//                  Without Gap                                   With Gap
		//                         (the greater the gap, the easier the game)
		// From the image above we derive the calculus below:
		let maxOpeningPosition = (previousObstacle.openingPosition + OBSTACLES_OPENING_SIZE +
			GAME_BIRD_MAX_UP_TRAVEL_BETWEEN_OBSTACLES) - GAME_BIRD_TRAVEL_GAP
		if (maxOpeningPosition > OBSTACLES_OPENING_HEIGHT_UPPER_LIMIT) {
			maxOpeningPosition = OBSTACLES_OPENING_HEIGHT_UPPER_LIMIT
		}

		this._setRandomOpeningPositionForObstacle(newObstacle, minOpeningPosition, maxOpeningPosition)
	}


	// Maximum number of obstacles visible on screen possible
	const OBSTACLES_MAX_NUMBER_OF = Math.floor(
		STAGE_HORIZONTAL_UPPER_LIMIT / OBSTACLES_POSITION_OFFSET) + 1

	this._obstacles = Array(OBSTACLES_MAX_NUMBER_OF)

	this._obstacles[0] = new Obstacle(gameStage)
	this._obstacles[0].position = OBSTACLES_INITIAL_POSITION
	this._obstacles[0].openingSize = OBSTACLES_OPENING_SIZE
	this._setRandomOpeningPositionForObstacle(this._obstacles[0],
		OBSTACLES_OPENING_HEIGHT_LOWER_LIMIT, OBSTACLES_OPENING_HEIGHT_UPPER_LIMIT)

	for (i = 1; i < OBSTACLES_MAX_NUMBER_OF; i++) {
		this._obstacles[i] = new Obstacle(gameStage)
		this._obstacles[i].position = OBSTACLES_INITIAL_POSITION + i*OBSTACLES_POSITION_OFFSET
		this._obstacles[i].openingSize = OBSTACLES_OPENING_SIZE
		this._randomizeOpeningPositionForNewObstacle(this._obstacles[i], this._obstacles[i - 1])
	}
}

function GameApp(stage) {
	const gameStage = stage
	let obstacleScoredAlready = false

	const score = new Score(gameStage)
	const bird = new Bird(gameStage)

	this._birdAnimator = new BirdAnimator(bird,
		GAME_BIRD_VPOSITION_INCREMENT, GAME_BIRD_VPOSITION_DECREMENT,
		STAGE_VERTICAL_LOWER_LIMIT, STAGE_VERTICAL_UPPER_LIMIT)

	this._obstacleAnimator = new ObstaclesAnimator(gameStage,
		GAME_BIRD_VPOSITION_INCREMENT, GAME_BIRD_VPOSITION_DECREMENT, bird.width, bird.height)

	function didPlayerScoreOnePoint(bird, obstacle, obstacleScoredAlready) {
		if (bird.horizontalPosition > (obstacle.position + obstacle.width)) {
			return (!obstacleScoredAlready)
		} else {
			return false
		}
	}

	this.getBirdAnimator = function() {
		return this._birdAnimator
	}

	this.onFrameUpdate = function() {
		// Bird position update
		this._birdAnimator.onFrameUpdate()

		this._obstacleAnimator.onFrameUpdate()

		// Score update
		let playerScoredOnePoint = 0//didPlayerScoreOnePoint(bird, obstacles[0], obstacleScoredAlready)
		if (playerScoredOnePoint) {
			score.increment()
		}
		obstacleScoredAlready |= playerScoredOnePoint

		// Game over condition
		// const birdRectangle = bird.rectangles[0]
		// const obstacleRectangles = obstacles[0].rectangles
		// let gameIsOver = obstacleRectangles.some(rectangle => birdRectangle.isOverlapping(rectangle))
		return true//return !gameIsOver
	}
}

const gameApp = new GameApp(gameStage)

const birdAnimator = gameApp.getBirdAnimator()
window.onmousedown = birdAnimator.onMouseDown.bind(birdAnimator)
window.onmouseup = birdAnimator.onMouseUp.bind(birdAnimator)
window.onkeydown = birdAnimator.onKeyDown.bind(birdAnimator)
window.onkeyup = birdAnimator.onKeyUp.bind(birdAnimator)

const intervalId = window.setInterval(() => {
	if (!gameApp.onFrameUpdate()) {
		clearInterval(intervalId)
	}
}, GAME_FRAME_INTERVAL)
