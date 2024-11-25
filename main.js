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
    // Check initial mode state
    const checkedModeInput = document.querySelector('input[name="mode"]:checked');
    this.currentMode = checkedModeInput ? checkedModeInput.value : 'easy';
    console.log('Initial mode:', this.currentMode);
    this.setupModeListeners();
    this.updateNotePositions();
    window.addEventListener('resize', () => this.updateNotePositions());
  }

  setupModeListeners() {
    document.querySelectorAll('input[name="mode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        console.log('Mode changed to:', e.target.value);
        this.currentMode = e.target.value;
        
        // Remove all highlights first
        document.querySelectorAll('.white-key, .black-key').forEach(key => {
          key.classList.remove('learning-highlight');
          key.classList.remove('highlighted');
        });
        
        // If switching to learning mode, highlight current note
        if (this.currentMode === 'learning' && currentNote) {
          const keyId = `key-${currentNote}`;
          const key = document.getElementById(keyId);
          if (key) {
            console.log('Adding learning highlight on mode switch to:', keyId);
            key.classList.add('learning-highlight');
          }
        }
        
        // Update note display
        displayNote();
      });
    });
  }

  updateModeDisplay() {
    // Clear any existing highlights
    document.querySelectorAll('.key').forEach(key => {
      key.classList.remove('learning-highlight');
    });
    
    // Update note name visibility
    const noteNameElement = document.getElementById('note-name');
    noteNameElement.classList.toggle('visible', this.currentMode === 'learning');
    
    // If in learning mode, highlight the current note's key
    if (this.currentMode === 'learning' && currentNote) {
      const keyId = this.getKeyClass(currentNote);
      const key = document.getElementById(keyId);
      if (key) {
        console.log('Adding learning highlight to:', keyId);
        key.classList.add('learning-highlight');
      }
      noteNameElement.textContent = currentNote;
    }
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
    return `key-${note}`;
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

const NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const FREQUENCIES = {
  'C': 261.63,
  'D': 293.66,
  'E': 329.63,
  'F': 349.23,
  'G': 392.00,
  'A': 440.00,
  'B': 493.88
};

const FREQUENCY_RANGES = {
  'C': { min: 255, max: 275 },  // Wider range for C
  'D': { min: 288, max: 305 },
  'E': { min: 324, max: 340 },
  'F': { min: 344, max: 360 },
  'G': { min: 387, max: 405 },
  'A': { min: 435, max: 450 },
  'B': { min: 485, max: 505 }   // Wider range for B
};

function displayNote() {
  if (isAnimating) return;
  isAnimating = true;

  // Select new note (different from current)
  currentNote = staffModel.getRandomNote(currentNote);
  console.log('Current note:', currentNote);
  console.log('Current mode:', staffModel.currentMode);
  
  const noteElement = document.getElementById('note');
  noteElement.style.visibility = 'visible';
  noteElement.className = '';  // Clear all classes
  
  // Add note-specific class
  noteElement.classList.add(`note-${currentNote}`);
  
  // Add class for B note rotation
  if (currentNote === 'B') {
    noteElement.classList.add('rotate-note');
  }

  // Update learning mode display
  if (staffModel.currentMode === 'learning') {
    console.log('In learning mode');
    const noteNameElement = document.getElementById('note-name');
    noteNameElement.textContent = currentNote;
    noteNameElement.classList.add('visible');
    
    // Remove all highlights first
    document.querySelectorAll('.white-key, .black-key').forEach(key => {
      key.classList.remove('learning-highlight');
      key.classList.remove('highlighted');
    });
    
    // Add learning highlight to current note's key
    const keyId = `key-${currentNote}`;
    console.log('Looking for key:', keyId);
    const key = document.getElementById(keyId);
    console.log('Found key:', key);
    if (key) {
      console.log('Adding learning-highlight class');
      key.classList.add('learning-highlight');
      console.log('Key classes after:', key.className);
    }
  } else {
    console.log('Not in learning mode');
    document.getElementById('note-name').classList.remove('visible');
    document.querySelectorAll('.white-key, .black-key').forEach(key => {
      key.classList.remove('learning-highlight');
      key.classList.remove('highlighted');
    });
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
  
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  console.log('Is mobile device:', isMobile);
  
  // Much smaller FFT size for mobile
  analyser.fftSize = isMobile ? 32 : 2048;
  console.log('FFT size set to:', analyser.fftSize);
  
  // Simple smoothing
  analyser.smoothingTimeConstant = 0.8;
  
  // Update frequencies for current device
  staffModel.frequencies = getFrequencyMap();
  console.log('Using frequency map:', staffModel.frequencies);
  
  detector = PitchDetector.forFloat32Array(analyser.fftSize);

  navigator.mediaDevices
    .getUserMedia({ 
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1
      } 
    })
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
  
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const baseThreshold = parseFloat(styles.getPropertyValue('--pitch-clarity-threshold'));
  const clarityThreshold = isMobile ? 0.75 : baseThreshold;
  
  const [pitch, clarity] = detector.findPitch(buffer, audioContext.sampleRate);

  // Debug logging
  if (clarity > clarityThreshold) {
    console.log(`Pitch: ${pitch.toFixed(1)} Hz, Clarity: ${clarity.toFixed(2)}`);
  }

  let detectedNote = null;
  let minDiff = Infinity;

  if (clarity > clarityThreshold) {
    // Log all frequency differences for debugging
    console.log('Frequency differences:');
    for (const [note, freq] of Object.entries(staffModel.frequencies)) {
      const diff = Math.abs(pitch - freq);
      console.log(`${note}: ${diff.toFixed(2)} Hz difference`);
      
      // Add frequency range for mobile
      const range = isMobile ? 30 : 15;
      if (diff < minDiff && diff < range) {
        minDiff = diff;
        detectedNote = note;
      }
    }

    if (detectedNote) {
      console.log(`Detected note: ${detectedNote} with difference: ${minDiff.toFixed(2)} Hz`);
      checkNote(detectedNote);
      highlightKey(detectedNote);
    } else {
      console.log('No note detected within acceptable range');
    }
  }

  if (isListening) {
    requestAnimationFrame(updatePitch);
  }
}

function getNoteFromFrequency(frequency) {
  let minDiff = Infinity;
  let closestNote = '';

  for (const [note, noteFreq] of Object.entries(FREQUENCIES)) {
    const diff = Math.abs(frequency - noteFreq);
    if (diff < minDiff) {
      minDiff = diff;
      closestNote = note;
    }
  }

  return closestNote;
}

function checkNote(detectedNote) {
  if (!currentNote || !isListening) return;

  if (detectedNote === currentNote) {
    const noteElement = document.getElementById('note');
    noteElement.classList.add('success');
    
    // Highlight the played key
    const keyId = `key-${detectedNote}`;
    const key = document.getElementById(keyId);
    if (key) {
      // Remove learning highlight and add regular highlight
      key.classList.remove('learning-highlight');
      key.classList.add('highlighted');
      
      // Remove highlight after a short delay
      setTimeout(() => {
        key.classList.remove('highlighted');
      }, 300);
    }
    
    // Wait for animation to complete before showing next note
    noteElement.addEventListener('animationend', function onAnimationEnd() {
      noteElement.removeEventListener('animationend', onAnimationEnd);
      isAnimating = false;
      displayNote();
    }, { once: true });
  }
}

function highlightKey(note) {
  // Remove previous highlight
  if (lastHighlightedKey) {
    const lastKey = document.getElementById(lastHighlightedKey);
    if (lastKey) {
      lastKey.classList.remove('highlighted');
    }
  }

  // Add highlight to new key
  const keyId = `key-${note}`;
  const key = document.getElementById(keyId);
  if (key) {
    key.classList.add('highlighted');
    lastHighlightedKey = keyId;
    
    // Remove highlight after a short delay
    setTimeout(() => {
      key.classList.remove('highlighted');
    }, 300);
  }
}

function initializePianoKeys() {
  document.querySelectorAll('.white-key, .black-key').forEach(key => {
    key.style.cursor = 'pointer';
    key.style.transition = 'background-color 0.3s ease';
  });
}

function getFrequencyMap() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    return {
      'C': 261.63,
      'D': 293.66,
      'E': 329.63,
      'F': 349.23,
      'G': 392.00,
      'A': 440.00,
      'B': 493.88
    };
  } else {
    return {
      'C': 261.63,
      'D': 293.66,
      'E': 329.63,
      'F': 349.23,
      'G': 392.00,
      'A': 440.00,
      'B': 493.88
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initializePianoKeys();
});

document
  .getElementById('start-button')
  .addEventListener('click', startListening);

displayNote();
