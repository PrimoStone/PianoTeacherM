import { PitchDetector } from 'pitchy';

class StaffModel {
  constructor() {
    // Define all possible notes for treble and bass clefs with proper octave numbers
    this.trebleNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5']; // Treble clef (C4 is middle C)
    this.bassNotes = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4']; // Bass clef
    
    // Define frequencies for all notes
    this.frequencies = {
      // C3-B3 octave (lower range)
      'C3': 130.81,
      'D3': 146.83,
      'E3': 164.81,
      'F3': 174.61,
      'G3': 196.00,
      'A3': 220.00,
      'B3': 246.94,
      
      // C4-B4 octave (middle range) - C4 is middle C
      'C4': 261.63,
      'D4': 293.66,
      'E4': 329.63,
      'F4': 349.23,
      'G4': 392.00,
      'A4': 440.00,
      'B4': 493.88,
      
      // C5-B5 octave (upper range)
      'C5': 523.25,
      'D5': 587.33,
      'E5': 659.26,
      'F5': 698.46,
      'G5': 783.99,
      'A5': 880.00,
      'B5': 987.77
    };
    
    // Map note names to keyboard key IDs
    this.keyMap = {};
    
    // Initialize keyMap for all notes in C3-C5 range
    ['C', 'D', 'E', 'F', 'G', 'A', 'B'].forEach(note => {
      [3, 4, 5].forEach(octave => {
        // For regular notes
        this.keyMap[`${note}${octave}`] = `key-${note}${octave}`;
        
        // For sharp notes (except E and B)
        if (note !== 'E' && note !== 'B') {
          this.keyMap[`${note}${octave}#`] = `key-${note}${octave}sharp`;
        }
      });
    });
    
    // Check initial mode state
    const checkedModeInput = document.querySelector('input[name="mode"]:checked');
    this.currentMode = checkedModeInput ? checkedModeInput.value : 'easy';
    this.currentClef = 'treble'; // Default to treble clef
    
    console.log('Initial mode:', this.currentMode);
    this.setupModeListeners();
    this.setupKeyboardListeners();
    this.updateNotePositions();
    
    // Update positions on window resize for responsive design
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
          const keyId = this.keyMap[currentNote];
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

  setupKeyboardListeners() {
    // Add click listeners to all keyboard keys
    document.querySelectorAll('.white-key, .black-key').forEach(key => {
      key.addEventListener('click', () => {
        // Get the note from the key's data attribute
        const noteId = key.getAttribute('data-note');
        console.log('Key clicked:', noteId);
        
        // Highlight the key
        this.highlightKey(key.id);
        
        // Check if this note matches the current note
        if (noteId === currentNote) {
          this.noteMatched(currentNote);
        }
      });
    });
  }

  highlightKey(keyId) {
    // Remove highlights from all keys
    document.querySelectorAll('.white-key, .black-key').forEach(key => {
      key.classList.remove('highlighted');
    });
    
    // Add highlight to the clicked key
    const key = document.getElementById(keyId);
    if (key) {
      key.classList.add('highlighted');
      
      // Remove highlight after a short delay
      setTimeout(() => {
        key.classList.remove('highlighted');
      }, 300);
    }
  }

  noteMatched(note) {
    // Handle note matching (similar to checkNote function)
    const noteElement = this.currentClef === 'treble' 
      ? document.getElementById('treble-note') 
      : document.getElementById('bass-note');
      
    noteElement.classList.add('success');
    
    // Wait for animation to complete before showing next note
    noteElement.addEventListener('animationend', function onAnimationEnd() {
      noteElement.removeEventListener('animationend', onAnimationEnd);
      isAnimating = false;
      displayNote();
    }, { once: true });
  }

  // Toggle between treble and bass clefs
  toggleClef() {
    this.currentClef = this.currentClef === 'treble' ? 'bass' : 'treble';
    return this.currentClef;
  }

  // Get current notes based on active clef
  getCurrentNotes() {
    return this.currentClef === 'treble' ? this.trebleNotes : this.bassNotes;
  }

  updateNotePositions() {
    // Update positions for both treble and bass clefs
    this.updateTrebleNotePositions();
    this.updateBassNotePositions();
  }

  updateTrebleNotePositions() {
    const staffContainer = document.getElementById('treble-staff-container');
    if (!staffContainer) return; // Exit if container doesn't exist
    
    const styles = getComputedStyle(document.documentElement);
    const staffTopMargin = parseInt(styles.getPropertyValue('--staff-top-margin'));
    const staffLineSpacing = parseInt(styles.getPropertyValue('--staff-line-spacing'));
    
    // Define positions for each note on treble clef
    // Lines from bottom to top: E4, G4, B4, D5, F5
    // Spaces from bottom to top: F4, A4, C5, E5
    const linePosition1 = staffTopMargin; // E4 (first line)
    const linePosition2 = linePosition1 + staffLineSpacing; // G4 (second line)
    const linePosition3 = linePosition2 + staffLineSpacing; // B4 (third line)
    const linePosition4 = linePosition3 + staffLineSpacing; // D5 (fourth line)
    const linePosition5 = linePosition4 + staffLineSpacing; // F5 (fifth line)
    
    this.trebleNotePositions = {
      // Middle C (C4) is on the ledger line below the staff
      'C4': linePosition1 + staffLineSpacing/2, // C4 is a ledger line below the staff
      
      // Position notes on the staff (5 lines and 4 spaces)
      'D4': linePosition1 + staffLineSpacing/4, // D4 is between C4 and E4
      'E4': linePosition1, // E4 is on the first line
      'F4': linePosition1 - staffLineSpacing/2, // F4 is on first space
      'G4': linePosition2, // G4 is on second line
      'A4': linePosition2 - staffLineSpacing/2, // A4 is on second space
      'B4': linePosition3, // B4 is on third line
      
      // These notes would be higher and not typically used in our basic app
      // but included for completeness
      'C5': linePosition3 - staffLineSpacing/2, // C5 is on third space
      'D5': linePosition4, // D5 is on fourth line
      'E5': linePosition4 - staffLineSpacing/2, // E5 is on fourth space
      'F5': linePosition5, // F5 is on fifth line
      'G5': linePosition5 + staffLineSpacing/2, // G5 is above fifth line
      'A5': linePosition5 + staffLineSpacing, // A5 is above fifth line
      'B5': linePosition5 + staffLineSpacing*1.5, // B5 is above fifth line
    };
  }

  updateBassNotePositions() {
    const staffContainer = document.getElementById('bass-staff-container');
    if (!staffContainer) return; // Exit if container doesn't exist
    
    const styles = getComputedStyle(document.documentElement);
    const staffTopMargin = parseInt(styles.getPropertyValue('--staff-top-margin'));
    const staffLineSpacing = parseInt(styles.getPropertyValue('--staff-line-spacing'));
    
    // Define positions for each note on bass clef
    // Lines from bottom to top: G2, B2, D3, F3, A3
    // Spaces from bottom to top: A2, C3, E3, G3
    const linePosition1 = staffTopMargin; // G2 (first line)
    const linePosition2 = linePosition1 + staffLineSpacing; // B2 (second line)
    const linePosition3 = linePosition2 + staffLineSpacing; // D3 (third line)
    const linePosition4 = linePosition3 + staffLineSpacing; // F3 (fourth line)
    const linePosition5 = linePosition4 + staffLineSpacing; // A3 (fifth line)
    
    this.bassNotePositions = {
      // Lower notes
      'C3': linePosition1 + staffLineSpacing * 2, // C3 is two ledger lines below staff
      'D3': linePosition1 + staffLineSpacing * 1.5, // D3 is between C3 and E3
      'E3': linePosition1 + staffLineSpacing, // E3 is one ledger line below staff
      'F3': linePosition1 + staffLineSpacing/2, // F3 is between E3 and G3
      
      // Notes on the staff
      'G3': linePosition1, // G3 is on first line
      'A3': linePosition1 - staffLineSpacing/2, // A3 is on first space
      'B3': linePosition2, // B3 is on second line
      'C4': linePosition2 - staffLineSpacing/2, // C4 is on second space
      'D4': linePosition3, // D4 is on third line
      'E4': linePosition3 - staffLineSpacing/2, // E4 is on third space
      'F4': linePosition4, // F4 is on fourth line
      'G4': linePosition4 - staffLineSpacing/2, // G4 is on fourth space
      'A4': linePosition5, // A4 is on fifth line
      'B4': linePosition5 - staffLineSpacing/2, // B4 is above fifth line
    };
  }

  getNotePosition(note) {
    // Determine if it's a treble or bass note by checking the note name
    const isTrebleNote = note.includes('4') || note.includes('5');
    return isTrebleNote ? this.trebleNotePositions[note] : this.bassNotePositions[note];
  }

  getRandomNote(excludeNote = null) {
    const currentNotes = this.getCurrentNotes();
    let note;
    do {
      note = currentNotes[Math.floor(Math.random() * currentNotes.length)];
    } while (note === excludeNote);
    return note;
  }

  getNoteFrequency(note) {
    return this.frequencies[note];
  }

  getKeyClass(note) {
    // Make sure we're using the correct note format
    if (!note) return '';
    
    // Get the key ID from the keyMap
    const keyId = this.keyMap[note];
    
    // Debug output
    console.log(`Getting key for note: ${note} -> ${keyId}`);
    
    return keyId || '';
  }
  
  // Get the display name for a note (just shows the note letter, e.g., C, D, E)
  getNoteDisplayName(note) {
    return note.charAt(0);
  }
}

const staffModel = new StaffModel();
let currentNote = null;
let currentClef = 'treble'; // Start with treble clef
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

// Wake Lock variables and functions
let wakeLock = null;

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake Lock is active');
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
    } else {
      console.log('Wake Lock API not supported');
    }
  } catch (err) {
    console.error('Wake Lock request failed:', err);
  }
}

async function handleVisibilityChange() {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    await requestWakeLock();
  }
}

async function releaseWakeLock() {
  if (wakeLock !== null) {
    try {
      await wakeLock.release();
      wakeLock = null;
      console.log('Wake Lock released');
    } catch (err) {
      console.error('Failed to release Wake Lock:', err);
    }
  }
}

function displayNote() {
  if (isAnimating) return;
  isAnimating = true;

  // Randomly toggle clef occasionally (30% chance)
  if (Math.random() < 0.3) {
    currentClef = staffModel.toggleClef();
    console.log('Switched to', currentClef, 'clef');
  }
  
  // Select new note (different from current)
  currentNote = staffModel.getRandomNote(currentNote);
  console.log('Current note:', currentNote, 'on', currentClef, 'clef');
  console.log('Current mode:', staffModel.currentMode);
  
  // Get note elements for both clefs
  const trebleNoteElement = document.getElementById('treble-note');
  const bassNoteElement = document.getElementById('bass-note');
  
  // Hide both notes first
  trebleNoteElement.style.visibility = 'hidden';
  bassNoteElement.style.visibility = 'hidden';
  
  // Determine which note element to show based on current clef
  const noteElement = currentClef === 'treble' ? trebleNoteElement : bassNoteElement;
  noteElement.style.visibility = 'visible';
  noteElement.className = 'note'; // Clear all classes
  
  // Get display name (just the note letter)
  const displayNoteName = staffModel.getNoteDisplayName(currentNote);
  
  // Add note-specific class
  noteElement.classList.add(`note-${displayNoteName}`);
  
  // Handle stem direction based on note position on the staff
  // Notes above the middle line have stems down, notes below have stems up
  if (currentClef === 'treble') {
    // For treble clef, B4 is the middle line
    if (['C4', 'D4', 'E4', 'F4', 'G4', 'A4'].includes(currentNote)) {
      noteElement.classList.add('rotate-note');
    }
  } else {
    // For bass clef, D3 is the middle line
    if (['G2', 'A2', 'B2', 'C3'].includes(currentNote)) {
      noteElement.classList.add('rotate-note');
    }
  }

  // Update learning mode display
  if (staffModel.currentMode === 'learning') {
    console.log('In learning mode');
    
    // Get note name elements for both clefs
    const trebleNoteNameElement = document.getElementById('treble-note-name');
    const bassNoteNameElement = document.getElementById('bass-note-name');
    
    // Hide both note names first
    trebleNoteNameElement.classList.remove('visible');
    bassNoteNameElement.classList.remove('visible');
    
    // Show the appropriate note name
    const noteNameElement = currentClef === 'treble' ? trebleNoteNameElement : bassNoteNameElement;
    noteNameElement.textContent = currentNote; // Show full note name with octave
    noteNameElement.classList.add('visible');
    
    // Remove all highlights from keyboard
    document.querySelectorAll('.white-key, .black-key').forEach(key => {
      key.classList.remove('learning-highlight');
      key.classList.remove('highlighted');
    });
    
    // Add learning highlight to current note's key on the keyboard
    const keyId = staffModel.getKeyClass(currentNote);
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
    document.querySelectorAll('.note-name').forEach(el => {
      el.classList.remove('visible');
    });
    document.querySelectorAll('.white-key, .black-key').forEach(key => {
      key.classList.remove('learning-highlight');
      key.classList.remove('highlighted');
    });
  }
  
  // Start continuous animation
  startNoteAnimation(noteElement);
}

function startNoteAnimation(noteElement) {
  // Clear any existing animation timer
  if (animationTimer) {
    clearTimeout(animationTimer);
  }
  
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

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  console.log('Is mobile device:', isMobile);

  // Request wake lock for mobile devices
  if (isMobile) {
    requestWakeLock();
  }

  // First get the audio capabilities
  navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: 1
    }
  })
  .then(stream => {
    // Get the actual sample rate from the stream
    const track = stream.getAudioTracks()[0];
    const capabilities = track.getCapabilities();
    console.log('Audio capabilities:', capabilities);
    
    // Create audio context with the actual sample rate
    const contextOptions = {
      latencyHint: 'interactive'
    };
    
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)(contextOptions);
      console.log('Audio Context created with sample rate:', audioContext.sampleRate);
      
      analyser = audioContext.createAnalyser();
      
      // Optimize for continuous processing
      if (isMobile) {
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.4;
      } else {
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
      }
      
      console.log('Analyzer settings:', {
        fftSize: analyser.fftSize,
        smoothingTimeConstant: analyser.smoothingTimeConstant,
        sampleRate: audioContext.sampleRate
      });
      
      detector = PitchDetector.forFloat32Array(analyser.fftSize);

      // Use the existing stream
      source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      isListening = true;
      document.getElementById('start-button').textContent = 'Listening...';
      
      if (audioContext.state !== 'running') {
        audioContext.resume().then(() => {
          console.log('AudioContext resumed');
          startPitchDetection();
        });
      } else {
        startPitchDetection();
      }
    } catch (err) {
      console.error('Error creating audio context:', err);
      document.getElementById('feedback').textContent = 
        'Error initializing audio. Please try again.';
    }
  })
  .catch(err => {
    console.error('Error accessing microphone:', err);
    document.getElementById('feedback').textContent =
      'Error accessing microphone. Please check settings.';
  });
}

function stopListening() {
  if (!isListening) return;
  
  isListening = false;
  if (source) {
    source.disconnect();
  }
  document.getElementById('start-button').textContent = 'Start';
  
  // Release wake lock when stopping
  releaseWakeLock();
}

function startPitchDetection() {
  let lastProcessTime = 0;
  const processInterval = 50; // Process every 50ms
  
  // Define frequency ranges for each octave to help with accurate detection
  const octaveRanges = {
    3: { min: 125, max: 250 },   // C3-B3 range (approx)
    4: { min: 250, max: 500 },   // C4-B4 range (approx)
    5: { min: 500, max: 1000 }   // C5-B5 range (approx)
  };
  
  // Helper function to determine the most likely octave based on frequency
  function getOctaveFromFrequency(freq) {
    if (freq < octaveRanges[4].min) return 3;
    if (freq < octaveRanges[5].min) return 4;
    return 5;
  }
  
  function processAudio(timestamp) {
    if (!isListening) return;
    
    // Only process if enough time has passed
    if (timestamp - lastProcessTime >= processInterval) {
      const buffer = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(buffer);
      
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const [pitch, clarity] = detector.findPitch(buffer, audioContext.sampleRate);
      
      const clarityThreshold = isMobile ? 0.65 : 0.8;
      
      if (clarity >= clarityThreshold) {
        let detectedNote = null;
        let minDiff = Infinity;
        const maxDiff = isMobile ? 40 : 15;

        // Debug output
        console.log("Detected pitch:", pitch);
        
        // Determine the likely octave based on the frequency
        const likelyOctave = getOctaveFromFrequency(pitch);
        console.log("Likely octave:", likelyOctave);
        
        // First try to find a match within the likely octave
        for (const [note, freq] of Object.entries(staffModel.frequencies)) {
          // Only consider notes in the likely octave
          if (note.includes(likelyOctave.toString())) {
            const diff = Math.abs(pitch - freq);
            if (diff < minDiff && diff < maxDiff) {
              minDiff = diff;
              detectedNote = note;
            }
          }
        }
        
        // If no match found in the likely octave, try all notes
        if (!detectedNote) {
          minDiff = Infinity;
          for (const [note, freq] of Object.entries(staffModel.frequencies)) {
            const diff = Math.abs(pitch - freq);
            if (diff < minDiff && diff < maxDiff) {
              minDiff = diff;
              detectedNote = note;
            }
          }
        }

        if (detectedNote) {
          console.log("Mapped to note:", detectedNote);
          checkNote(detectedNote);
          highlightKey(detectedNote);
        }
      }
      
      lastProcessTime = timestamp;
    }
    
    // Schedule next frame
    requestAnimationFrame(processAudio);
  }
  
  // Start the processing loop
  requestAnimationFrame(processAudio);
}

function checkNote(detectedNote) {
  if (!currentNote || !isListening) return;

  // Check if the detected note matches the current note
  if (detectedNote === currentNote) {
    // Get the appropriate note element based on current clef
    const noteElement = currentClef === 'treble' 
      ? document.getElementById('treble-note') 
      : document.getElementById('bass-note');
      
    noteElement.classList.add('success');
    
    // Highlight the played key
    const keyId = staffModel.getKeyClass(detectedNote);
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
      lastKey.classList.remove('detected'); // Remove detected class as well
    }
  }

  // Add highlight to new key
  const keyId = staffModel.getKeyClass(note);
  
  // Debug the key mapping
  console.log("Note to highlight:", note, "Key ID:", keyId);
  
  const key = document.getElementById(keyId);
  if (key) {
    key.classList.add('highlighted');
    key.classList.add('detected'); // Add detected class to show it's being played
    lastHighlightedKey = keyId;
    
    // Remove highlight after a short delay
    setTimeout(() => {
      key.classList.remove('highlighted');
      // Keep the detected class until another key is pressed
    }, 300);
  } else {
    console.warn("Could not find key element with ID:", keyId);
  }
}

function initializePianoKeys() {
  document.querySelectorAll('.white-key, .black-key').forEach(key => {
    key.style.cursor = 'pointer';
    key.style.transition = 'background-color 0.3s ease';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initializePianoKeys();
});

document
  .getElementById('start-button')
  .addEventListener('click', () => {
    if (!isListening) {
      startListening();
    } else {
      stopListening();
    }
  });

// Add cleanup on page unload
window.addEventListener('beforeunload', () => {
  releaseWakeLock();
});

// Start displaying notes
displayNote();
