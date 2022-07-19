const gameStage = document.querySelector('.content [wm-flappy]')

// sample obstacle
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

gameStage.appendChild(obstacle)

// sample score
const score = document.createElement('div')
score.classList.add('score')
score.textContent = '0'
gameStage.appendChild(score)

// sample bird
const bird = document.createElement('img')
bird.src = 'imgs/passaro.png'
bird.classList.add('bird')
gameStage.appendChild(bird)
