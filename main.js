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
      // Using B4 as a reference point (which is on the third line and displayed correctly)
      'B4': linePosition3, // B4 is on the third line (our reference point)
      
      // Notes above B4 (moving up on the staff)
      'C5': linePosition3 - staffLineSpacing/2, // C5 is on third space (above B4)
      'D5': linePosition3 - staffLineSpacing, // D5 is on fourth line
      'E5': linePosition3 - staffLineSpacing*1.5, // E5 is on fourth space
      'F5': linePosition3 - staffLineSpacing*2, // F5 is on fifth line
      'G5': linePosition3 - staffLineSpacing*2.5, // G5 is above fifth line
      'A5': linePosition3 - staffLineSpacing*3, // A5 is above fifth line
      'B5': linePosition3 - staffLineSpacing*3.5, // B5 is above fifth line
      
      // Notes below B4 (moving down on the staff)
      'A4': linePosition3 + staffLineSpacing/2, // A4 is on second space (below B4)
      'G4': linePosition3 + staffLineSpacing, // G4 is on second line
      'F4': linePosition3 + staffLineSpacing*1.5, // F4 is on first space
      'E4': linePosition3 + staffLineSpacing*2, // E4 is on first line
      'D4': linePosition3 + staffLineSpacing*2.5, // D4 is between staff and ledger line
      'C4': linePosition3 + staffLineSpacing*3, // C4 is on first ledger line below the staff
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
    
    // Using B3 as reference point
    // Calculate positions relative to B3
    const b3Position = linePosition3 - staffLineSpacing * 2 - staffLineSpacing/2;
    
    this.bassNotePositions = {
      // Notes on the staff and below
      'C3': b3Position + staffLineSpacing * 3, // C3 is 3 spaces below B3
      'D3': b3Position + staffLineSpacing * 2.5, // D3 is 2.5 spaces below B3
      'E3': b3Position + staffLineSpacing * 2, // E3 is 2 spaces below B3
      'F3': b3Position + staffLineSpacing * 1.5, // F3 is 1.5 spaces below B3
      'G3': b3Position + staffLineSpacing, // G3 is 1 space below B3
      'A3': b3Position + staffLineSpacing/2, // A3 is 0.5 space below B3
      'B3': b3Position, // B3 is our reference point
      
      // Notes above B3
      'C4': b3Position - staffLineSpacing/2, // C4 is half space above B3
      'D4': b3Position - staffLineSpacing, // D4 is 1 space above B3
      'E4': b3Position - staffLineSpacing * 1.5, // E4 is 1.5 spaces above B3
      'F4': b3Position - staffLineSpacing * 2, // F4 is 2 spaces above B3
      'G4': b3Position - staffLineSpacing * 2.5, // G4 is 2.5 spaces above B3
      'A4': b3Position - staffLineSpacing * 3, // A4 is 3 spaces above B3
      'B4': b3Position - staffLineSpacing * 3.5, // B4 is 3.5 spaces above B3
    };
  }

  getNotePosition(note) {
    // Use the current clef to determine which position mapping to use
    // This ensures notes are positioned correctly on the current active staff
    return this.currentClef === 'treble' 
      ? this.trebleNotePositions[note]
      : this.bassNotePositions[note];
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
  
  // Center the keyboard on the appropriate octave
  centerKeyboardOnNote(currentNote);
  
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
  
  // Add note-specific class for CSS targeting
  noteElement.classList.add(`note-${currentNote}`);
  
  // Apply proper stem direction based on note position
  applyStemDirection(noteElement, currentNote);
  
  // Force reflow
  noteElement.offsetHeight;
  
  // Start animation
  noteElement.style.transition = 'right 4s linear';
  noteElement.style.right = '100%';
  
  // Special handling for B3 and B5 notes to ensure animation works
  if (currentNote === 'B3' || currentNote === 'B5') {
    console.log(`Special animation handling for ${currentNote}`);
    // Make sure the animation property isn't being overridden
    noteElement.style.transition = 'right 4s linear !important';
  }
  
  // Set timer for next note
  animationTimer = setTimeout(() => {
    isAnimating = false;
    displayNote();
  }, 4000);
}

function clearNoteAnimation() {
  if (animationTimer) {
    clearTimeout(animationTimer);
    animationTimer = null;
  }
  
  const trebleNote = document.getElementById('treble-note');
  const bassNote = document.getElementById('bass-note');
  
  // Reset notes
  trebleNote.style.right = '-30px';
  trebleNote.classList.remove('active');
  
  bassNote.style.right = '-30px';
  bassNote.classList.remove('active');
  
  // Remove all note-specific classes (note-C3, note-D3, etc.)
  trebleNote.className = trebleNote.className.replace(/\bnote-[A-G][0-9]\b/g, '');
  bassNote.className = bassNote.className.replace(/\bnote-[A-G][0-9]\b/g, '');
  
  isAnimating = false;
}

/**
 * Applies the proper stem direction to a note based on its position on the staff
 * Following standard music notation rules:
 * - Notes below the middle line have stems pointing up
 * - Notes above the middle line have stems pointing down
 * - Notes on the middle line can go either way (default to down in this implementation)
 */
function applyStemDirection(noteElement, noteName) {
  // Remove any existing rotation classes
  noteElement.classList.remove('stem-up', 'stem-down');
  
  // Special cases for B3 and B5 which need to be handled separately
  if (noteName === 'B3' || noteName === 'B5') {
    // Don't add any stem classes for these notes, they're handled via CSS
    // This prevents conflicting styles
    return;
  }
  
  // For treble clef: notes below C5 have stems on right side (unchanged)
  // For bass clef: C3 has stem on right side pointing up, D3 and above have stems on left side pointing down
  const isMiddleLineOrHigher = 
    (currentClef === 'treble' && noteName.includes('5')) ||
    (currentClef === 'bass' && noteName !== 'C3');
  
  if (isMiddleLineOrHigher) {
    // For notes on or above the middle line (B4+), stems on left side pointing down
    noteElement.classList.add('stem-down');
  } else {
    // For notes below the middle line, stems on right side pointing up
    noteElement.classList.add('stem-up');
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
        analyser.fftSize = 1024; // Increased from 256 for better low-frequency resolution
        analyser.smoothingTimeConstant = 0.4;
      } else {
        analyser.fftSize = 4096; // Increased from 2048 for better low-frequency resolution
        analyser.smoothingTimeConstant = 0.8;
      }
      
      // Set frequency range to capture lower frequencies better
      analyser.minDecibels = -100; // Lower threshold to capture quieter sounds (default is -100)
      analyser.maxDecibels = -30;  // Upper threshold (default is -30)
      
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
    3: { min: 110, max: 250 },   // C3-B3 range (lowered min to include C3 at 130.81Hz with margin)
    4: { min: 250, max: 500 },   // C4-B4 range
    5: { min: 500, max: 1000 }   // C5-B5 range
  };
  
  // Helper function to determine the most likely octave based on frequency
  function getOctaveFromFrequency(freq) {
    // Improved detection for lower frequencies
    if (freq < 130) return 3; // Force to octave 3 for very low frequencies (C3 is 130.81Hz)
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
      
      // Lower clarity threshold for bass notes
      const bassClarityThreshold = isMobile ? 0.55 : 0.7;
      const trebleClarityThreshold = isMobile ? 0.65 : 0.8;
      
      // Determine if we're in bass clef and potentially dealing with lower notes
      const inBassClef = staffModel.currentClef === 'bass';
      const clarityThreshold = inBassClef ? bassClarityThreshold : trebleClarityThreshold;
      
      if (clarity >= clarityThreshold) {
        let detectedNote = null;
        let minDiff = Infinity;
        
        // Increase tolerance for lower frequencies
        const baseTolerance = isMobile ? 45 : 20;
        
        // Debug output
        console.log("Detected pitch:", pitch, "Clarity:", clarity.toFixed(2));
        
        // Determine the likely octave based on the frequency
        const likelyOctave = getOctaveFromFrequency(pitch);
        console.log("Likely octave:", likelyOctave);
        
        // Create a map of notes to check with their custom tolerances
        const notesToCheck = {};
        
        // If we're in bass clef, prioritize bass notes with higher tolerance
        if (inBassClef) {
          // Add all bass notes with appropriate tolerances
          for (const note of staffModel.bassNotes) {
            const freq = staffModel.frequencies[note];
            // Higher tolerance for lower notes
            const noteTolerance = note.startsWith('C3') || note.startsWith('D3') || 
                                  note.startsWith('E3') || note.startsWith('F3') || 
                                  note.startsWith('G3') ? baseTolerance * 2 : 
                                  note.startsWith('A3') || note.startsWith('B3') ? baseTolerance * 1.5 : 
                                  baseTolerance;
            notesToCheck[note] = { freq, tolerance: noteTolerance };
          }
        } else {
          // For treble clef, use standard tolerance
          for (const note of staffModel.trebleNotes) {
            notesToCheck[note] = { freq: staffModel.frequencies[note], tolerance: baseTolerance };
          }
        }
        
        // First try to find a match within the likely octave
        for (const [note, { freq, tolerance }] of Object.entries(notesToCheck)) {
          if (note.includes(likelyOctave.toString())) {
            const diff = Math.abs(pitch - freq);
            if (diff < minDiff && diff < tolerance) {
              minDiff = diff;
              detectedNote = note;
            }
          }
        }
        
        // If no match found in the likely octave, try all notes
        if (!detectedNote) {
          minDiff = Infinity;
          for (const [note, { freq, tolerance }] of Object.entries(notesToCheck)) {
            const diff = Math.abs(pitch - freq);
            if (diff < minDiff && diff < tolerance) {
              minDiff = diff;
              detectedNote = note;
            }
          }
        }

        if (detectedNote) {
          console.log("Mapped to note:", detectedNote, "with difference:", minDiff.toFixed(2));
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

/**
 * Centers the keyboard on the appropriate octave based on the current note
 * @param {string} note - The current note (e.g., 'C3', 'D4', 'E5')
 */
function centerKeyboardOnNote(note) {
  // Extract the octave from the note
  const octave = note.slice(-1);
  const keyboardContainer = document.querySelector('.keyboard-container');
  
  // Get the octave element
  const octaveElement = document.getElementById(`octave-c${octave}`);
  if (!octaveElement || !keyboardContainer) return;
  
  // Calculate the scroll position to center the octave
  const containerWidth = keyboardContainer.clientWidth;
  const octaveWidth = octaveElement.clientWidth;
  const octaveLeft = octaveElement.offsetLeft;
  
  let scrollPosition;
  
  // Special handling for C3 octave to ensure it's fully visible
  if (octave === '3') {
    // For C3, ensure we're at the very beginning of the keyboard
    // Set to 0 to ensure the first key (C3) is fully visible
    scrollPosition = 0;
  } else if (octave === '5') {
    // For C5, ensure it's fully visible on the right
    const pianoKeyboard = document.querySelector('.piano-keyboard-horizontal');
    const keyboardWidth = pianoKeyboard ? pianoKeyboard.clientWidth : 0;
    
    // Calculate position that would show the entire C5 octave
    scrollPosition = Math.min(
      keyboardWidth - containerWidth,
      octaveLeft + octaveWidth - containerWidth + 10
    );
  } else {
    // For C4 (middle octave), center it
    scrollPosition = octaveLeft - (containerWidth / 2) + (octaveWidth / 2);
  }
  
  // Ensure scroll position is never negative
  scrollPosition = Math.max(0, scrollPosition);
  
  // Scroll the container with smooth animation
  keyboardContainer.scrollTo({
    left: scrollPosition,
    behavior: 'smooth'
  });
  
  // Debug log to help diagnose positioning issues
  console.log(`Scrolling to octave ${octave}:`, {
    octaveLeft,
    octaveWidth,
    containerWidth,
    scrollPosition
  });
}
