# Piano Teacher M - Interactive Piano Learning Web App

An interactive web-based piano learning application with real-time pitch detection, optimized for both desktop and mobile devices.

## Features

- Real-time pitch detection using Web Audio API
- Mobile-optimized audio processing
- Interactive piano keyboard interface
- Visual note feedback
- Cross-device compatibility
- Low-latency audio processing

## Technical Stack

### Frontend
- Vanilla JavaScript
- HTML5
- CSS3
- Web Audio API for audio processing
- Pitchy library for pitch detection

### Audio Processing
- FFT (Fast Fourier Transform) for frequency analysis
- Adaptive sample rate handling
- Device-specific optimizations
- Real-time audio stream processing

## Technical Specifications

### Desktop Configuration
- FFT Size: 2048 samples
- Smoothing Constant: 0.8
- Full audio quality settings

### Mobile Configuration
- FFT Size: 256 samples
- Smoothing Constant: 0.4
- Optimized audio processing
- Controlled processing intervals (50ms)

## Browser Requirements
- Modern browser with Web Audio API support
- Microphone access permission
- JavaScript enabled

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open in browser:
   ```
   http://localhost:5173
   ```

## Usage

1. Allow microphone access when prompted
2. Click "Start" to begin pitch detection
3. Sing or play notes
4. Watch for visual feedback on the piano keyboard

## Performance Optimizations

- Dynamic FFT size based on device type
- Controlled processing intervals
- Sample rate compatibility handling
- Optimized mobile audio processing
- Reduced latency configurations

## Known Considerations

- Microphone quality affects detection accuracy
- Environmental noise can impact performance
- Different devices may have varying latency

## Development Notes

### Audio Processing Pipeline
1. Audio input capture
2. FFT analysis
3. Pitch detection
4. Frequency matching
5. Visual feedback

### Mobile Optimizations
- Reduced FFT size
- Adjusted clarity thresholds
- Controlled processing intervals
- Sample rate compatibility fixes

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.