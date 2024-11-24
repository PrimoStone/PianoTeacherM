import { PitchDetector } from 'pitchy';

const NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NOTE_POSITIONS = {
  C: 172,  // Adjusted for 200px height
  D: 160,
  E: 148,
  F: 136,
  G: 124,
  A: 112,
  B: 100,
};
const NOTE_FREQUENCIES = {
  C: 261.63,
  D: 293.66,
  E: 329.63,
  F: 349.23,
  G: 392.0,
  A: 440.0,
  B: 493.88,
};
const NOTE_TO_KEY_MAP = {
  'C': 'key-C',
  'D': 'key-D',
  'E': 'key-E',
  'F': 'key-F',
  'G': 'key-G',
  'A': 'key-A',
  'B': 'key-B'
};

let currentNote = null;
let audioContext;
let analyser;
let detector;
let isListening = false;
let noteElement = null;
let noteTimeout;
let lastPitch = null;
let lastPitchTime = 0;
let isAnimating = false;
let animationTimer = null;
let lastHighlightedKey = null;
const PITCH_STABILITY_THRESHOLD = 200; // 0.2 seconds in milliseconds

function displayNote() {
  if (isAnimating) return;
  isAnimating = true;

  // Select new note (different from current)
  let newNote;
  do {
    newNote = NOTES[Math.floor(Math.random() * NOTES.length)];
  } while (newNote === currentNote);
  currentNote = newNote;

  // Get note element once
  if (!noteElement) {
    noteElement = document.getElementById('note');
  }

  // Start continuous animation
  startNoteAnimation();
}

function startNoteAnimation() {
  // Clear any existing animation timer
  if (animationTimer) {
    clearTimeout(animationTimer);
  }

  // Reset note position without transition
  noteElement.style.transition = 'none';
  noteElement.style.right = '-30px';
  noteElement.style.top = `${NOTE_POSITIONS[currentNote]}px`;
  noteElement.className = '';  // Clear all classes first
  
  // Add rotation for B note
  if (currentNote === 'B') {
    noteElement.classList.add('rotate-note');
  }
  
  // Add class for C note to show ledger line
  if (currentNote === 'C') {
    noteElement.classList.add('note-C');
  }
  
  noteElement.style.visibility = 'visible';
  
  // Force reflow
  void noteElement.offsetHeight;

  // Single continuous movement
  noteElement.style.transition = 'right 3s linear';
  noteElement.style.right = '300px';
  
  // Update text
  document.getElementById('feedback').textContent = `Play this note: ${currentNote}`;

  // Set up next cycle
  animationTimer = setTimeout(() => {
    if (isAnimating) {
      startNoteAnimation();
    }
  }, 3000);
}

function startListening() {
  if (isListening) return;

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  detector = PitchDetector.forFloat32Array(analyser.fftSize);

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      audioContext.createMediaStreamSource(stream).connect(analyser);
      isListening = true;
      document.getElementById('start-button').textContent = 'Listening...';
      displayNote();
      requestAnimationFrame(updatePitch);
    })
    .catch((err) => {
      console.error('Error accessing microphone:', err);
      document.getElementById('feedback').textContent =
        'Error accessing microphone. Please check your settings and try again.';
    });
}

function updatePitch() {
  const buffer = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buffer);
  const [pitch, clarity] = detector.findPitch(buffer, audioContext.sampleRate);

  // Find the closest note
  let detectedNote = null;
  let minDiff = Infinity;

  if (clarity > 0.9) {
    for (const [note, freq] of Object.entries(NOTE_FREQUENCIES)) {
      const diff = Math.abs(pitch - freq);
      if (diff < minDiff) {
        minDiff = diff;
        detectedNote = note;
      }
    }

    // Update last pitch time for stability check
    const currentTime = Date.now();
    if (lastPitch === detectedNote) {
      if (currentTime - lastPitchTime >= PITCH_STABILITY_THRESHOLD) {
        checkNote(detectedNote);
        highlightKey(detectedNote);  // Only highlight after sustained pitch
      }
    } else {
      lastPitch = detectedNote;
      lastPitchTime = currentTime;
      // Remove highlight when pitch changes
      if (lastHighlightedKey) {
        const lastKey = document.getElementById(lastHighlightedKey);
        if (lastKey) {
          lastKey.classList.remove('highlighted');
        }
        lastHighlightedKey = null;
      }
    }
  } else {
    // Remove highlight if pitch is unclear
    if (lastHighlightedKey) {
      const lastKey = document.getElementById(lastHighlightedKey);
      if (lastKey) {
        lastKey.classList.remove('highlighted');
      }
      lastHighlightedKey = null;
    }
    lastPitch = null;
    lastPitchTime = 0;
  }

  if (isListening) {
    requestAnimationFrame(updatePitch);
  }
}

function getNoteFromFrequency(frequency) {
  let minDiff = Infinity;
  let closestNote = '';

  for (const [note, noteFreq] of Object.entries(NOTE_FREQUENCIES)) {
    const diff = Math.abs(frequency - noteFreq);
    if (diff < minDiff) {
      minDiff = diff;
      closestNote = note;
    }
  }

  return closestNote;
}

function checkNote(detectedNote) {
  if (!currentNote || !isAnimating) return;

  if (detectedNote === currentNote) {
    // Stop current animation cycle
    if (animationTimer) {
      clearTimeout(animationTimer);
      animationTimer = null;
    }
    
    document.getElementById('feedback').textContent = 'Correct!';
    
    // Add success animation
    noteElement.classList.add('success');
    
    // Wait for animation to complete before showing next note
    noteElement.addEventListener('animationend', function onAnimationEnd() {
      noteElement.removeEventListener('animationend', onAnimationEnd);
      noteElement.classList.remove('success');
      isAnimating = false;
      displayNote();
    }, { once: true });
  }
  // No else clause - wrong notes are completely ignored
}

function highlightKey(note) {
  // Remove highlight from last key
  if (lastHighlightedKey) {
    const lastKey = document.getElementById(lastHighlightedKey);
    if (lastKey) {
      lastKey.classList.remove('highlighted');
    }
  }

  // Add highlight to new key
  const keyId = NOTE_TO_KEY_MAP[note];
  if (keyId) {
    const key = document.getElementById(keyId);
    if (key) {
      key.classList.add('highlighted');
      lastHighlightedKey = keyId;
    }
  }
}

document
  .getElementById('start-button')
  .addEventListener('click', startListening);

displayNote();
