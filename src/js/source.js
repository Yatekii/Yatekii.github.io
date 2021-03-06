import * as helpers from './helpers.js';

// Creates a new source
export const Waveform = function(state) {
    // Remember source state
    this.state = state;

    // Assign class variables
    this.ready = false;

    // Create source
    var audioContext = helpers.getAudioContext();
    this.osc = audioContext.createOscillator();
    this.output = audioContext.createGain();
    this.osc.type = 'sine';
    this.osc.frequency.value = state.frequency ? state.frequency : 1337;
    this.osc.connect(this.output);
    this.output.gain.value = state.gain ? state.gain : 0.7;

    // Create the analyzer
    this.analyzer = audioContext.createAnalyser();
    this.analyzer.fftSize = 4096;
    // Connect the source output to the analyzer
    this.output.connect(this.analyzer);
    this.ready = true;
    this.osc.start(audioContext.currentTime+0.05);
};

// Creates a new source
export const Microphone = function(state) {
    var me = this;

    // Assign class variables
    this.ready = false;
    this.onactive = null;

    // Initialize audio
    initAudio(this);
};

// Creates the actual audio source after a stream was found
function gotStream(source, stream) {
    console.log('Found a stream.');

    var audioContext = helpers.getAudioContext();
    // Create an AudioNode from the stream.
    source.input = audioContext.createMediaStreamSource(stream);

    // Connect to a gain from which the plots are derived
    source.traceGain = audioContext.createGain();
    source.input.connect(source.traceGain);

    // Connect to a gain which can be sinked
    source.sinkGain = audioContext.createGain();
    source.sinkGain.gain.value = 0.0;
    source.traceGain.connect(source.sinkGain);
    source.sinkGain.connect(audioContext.destination);

    // Create the analyzer
    source.analyzer = audioContext.createAnalyser();
    source.analyzer.fftSize = 4096;
    // Connect the source output to the analyzer
    source.traceGain.connect(source.analyzer);

    // Create the data buffer
    source.data = new Uint8Array(source.analyzer.frequencyBinCount);
    if(source.onactive){
        source.onactive(source);
    }
    source.ready = true;
}

// Requests an audio source
function initAudio(source) {
    navigator.getUserMedia = (
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia
    );
    navigator.getUserMedia({
        'audio': {
            'mandatory': {
                'googEchoCancellation': 'false',
                'googAutoGainControl': 'false',
                'googNoiseSuppression': 'false',
                'googHighpassFilter': 'false'
            },
            'optional': []
        },
    }, function(stream) { gotStream(source, stream); }, function(e) {
        console.log('Error getting audio!');
        console.log(e);
    });
}