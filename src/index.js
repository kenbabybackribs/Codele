import codeleWords from "./target";
import { WORD_LENGTH } from "./config";
import { FLIP_DURATION } from "./config";
import { DANCE_ANIMATION } from "./config";

let DAILY_WORD

const keyboard = document.querySelector('.keyboard')
const guessGrid = document.querySelector('.guess')
const alertContainer = document.querySelector(`[data-alert-container]`)

const setLocalStorage = function (word) {
    localStorage.setItem("dailyWord", JSON.stringify(word))
}

const getLocalStorage = function () {
    const newWord =  localStorage.getItem("dailyWord")
    if (!newWord) return
    const parsedNewWord = JSON.parse(newWord)
    DAILY_WORD = parsedNewWord
    return DAILY_WORD
}

document.addEventListener('DOMContentLoaded', getLocalStorage)

const getCurrentDate = function () {
    return new Date().toISOString().slice(0, 10)
}

const getCurrentTime = function () {
    const now = new Date()
    return now.getHours()
}

const getWord = function () {
    const today = getCurrentDate()
    const seed = today
    const seedNumber = +seed.replaceAll('-', '')
    const index = seedNumber % codeleWords.length
    DAILY_WORD = codeleWords[index]
    setLocalStorage(DAILY_WORD)
    return DAILY_WORD
}



const getWordForToday = function () {
    const currentTime = getCurrentTime()
    if (currentTime === 6) {
        localStorage.clear()
        return getWord()
    } 
        
    if (!DAILY_WORD) DAILY_WORD = getWord()
    return DAILY_WORD
}

const word = getWordForToday()

const startInteraction = function () {
    document.addEventListener('click', handleMouseClick)
    document.addEventListener('keydown', handleKeyPress)
}

const stopInteraction = function () {
    document.removeEventListener('click', handleMouseClick)
    document.removeEventListener('keydown', handleKeyPress)
}

const handleMouseClick = function (e) {
    if (e.target.matches("[data-key]")) {
        pressKey(e.target.dataset.key)
        return
    }

    if (e.target.matches("[data-enter]")) {
        submitGuess()
        return 
    }

    if(e.target.closest("[data-delete]")) {
        deleteKey()
        return
}

}

const handleKeyPress = function (e) {
    if (e.key === "Enter") {
        submitGuess()
        return
    }


    if (e.key === "Backspace" || e.key === "Space") {
        deleteKey()
        return
    }

    if (e.key.match(/^[a-z]$/)) {
        pressKey(e.key)
    }
}

startInteraction()

const pressKey = function (key) {
    const activeTiles = getActiveTiles()
    if (activeTiles.length >= WORD_LENGTH) return 
    const nextTile = guessGrid.querySelector(':not([data-letter])')
    nextTile.dataset.letter = key.toLowerCase()
    nextTile.textContent = key
    nextTile.dataset.state = "active"
}

const getActiveTiles = function () {
    return guessGrid.querySelectorAll('[data-state="active"]')
}

const deleteKey = function () {
    const activeTiles = getActiveTiles()
    const lastTile = activeTiles[activeTiles.length - 1]
    if(lastTile === undefined) return
    lastTile.textContent = ''
    delete lastTile.dataset.state
    delete lastTile.dataset.letter
}


const submitGuess = function () {
    const activeTiles = [...getActiveTiles()]
    if (activeTiles.length !== WORD_LENGTH) {
        showAlert("Not enough letters")
        shakeTiles(activeTiles)
        return
    }

    const guess = activeTiles.reduce((word, tile )=> {
        return word + tile.dataset.letter
    }, "")

    if (!codeleWords.includes(guess)) {
        showAlert("Not in word list")
        shakeTiles(activeTiles)
        return
    }

    stopInteraction()
    activeTiles.forEach((...params) => flipTiles(...params, guess))
}

const showAlert = function (message, duration=1000) {
    const alert = document.createElement("div")
    alert.textContent = message
    alert.classList.add('alert')
    alertContainer.prepend(alert)

    if (duration === null) return
    setTimeout(() => {
        alert.classList.add("hide")
        alert.addEventListener('transitionend', () => alert.remove())
    }, duration)
} 

const shakeTiles = function (tiles) {
    tiles.forEach(tile => {
        tile.classList.add("shake")
        tile.addEventListener('animationend', () => {
            tile.classList.remove("shake")
        }, {once: true})
    })
}

const danceTiles = function (tiles) {
    tiles.forEach((tile, index)=> {
        setTimeout(function () {
            tile.classList.add("dance")
            tile.addEventListener('animationend', () => {
                tile.classList.remove("dance")
            }, {once: true})
        }, index * DANCE_ANIMATION / 5)
    })
}

const flipTiles = function (tile, index, array, guess) {
    const letter = tile.dataset.letter 
    const key = keyboard.querySelector(`[data-key="${letter.toUpperCase()}"`)
    setTimeout(() => {
        tile.classList.add('flip')
    }, index * FLIP_DURATION / 2)

    tile.addEventListener('transitionend', () => {
        tile.classList.remove('flip')
        if (word[index] === letter) {
            tile.dataset.state = "correct"
            key.classList.add("correct")
        } 
        else if (word[index] !== letter && word.includes(letter)) {
            tile.dataset.state = "wrong-location"
            key.classList.add('wrong-location')
        }
        else  {
            tile.dataset.state = "wrong"
            key.classList.add("wrong")
        }

        if (index === array.length - 1) {
            tile.addEventListener("transitionend", () => {
                startInteraction()
                checkWinLose(guess, array)
            }, {once: true})
        }
    }, {once: true})
}



const checkWinLose = function(guess, tiles) {
    if (guess === word) {
        showAlert("You win", 2500)
        danceTiles(tiles)
        stopInteraction()
        return
    }
    const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])")

    if (remainingTiles.length === 0) {
        showAlert(word.toUpperCase(), null)
        stopInteraction()
        shakeTiles(tiles)
    }
}

