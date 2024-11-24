import { PitchDetector } from 'pitchy';

class StaffModel {
  constructor() {
    this.notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    this.frequencies = {
      C: 261.63,
      D: 293.66,
      E: 329.63,
      F: 349.23,
      G: 392.00,
      A: 440.00,
      B: 493.88,
    };
    this.keyMap = {
      'C': 'key-C',
      'D': 'key-D',
      'E': 'key-E',
      'F': 'key-F',
      'G': 'key-G',
      'A': 'key-A',
      'B': 'key-B'
    };
    this.updateNotePositions();
    window.addEventListener('resize', () => this.updateNotePositions());
  }

  updateNotePositions() {
    const staffContainer = document.getElementById('staff-container');
    const styles = getComputedStyle(document.documentElement);
    const staffTopMargin = parseInt(styles.getPropertyValue('--staff-top-margin'));
    const staffLineSpacing = parseInt(styles.getPropertyValue('--staff-line-spacing'));
    const notePositionAdjust = parseInt(styles.getPropertyValue('--note-position-adjust'));
    const baseMultiplier = parseFloat(styles.getPropertyValue('--note-base-multiplier'));
    
    // Calculate base position (C note) and spacing between notes
    const basePosition = (staffContainer.clientHeight * baseMultiplier) + notePositionAdjust;
    const noteSpacing = staffLineSpacing / 2; // Half of staff line spacing
    
    this.notePositions = {
      C: basePosition + staffTopMargin,
      D: basePosition - noteSpacing + staffTopMargin,
      E: basePosition - (noteSpacing * 2) + staffTopMargin,
      F: basePosition - (noteSpacing * 3) + staffTopMargin,
      G: basePosition - (noteSpacing * 4) + staffTopMargin,
      A: basePosition - (noteSpacing * 5) + staffTopMargin,
      B: basePosition - (noteSpacing * 6) + staffTopMargin,
    };
  }

  getNotePosition(note) {
    return this.notePositions[note];
  }

  getRandomNote(excludeNote = null) {
    let note;
    do {
      note = this.notes[Math.floor(Math.random() * this.notes.length)];
    } while (note === excludeNote);
    return note;
  }

  getNoteFrequency(note) {
    return this.frequencies[note];
  }

  getKeyClass(note) {
    return this.keyMap[note];
  }
}

const staffModel = new StaffModel();
let currentNote = null;
let audioContext;
let analyser;
let detector;
let isListening = false;
let source = null;
let lastPitch = null;
let lastPitchTime = 0;
let isAnimating = false;
let animationTimer = null;
let lastHighlightedKey = null;
const PITCH_STABILITY_THRESHOLD = 100; // 0.1 seconds in milliseconds

function displayNote() {
  if (isAnimating) return;
  isAnimating = true;

  // Select new note (different from current)
  currentNote = staffModel.getRandomNote(currentNote);
  
  const noteElement = document.getElementById('note');
  noteElement.style.visibility = 'visible';
  noteElement.className = '';
  
  // Add class for B note rotation
  if (currentNote === 'B') {
    noteElement.classList.add('rotate-note');
  }
  
  // Add class for C note ledger line
  if (currentNote === 'C') {
    noteElement.classList.add('note-C');
  }
  
  // Start continuous animation
  startNoteAnimation();
}

function startNoteAnimation() {
  // Clear any existing animation timer
  if (animationTimer) {
    clearTimeout(animationTimer);
  }

  const noteElement = document.getElementById('note');
  
  // Reset note position without transition
  noteElement.style.transition = 'none';
  noteElement.style.right = '-30px';
  noteElement.style.top = `${staffModel.getNotePosition(currentNote)}px`;
  
  // Force reflow
  noteElement.offsetHeight;
  
  // Start animation
  noteElement.style.transition = 'right 4s linear';
  noteElement.style.right = '100%';
  
  // Set timer for next note
  animationTimer = setTimeout(() => {
    isAnimating = false;
    displayNote();
  }, 4000);
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
      source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
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
  const styles = getComputedStyle(document.documentElement);
  const clarityThreshold = parseFloat(styles.getPropertyValue('--pitch-clarity-threshold'));
  const [pitch, clarity] = detector.findPitch(buffer, audioContext.sampleRate);

  // Find the closest note
  let detectedNote = null;
  let minDiff = Infinity;

  if (clarity > clarityThreshold) {
    for (const [note, freq] of Object.entries(staffModel.frequencies)) {
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

  for (const [note, noteFreq] of Object.entries(staffModel.frequencies)) {
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
    const noteElement = document.getElementById('note');
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
  const keyId = staffModel.getKeyClass(note);
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
