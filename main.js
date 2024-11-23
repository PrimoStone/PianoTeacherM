import { PitchDetector } from 'pitchy';

const NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NOTE_POSITIONS = {
  C: 142,
  D: 130,
  E: 118,
  F: 106,
  G: 94,
  A: 82,
  B: 70,
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

let currentNote;
let audioContext;
let analyser;
let detector;
let isListening = false;
let noteElement;
let noteTimeout;
let lastPitch = null;
let lastPitchTime = 0;
const PITCH_STABILITY_THRESHOLD = 200; // 0.2 seconds in milliseconds

function displayNote() {
  // Hide note immediately
  noteElement = document.getElementById('note');
  noteElement.style.visibility = 'hidden';

  // Select new note
  currentNote = NOTES[Math.floor(Math.random() * NOTES.length)];

  // Set up the note's initial position while hidden
  noteElement.style.cssText = `
    visibility: hidden;
    transition: none;
    right: -30px;
    top: ${NOTE_POSITIONS[currentNote]}px;
  `;
  noteElement.className = currentNote === 'B' ? 'rotate-note' : '';

  // Force reflow
  void noteElement.offsetHeight;

  // Update feedback text
  document.getElementById(
    'feedback'
  ).textContent = `Play this note: ${currentNote}`;

  // Show note and start animation in the next frame
  requestAnimationFrame(() => {
    noteElement.style.visibility = 'visible';
    noteElement.style.transition = 'right 3s linear';
    noteElement.style.right = '300px';
  });

  // Set timeout to choose next note if no match
  clearTimeout(noteTimeout);
  noteTimeout = setTimeout(() => {
    displayNote();
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
  const float32Array = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(float32Array);
  const [pitch, clarity] = detector.findPitch(
    float32Array,
    audioContext.sampleRate
  );

  if (pitch && clarity > 0.9) {
    // Only consider pitches with high clarity
    const detectedNote = getNoteFromFrequency(pitch);
    
    // Check if this is the same pitch as before
    if (lastPitch === detectedNote) {
      // If we've sustained this pitch long enough
      if (Date.now() - lastPitchTime >= PITCH_STABILITY_THRESHOLD) {
        checkNote(detectedNote);
        document.getElementById(
          'debug'
        ).textContent = `Detected: ${detectedNote} (${pitch.toFixed(
          2
        )} Hz, Clarity: ${clarity.toFixed(2)})`;
      }
    } else {
      // New pitch detected, reset the timer
      lastPitch = detectedNote;
      lastPitchTime = Date.now();
    }
  } else {
    // No pitch detected, reset
    lastPitch = null;
    document.getElementById('debug').textContent = 'Listening...';
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
  const feedback = document.getElementById('feedback');
  if (detectedNote === currentNote) {
    feedback.textContent = 'Correct! Well done!';
    clearTimeout(noteTimeout);
    setTimeout(() => {
      displayNote();
    }, 1000);
  } else {
    feedback.textContent = `Play this note: ${currentNote}`;
  }
}

document
  .getElementById('start-button')
  .addEventListener('click', startListening);

displayNote();
