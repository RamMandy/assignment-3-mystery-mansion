const scrollDownButton = document.getElementById("scroll-down");
const storySection = document.getElementById("story");
const startButton = document.getElementById("start-button");
const playerNameInput = document.getElementById("player-name");
const nameError = document.getElementById("name-error");
const playerEntry = document.querySelector(".player-entry");
const gameChapters = document.getElementById("game-chapters");
const gameStatus = document.querySelector(".game-status");
const cluesSection = document.querySelector(".clues-section");
const movesDisplay = document.getElementById("moves");
const clueCountDisplay = document.getElementById("clue-count");
const cluesList = document.getElementById("clues-list");
const soundToggle = document.getElementById("sound-toggle");
const movesCircle = document.querySelector(".moves-circle");

const suspects = [
  {
    name: "Lady Evelyn",
    description: "A wealthy guest seen near the diamond."
  },
  {
    name: "Mr. Thomas",
    description: "The mansion's butler, who has access to every room."
  },
  {
    name: "Oliver",
    description: "The gardener who was outside during the blackout."
  }
];

const rooms = [
  {
    name: "Library",
    description: "You enter a quiet library filled with old books. A desk stands near the window.",
    investigations: [
      {
        id: "library-bookshelf",
        label: "Search the Bookshelf",
        result: "You discover old photographs and dusty books. Nothing useful is found.",
        clue: null
      },
      {
        id: "library-desk",
        label: "Search the Desk",
        result: "You find a letter mentioning a secret meeting with someone working at the mansion.",
        clue: "Suspicious Letter"
      }
    ]
  },
  {
    name: "Dining Room",
    description: "Lady Evelyn sits beside the fireplace. The dining table is covered with abandoned glasses.",
    investigations: [
      {
        id: "dining-evelyn",
        label: "Question Lady Evelyn",
        result: "Lady Evelyn says she saw Mr. Thomas near the diamond display shortly before the blackout.",
        clue: "Witness Statement"
      },
      {
        id: "dining-table",
        label: "Inspect the Dining Table",
        result: "You discover a muddy gardening glove beneath a chair. Could it belong to Oliver?",
        clue: null
      }
    ]
  },
  {
    name: "Study Room",
    description: "Mr. Blackwood's private study contains old documents, a wooden desk and a fireplace.",
    investigations: [
      {
        id: "study-desk",
        label: "Search the Desk",
        result: "You discover a master key marked 'Staff Access - Mr. Thomas' hidden beneath some documents.",
        clue: "Master Key"
      },
      {
        id: "study-fireplace",
        label: "Inspect the Fireplace",
        result: "You find burned papers, but nothing that helps identify the thief.",
        clue: null
      }
    ]
  }
];

let movesRemaining = 5;
let collectedClues = [];
let completedSearches = [];
let playerName = "";
let gameStarted = false;
let gameFinished = false;
let soundEnabled = true;
let audioContext = null;

scrollDownButton.addEventListener("click", function () {
  scrollToSection(storySection);
});

startButton.addEventListener("click", startGame);
soundToggle.addEventListener("click", toggleSound);

function scrollToSection(section) {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  section.scrollIntoView({
    behavior: reducedMotion ? "auto" : "smooth",
    block: "start"
  });
}

function playSound(type) {
  if (!soundEnabled) {
    return;
  }

  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  try {
    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    let frequency = 440;
    let duration = 0.1;

    if (type === "clue") {
      frequency = 880;
      duration = 0.25;
    } else if (type === "win") {
      frequency = 660;
      duration = 0.45;
    } else if (type === "lose") {
      frequency = 180;
      duration = 0.45;
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(
      0.07,
      audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.log("Sound unavailable:", error);
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  soundToggle.textContent =
    soundEnabled ? "Sound: On" : "Sound: Off";

  soundToggle.setAttribute(
    "aria-pressed",
    String(soundEnabled)
  );

  if (soundEnabled) {
    playSound("click");
  }
}

function createButton(chapter, text, action, secondary = false) {
  const actions = chapter.querySelector(".chapter-actions");
  const button = document.createElement("button");

  button.textContent = text;

  if (secondary) {
    button.classList.add("secondary-button");
  }

  button.addEventListener("click", function () {
    if (gameFinished) {
      return;
    }

    playSound("click");
    action();
  });

  actions.appendChild(button);
  return button;
}

function addChapter(title, description) {
  const previousButtons =
    gameChapters.querySelectorAll(".chapter-actions button");

  previousButtons.forEach(function (button) {
    button.disabled = true;
  });

  const chapter = document.createElement("section");
  chapter.classList.add("game-chapter");

  const heading = document.createElement("h3");
  heading.textContent = title;

  const paragraph = document.createElement("p");
  paragraph.textContent = description;

  const actions = document.createElement("div");
  actions.classList.add("chapter-actions");

  chapter.appendChild(heading);
  chapter.appendChild(paragraph);
  chapter.appendChild(actions);

  gameChapters.appendChild(chapter);

  requestAnimationFrame(function () {
    scrollToSection(chapter);
  });

  return chapter;
}

function updateGameStatus() {
  movesDisplay.textContent = movesRemaining;
  clueCountDisplay.textContent = collectedClues.length;

  if (movesRemaining <= 1) {
    movesCircle.classList.add("low-moves");
  } else {
    movesCircle.classList.remove("low-moves");
  }
}

function startGame() {
  if (gameStarted) {
    return;
  }

  playerName = playerNameInput.value.trim();

  if (playerName === "") {
    nameError.classList.remove("hidden");
    playerNameInput.focus();
    return;
  }

  gameStarted = true;
  nameError.classList.add("hidden");
  playerEntry.classList.add("hidden");

  startButton.disabled = true;
  startButton.textContent = "Investigation Started";

  playSound("click");

  const chapter = addChapter(
    `Welcome, Detective ${playerName}!`,
    "Your investigation begins now. Three suspects remain inside Blackwood Mansion. First, meet the people who might have stolen the diamond."
  );

  createButton(chapter, "Meet the Suspects", showSuspects);
}

function showSuspects() {
  const chapter = addChapter(
    "Meet the Suspects",
    "Three people were at Blackwood Mansion when the diamond disappeared. Everyone has something to hide..."
  );

  const suspectsList = document.createElement("div");
  suspectsList.classList.add("suspects-list");

  suspects.forEach(function (suspect) {
    const card = document.createElement("div");
    card.classList.add("suspect-card");

    const heading = document.createElement("h4");
    heading.textContent = suspect.name;

    const description = document.createElement("p");
    description.textContent = suspect.description;

    card.appendChild(heading);
    card.appendChild(description);
    suspectsList.appendChild(card);
  });

  chapter.insertBefore(
    suspectsList,
    chapter.querySelector(".chapter-actions")
  );

  createButton(chapter, "Explore Mansion", exploreMansion);
}

function exploreMansion() {
  gameStatus.classList.remove("hidden");
  cluesSection.classList.remove("hidden");
  updateGameStatus();

  let description =
    "Choose a room to investigate or make an accusation.";

  if (movesRemaining === 0) {
    description =
      "You have no investigation moves remaining! You must make your final accusation.";
  }

  const chapter = addChapter(
    "Explore the Mansion",
    description
  );

  const progress = document.createElement("p");
  progress.classList.add("chapter-progress");
  progress.textContent =
    `Moves: ${movesRemaining} | Clues: ${collectedClues.length}/3`;

  chapter.insertBefore(
    progress,
    chapter.querySelector(".chapter-actions")
  );

  if (movesRemaining > 0) {
    rooms.forEach(function (room) {
      createButton(
        chapter,
        `Explore ${room.name}`,
        function () {
          exploreRoom(room);
        }
      );
    });
  }

  createButton(
    chapter,
    "Make an Accusation",
    makeAccusation,
    true
  );
}

function exploreRoom(room) {
  if (movesRemaining === 0) {
    exploreMansion();
    return;
  }

  const chapter = addChapter(
    `The ${room.name}`,
    room.description
  );

  const availableInvestigations = room.investigations.filter(
    function (investigation) {
      return !completedSearches.includes(investigation.id);
    }
  );

  if (availableInvestigations.length === 0) {
    const message = document.createElement("p");
    message.textContent =
      "You have already investigated every location in this room.";

    chapter.insertBefore(
      message,
      chapter.querySelector(".chapter-actions")
    );
  }

  availableInvestigations.forEach(function (investigation) {
    createButton(
      chapter,
      `${investigation.label} - 1 Move`,
      function () {
        investigate(investigation, room);
      }
    );
  });

  createButton(
    chapter,
    "Return to Hallway",
    exploreMansion,
    true
  );

  createButton(
    chapter,
    "Make an Accusation",
    makeAccusation,
    true
  );
}

function investigate(investigation, room) {
  if (completedSearches.includes(investigation.id)) {
    return;
  }

  if (movesRemaining <= 0) {
    exploreMansion();
    return;
  }

  movesRemaining--;
  completedSearches.push(investigation.id);

  let title = "Investigation Result";
  let description = investigation.result;

  if (investigation.clue !== null) {
    if (!collectedClues.includes(investigation.clue)) {
      collectedClues.push(investigation.clue);

      const clueItem = document.createElement("li");
      clueItem.textContent = investigation.clue;
      cluesList.appendChild(clueItem);
    }

    title = "Clue Discovered!";
    description += ` You collected: ${investigation.clue}.`;

    playSound("clue");
  } else {
    description +=
      " This investigation did not reveal a useful clue.";
  }

  updateGameStatus();

  const chapter = addChapter(title, description);

  if (movesRemaining > 0) {
    const remainingInvestigations = room.investigations.filter(
      function (item) {
        return !completedSearches.includes(item.id);
      }
    );

    remainingInvestigations.forEach(function (item) {
      createButton(
        chapter,
        `${item.label} - 1 Move`,
        function () {
          investigate(item, room);
        }
      );
    });
  } else {
    const warning = document.createElement("p");
    warning.classList.add("error");
    warning.textContent =
      "No moves remaining! You must make your final accusation.";

    chapter.insertBefore(
      warning,
      chapter.querySelector(".chapter-actions")
    );
  }

  createButton(
    chapter,
    "Return to Hallway",
    exploreMansion,
    true
  );

  createButton(
    chapter,
    "Make an Accusation",
    makeAccusation,
    true
  );
}

function makeAccusation() {
  const chapter = addChapter(
    "Solve the Mystery",
    `Detective ${playerName}, you have collected ${collectedClues.length} clue(s). Who do you believe stole the diamond? Your accusation will be final!`
  );

  suspects.forEach(function (suspect) {
    createButton(
      chapter,
      `Accuse ${suspect.name}`,
      function () {
        checkAccusation(suspect.name);
      }
    );
  });

  if (movesRemaining > 0) {
    createButton(
      chapter,
      "Return to Hallway",
      exploreMansion,
      true
    );
  }
}

function checkAccusation(suspectName) {
  let title = "";
  let description = "";
  let resultType = "";

  if (suspectName === "Mr. Thomas") {
    resultType = "success";

    if (collectedClues.length === 3) {
      title = "Master Detective - You Win!";
      description =
        `Congratulations, Detective ${playerName}! You collected all three clues and identified Mr. Thomas. The letter revealed a secret meeting, Lady Evelyn witnessed him near the diamond, and the master key connected him to the restricted areas. The diamond has been recovered!`;
    } else if (collectedClues.length === 2) {
      title = "Sharp Detective - You Win!";
      description =
        `Well done, Detective ${playerName}! With only two clues, you correctly identified Mr. Thomas. Your investigation was incomplete, but your deduction was correct. The diamond has been recovered!`;
    } else {
      title = "Lucky Detective - You Win!";
      description =
        `You correctly guessed Mr. Thomas with only ${collectedClues.length} clue(s)! Your risky decision paid off, and the missing diamond has been recovered!`;
    }

    playSound("win");
  } else {
    resultType = "error";
    title = "Wrong Accusation - You Lose!";
    description =
      `Detective ${playerName}, your accusation against ${suspectName} was incorrect! The real thief remains a mystery, and the diamond is still missing. Don't give up! Investigate carefully and try again to uncover the truth.`;

    playSound("lose");
  }

  const chapter = addChapter(title, description);
  chapter.classList.add("game-result", resultType);

  gameFinished = true;

  const restartButton = document.createElement("button");
  restartButton.textContent = "Play Again";

  restartButton.addEventListener("click", function () {
    location.reload();
  });

  chapter.querySelector(".chapter-actions").appendChild(restartButton);
}

window.addEventListener("beforeunload", function (event) {
  if (gameStarted && !gameFinished) {
    event.preventDefault();
  }
});

