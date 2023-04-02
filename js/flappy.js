/**
 * Gets a CSS property of an element as percentage relative to its parent.
 * 
 * @param {HTMLElement} element The HTML element to read the CSS property
 * @param {String} property The CSS property to read.
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
 * @param {Number} originX The rectangle position on X axis
 * @param {Number} originY The rectangle position on Y axis
 * @param {Number} width   The width of the rectangle
 * @param {Number} height  The height of the rectangle
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
	// +------------+ <---+  <-------+           100%
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
	// +------------+ <---+  <-------+             0%
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

/**
 * Encapsulates the logic to animate the bird.
 * 
 * @param {Bird} bird The bird to animate.
 * @param {Number} birdPositionIncrement The bird vertical position increment on every frame.
 * @param {Number} birdPositionDecrement The bird vertical position decrement on every frame.
 * @param {Number} birdInitialVerticalPosition The bird vertical position at the start of the animation.
 * @param {Number} birdFixedHorizontalPosition The bird horizontal position.
 * @param {Number} stageVerticalLowerLimit The lower limit for the bird travel.
 * @param {Number} stageVerticalUpperLimit The upper limit for the bird travel.
 */
function BirdAnimator(bird,
	birdPositionIncrement, birdPositionDecrement,
	birdInitialVerticalPosition, birdFixedHorizontalPosition,
	stageVerticalLowerLimit, stageVerticalUpperLimit) {

	this._bird = bird
	this._birdPositionIncrement = birdPositionIncrement
	this._birdPositionDecrement = birdPositionDecrement
	this._stageVerticalLowerLimit = stageVerticalLowerLimit
	this._stageVerticalUpperLimit = stageVerticalUpperLimit
	this._birdInitialVerticalPosition = birdInitialVerticalPosition
	this._birdFixedHorizontalPosition = birdFixedHorizontalPosition


	this._bird.horizontalPosition = this._birdFixedHorizontalPosition
	this._bird.verticalPosition = this._birdInitialVerticalPosition

	this._userInputMouseClicked = false
	this._userInputKeyPressed = false


	/**
	 * Mouse down event function.
	 */
	this.onMouseDown = function() {
		this._userInputMouseClicked = true
	}

	/**
	 * Mouse up event function.
	 */
	this.onMouseUp = function() {
		this._userInputMouseClicked = false
	}

	/**
	 * Key down event function.
	 */
	this.onKeyDown = function() {
		this._userInputKeyPressed = true
	}

	/**
	 * Key up event function.
	 */
	this.onKeyUp = function() {
		this._userInputKeyPressed = false
	}

	/**
	 * Event function called when the game is started.
	 */
	this.onGameStart = function() {
		this._bird.verticalPosition = this._birdInitialVerticalPosition
	}

	/**
	 * Event function called on every frame update.
	 */
	this.onFrameUpdate = function() {
		// Bird position update
		const birdUpperEndOfCourse =
			this._stageVerticalUpperLimit - this._bird.height // i.e. 100% - height
		const birdLowerEndOfCourse = this._stageVerticalLowerLimit

		const inputBirdIsFlying = this._userInputKeyPressed || this._userInputMouseClicked
		if (inputBirdIsFlying) {
			if (this._bird.verticalPosition < birdUpperEndOfCourse) {
				this._bird.verticalPosition += this._birdPositionIncrement
			} else {
				this._bird.verticalPosition = birdUpperEndOfCourse
			}
		}	else {
			if (this._bird.verticalPosition > birdLowerEndOfCourse) {
				this._bird.verticalPosition -= this._birdPositionDecrement
			} else {
				this._bird.verticalPosition = birdLowerEndOfCourse
			}
		}
	}
}

/**
 * Encapsulates the logic to animate an obstacle cyclically.
 * 
 * @param {Obstacle} obstacle The obstacle to animate.
 * @param {Number} obstaclePositionDecrement The obstacle position decrement on every frame.
 * @param {Number} obstacleStartPosition The obstacle position at the start of the first animation cycle.
 * @param {Number} obstacleRestartPosition The obstacle position at the start of all animation cycles, except the first.
 * @param {Number} obstacleOpeningSize The obstacle opening size
 * @param {Number} scorePositionThreshold The point in the obstacle travel that we consider that the obstacle was passed and the player scored 1 point.
 * @param {Number} stageHorizontalLowerLimit The lower limit for the obstacle travel.
 * @param {Number} stageHorizontalUpperLimit The upper limit for the obstacle travel.
 * @param {Function} onAnimationStartFunction Notification function called every time a new animation cycle is started.
 * @param {Function} onScoreFunction Notification function called every time an obstacle is passed (player scored 1 point).
 */
function ObstacleAnimator(obstacle,
	obstaclePositionDecrement, obstacleStartPosition,
	obstacleRestartPosition, obstacleOpeningSize, scorePositionThreshold,
	stageHorizontalLowerLimit, stageHorizontalUpperLimit,
	onAnimationStartFunction, onScoreFunction) {

	this._obstacle = obstacle
	this._obstaclePositionDecrement = obstaclePositionDecrement
	this._obstacleStartPosition = obstacleStartPosition
	this._obstacleRestartPosition = obstacleRestartPosition
	this._obstacleOpeningSize = obstacleOpeningSize
	this._scorePositionThreshold = scorePositionThreshold
	this._stageHorizontalLowerLimit = stageHorizontalLowerLimit
	this._stageHorizontalUpperLimit = stageHorizontalUpperLimit
	this._onAnimationStartFunction = onAnimationStartFunction
	this._onScoreFunction = onScoreFunction


	this._obstacle.position = obstacleStartPosition
	this._obstacle.openingSize = this._obstacleOpeningSize


	/**
	 * Event function called when the game is started.
	 */
	this.onGameStart = function() {
		this._obstacle.position = this._obstacleStartPosition
		this._onAnimationStartFunction(this._obstacle)
	}

	/**
	 * Event function called on every frame update.
	 */
	this.onFrameUpdate = function() {
		// Obstacle position update
		this._obstacle.position -= this._obstaclePositionDecrement
		
		// End of obstacle course condition
		const obstacleStartOfCourse = this._obstacleRestartPosition
		const obstacleEndOfCourse = this._stageHorizontalLowerLimit - this._obstacle.width
		if (this._obstacle.position <= obstacleEndOfCourse) {
			this._obstacle.position = this._obstacleRestartPosition
			this._onAnimationStartFunction(this._obstacle)
		}

		// Obstacle passed the score position condition
		if ( (this._obstacle.position < this._scorePositionThreshold) &&
		     ((this._obstacle.position + this._obstaclePositionDecrement) >= this._scorePositionThreshold) ) {
			this._onScoreFunction()
		}
	}
}

/**
 * Main class, contains the logic for the pipes randomization, the score computation,
 * the colision processing and other things.
 * 
 * @param {HTMLElement} stage The parent HTML element for the game elements.
 */
function GameApp(stage) {

	/** Frame update interval, in milliseconds. */
	const GAME_FRAME_INTERVAL = 30

	/**
	 * Horizontal position where the stage ends (right side of the screen) in %.
	 * Minimum: 0%, Maximum: 100%
	 */
	const STAGE_HORIZONTAL_UPPER_LIMIT = 100

	/**
	 * Horizontal position where the stage begins (left side of the screen) in %.
	 * Minimum: 0%, Maximum: 100%
	 */
	const STAGE_HORIZONTAL_LOWER_LIMIT = 0

	/**
	 * Vertical position where the stage ends (top side of the screen) in %.
	 * Minimum: 0%, Maximum: 100%
	 */
	const STAGE_VERTICAL_UPPER_LIMIT = 100

	/**
	 * Vertical position where the stage begins (bottom side of the screen) in %.
	 * Minimum: 0%, Maximum: 100%
	 */
	const STAGE_VERTICAL_LOWER_LIMIT = 0


	/** Bird width in %. Minimum: 0%, Maximum: 100% */
	const BIRD_WIDTH = 4

	/** Bird height in %. Minimum: 0%, Maximum: 100% */
	const BIRD_HEIGHT = 5

	/** Bird initical vertical position in %. Minimum: 0%, Maximum: 100% */
	const BIRD_INITIAL_VERTICAL_POSITION = 50

	/** Bird horizontal position in %. Minimum: 0%, Maximum: 100% */
	const BIRD_FIXED_HORIZONTAL_POSITION = 15

	/** Bird vertical position increment on each frame update, in %. Minimum: 0%, Maximum: 100% */
	const BIRD_VPOSITION_INCREMENT = 0.8

	/** Bird vertical position decrement on each frame update, in %. Minimum: 0%, Maximum: 100% */
	const BIRD_VPOSITION_DECREMENT = 0.5

	/** Width for every obstacle, in %. Minimum: 0%, Maximum: 100% */
	const OBSTACLES_WIDTH = 10

	/** Distance between the end of an obstacle and the start of the next one, in %. Minimum: 0%, Maximum: 100% */
	const OBSTACLES_DISTANCE_BETWEEN = 15

	/** Opening size for every obstacle, in %. Minimum: 0%, Maximum: 100% */
	const OBSTACLES_OPENING_SIZE = 30

	/** Obstacle position decrement on each frame update, in %. Minimum: 0%, Maximum: 100% */
	const OBSTACLES_POSITION_DECREMENT = 0.3

	/** Initial position for the first obstacle, in %. Minimum: 0%, Maximum: 100% */
	const OBSTACLES_INITIAL_POSITION = STAGE_HORIZONTAL_UPPER_LIMIT // start out of stage

	/** Distance between the start of an obstacle and the start of the next one, in %. Minimum: 0%, Maximum: 100% */
	const OBSTACLES_POSITION_OFFSET = OBSTACLES_WIDTH + OBSTACLES_DISTANCE_BETWEEN

	/** Maximum height for an obstacle opening position, in %. Minimum: 0%, Maximum: 100% */
	const OBSTACLES_OPENING_POSITION_UPPER_LIMIT = STAGE_VERTICAL_UPPER_LIMIT - OBSTACLES_OPENING_SIZE

	/** Minimum height for an obstacle opening position, in %. Minimum: 0%, Maximum: 100% */
	const OBSTACLES_OPENING_POSITION_LOWER_LIMIT = 0

	/**
	 * Number of frames between an obstacle and the next one. Given a position on screen,
	 * once an obstacle passed by it, this is the number of frames needed to the next
	 * obstacle to reach the same position.
	 */
	const OBSTACLES_FRAMES_BETWEEN =
		Math.floor((OBSTACLES_DISTANCE_BETWEEN - BIRD_WIDTH) / OBSTACLES_POSITION_DECREMENT)

	/** Maximum distance upwards that the bird can fly since it passes an obstacle until it reaches the next one. */
	const BIRD_MAX_UP_TRAVEL_BETWEEN_OBSTACLES =
		OBSTACLES_FRAMES_BETWEEN * BIRD_VPOSITION_INCREMENT

	/** Maximum distance downwards that the bird can fly since it passes an obstacle until it reaches the next one. */
	const BIRD_MAX_DOWN_TRAVEL_BETWEEN_OBSTACLES =
		OBSTACLES_FRAMES_BETWEEN * BIRD_VPOSITION_DECREMENT

	/** Defines how hard is to travel between an obstacle and the next one. */
	const BIRD_TRAVEL_GAP = BIRD_HEIGHT * 2

	/** Maximum number of obstacles visible on screen possible */
	const OBSTACLES_MAX_NUMBER_OF = Math.floor(
		STAGE_HORIZONTAL_UPPER_LIMIT / OBSTACLES_POSITION_OFFSET) + 1


	this._gameStage = stage

	this._score = new Score(this._gameStage)
	this._bird = new Bird(this._gameStage)
	this._bird.width = BIRD_WIDTH
	this._bird.height = BIRD_HEIGHT

	this._birdAnimator = new BirdAnimator(this._bird,
		BIRD_VPOSITION_INCREMENT, BIRD_VPOSITION_DECREMENT,
		BIRD_INITIAL_VERTICAL_POSITION, BIRD_FIXED_HORIZONTAL_POSITION,
		STAGE_VERTICAL_LOWER_LIMIT, STAGE_VERTICAL_UPPER_LIMIT)

	this._obstacles = new Array(OBSTACLES_MAX_NUMBER_OF)
	this._obstacleAnimators = new Array(OBSTACLES_MAX_NUMBER_OF)

	for (i = 0; i < OBSTACLES_MAX_NUMBER_OF; i++) {
		this._obstacles[i] = new Obstacle(this._gameStage)
		const obstacleScorePosition = BIRD_FIXED_HORIZONTAL_POSITION - OBSTACLES_WIDTH
		this._obstacleAnimators[i] = new ObstacleAnimator(this._obstacles[i],
			OBSTACLES_POSITION_DECREMENT,
			OBSTACLES_INITIAL_POSITION + i*OBSTACLES_POSITION_OFFSET,
			OBSTACLES_MAX_NUMBER_OF*OBSTACLES_POSITION_OFFSET - OBSTACLES_WIDTH,
			OBSTACLES_OPENING_SIZE,
			obstacleScorePosition,
			STAGE_HORIZONTAL_LOWER_LIMIT,
			STAGE_HORIZONTAL_UPPER_LIMIT,
			(obstacle) => this._onObstacleAnimationStart(obstacle),
			() => this._onPlayerPointScored())
	}
	this._lastObstacleRandomized = this._obstacles[0]
	this._indexOfNextObstacleToScore = 0


	/** Gets the BirdAnimator instance used in the game. */
	this.getBirdAnimator = function() {
		return this._birdAnimator
	}


	/**
	 * Randomize the opening position of an obstacle using position limits.
	 * 
	 * @param {Obstacle} obstacle The obstacle to randomize the opening position.
	 * @param {Number} minPosition The minimum limit for the opening position.
	 * @param {Number} maxPosition The maximum limit for the opening position.
	 */
	this._setRandomOpeningPositionForObstacle = function(obstacle, minPosition, maxPosition) {
		obstacle.openingPosition = Math.random() * (maxPosition - minPosition) + minPosition
	}

	/**
	 * Randomizes the opening position for the next obstacle based on the previous obstacle.
	 * The randomization is performed in a way that the bird is always able to reach the
	 * next opening. If the positions are randomized without any parameters using the entire
	 * vertical screen space, it may happen that the generated opening position is too far
	 * for the bird to reach. That's why we use the previous obstacle and the bird's travel
	 * capacity as parameters.
	 * 
	 * @param {Obstacle} newObstacle The next obstacle to randomize the opening position.
	 * @param {Obstacle} previousObstacle The previous obstacle.
	 */
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
			BIRD_MAX_DOWN_TRAVEL_BETWEEN_OBSTACLES - OBSTACLES_OPENING_SIZE) + BIRD_TRAVEL_GAP
		if (minOpeningPosition < OBSTACLES_OPENING_POSITION_LOWER_LIMIT) {
			minOpeningPosition = OBSTACLES_OPENING_POSITION_LOWER_LIMIT
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
			BIRD_MAX_UP_TRAVEL_BETWEEN_OBSTACLES) - BIRD_TRAVEL_GAP
		if (maxOpeningPosition > OBSTACLES_OPENING_POSITION_UPPER_LIMIT) {
			maxOpeningPosition = OBSTACLES_OPENING_POSITION_UPPER_LIMIT
		}

		this._setRandomOpeningPositionForObstacle(newObstacle, minOpeningPosition, maxOpeningPosition)
	}

	/**
	 * Notification function called when the player passed one obstacle.
	 */
	this._onPlayerPointScored = function() {
		this._score.increment()

		// Each obstacle disapears and reappears on the screen in a circular manner.
		// Therefore they are also scored in a circular manner.
		this._indexOfNextObstacleToScore++
		if (this._indexOfNextObstacleToScore >= this._obstacles.length) {
			this._indexOfNextObstacleToScore = 0
		}
	}

	/**
	 * Notification function called when a new animation cycle starts for an obstacle.
	 */
	this._onObstacleAnimationStart = function(obstacle) {
		this._randomizeOpeningPositionForNewObstacle(obstacle, this._lastObstacleRandomized)
		this._lastObstacleRandomized = obstacle
	}

	/**
	 * Event function called when the game is started.
	 */
	this._onGameStart = function() {
		this._score.reset()
		this._birdAnimator.onGameStart()

		this._setRandomOpeningPositionForObstacle(this._lastObstacleRandomized,
			OBSTACLES_OPENING_POSITION_LOWER_LIMIT, OBSTACLES_OPENING_POSITION_UPPER_LIMIT)
		this._obstacleAnimators.forEach(animator => animator.onGameStart())
	}

	/**
	 * Updates the game screen.
	 */
	this._updateFrame = function() {
		this._birdAnimator.onFrameUpdate()
		this._obstacleAnimators.forEach((animator) => animator.onFrameUpdate())
	}

	/**
	 * Checks if the game over condition.
	 * 
	 * @returns true if the game over condition is fulfilled.
	 */
	this.isGameOver = function() {
		const birdRectangle = this._bird.rectangles[0]
		const obstacleRectangles =
			this._obstacles[this._indexOfNextObstacleToScore].rectangles
		const gameIsOver = obstacleRectangles.some(
			rectangle => birdRectangle.isOverlapping(rectangle))
		return gameIsOver
	}

	/**
	 * Starts/Restarts the game.
	 */
	this.start = function() {
		this._onGameStart()

		const intervalId = window.setInterval(() => {
			this._updateFrame()
			if (this.isGameOver()) {
				clearInterval(intervalId)
			}
		}, GAME_FRAME_INTERVAL)
	}
}

const gameStage = document.querySelector('.content [wm-flappy]')
const gameApp = new GameApp(gameStage)

const birdAnimator = gameApp.getBirdAnimator()
window.onmousedown = birdAnimator.onMouseDown.bind(birdAnimator)
window.onmouseup = birdAnimator.onMouseUp.bind(birdAnimator)
window.onkeydown = birdAnimator.onKeyDown.bind(birdAnimator)
window.onkeyup = birdAnimator.onKeyUp.bind(birdAnimator)

gameApp.start()
