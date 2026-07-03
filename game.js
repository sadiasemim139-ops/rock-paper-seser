const choices = ['rock', 'paper', 'scissors'];
const bengaliChoices = {
    'rock': 'পাথর (Rock)',
    'paper': 'কাগজ (Paper)',
    'scissors': 'কাঁচি (Scissors)'
};

let playerScore = 0;
let computerScore = 0;

const playerDisplay = document.getElementById('player-score');
const computerDisplay = document.getElementById('computer-score');
const resultDisplay = document.getElementById('result-display');
const choiceButtons = document.querySelectorAll('.choice-btn');
const resetBtn = document.getElementById('reset-btn');

function getComputerChoice() {
    const randomIndex = Math.floor(Math.random() * 3);
    return choices[randomIndex];
}

function determineWinner(player, computer) {
    if (player === computer) return 'tie';

    if (
        (player === 'rock' && computer === 'scissors') ||
        (player === 'paper' && computer === 'rock') ||
        (player === 'scissors' && computer === 'paper')
    ) {
        return 'win';
    }

    return 'lose';
}

function playGame(playerChoice) {
    const computerChoice = getComputerChoice();
    const result = determineWinner(playerChoice, computerChoice);

    // Remove previous result classes
    resultDisplay.className = 'result-display';

    // Trigger reflow for animation
    void resultDisplay.offsetWidth;

    let message = '';

    if (result === 'win') {
        playerScore++;
        message = `You win! ${bengaliChoices[playerChoice]} beats ${bengaliChoices[computerChoice]}.`;
        resultDisplay.classList.add('win');
    } else if (result === 'lose') {
        computerScore++;
        message = `You lose! ${bengaliChoices[computerChoice]} beats ${bengaliChoices[playerChoice]}.`;
        resultDisplay.classList.add('lose');
    } else {
        message = `It's a tie! Both chose ${bengaliChoices[playerChoice]}.`;
        resultDisplay.classList.add('tie');
    }

    updateScore();
    resultDisplay.textContent = message;
}

function updateScore() {
    playerDisplay.textContent = playerScore;
    computerDisplay.textContent = computerScore;
}

function resetGame() {
    playerScore = 0;
    computerScore = 0;
    updateScore();
    resultDisplay.textContent = 'Make your move! / আপনার চাল দিন!';
    resultDisplay.className = 'result-display';
}

choiceButtons.forEach(button => {
    button.addEventListener('click', () => {
        playGame(button.id);
    });
});

resetBtn.addEventListener('click', resetGame);
