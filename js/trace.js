function NormalTrace(scope, source) {
    this.scope = scope;
    this.source = source;
    this.color = '#E8830C';
    this.fetched = false;

    // Create the analyzer node to be able to read sample output
    this.analyzer = getAudioContext().createAnalyser();
    this.analyzer.fftSize = 4096;
    // Connect the source output to the analyzer
    source.output.connect(this.analyzer);

    // Create the data buffer
    this.data = new Uint8Array(this.analyzer.frequencyBinCount);
}

NormalTrace.prototype.fetch = function () {
    if(!this.fetched){
        this.analyzer.getByteTimeDomainData(this.data);
    }
    this.fetched = true;
}

NormalTrace.prototype.draw = function (triggerLocation) {
    // Make life easier with shorter variables
	var context = this.scope.canvas.getContext('2d');
    context.strokeWidth = 1;
    this.fetch();

    // Draw trace
	context.strokeStyle = this.color;
	context.beginPath();
    if(this.source.mic)
        console.log('KEK');

	context.moveTo(0, (256 - this.data[triggerLocation]) * this.scope.scaling);
	for (var i=triggerLocation, j=0; (j < this.scope.canvas.width) && (i < this.data.length); i++, j++){
		context.lineTo(j, (256 - this.data[i]) * this.scope.scaling);
    }
	context.stroke();
    this.fetched = false;
}


function FFTrace(scope, analyzer) {
    this.scope = scope;
    this.analyzer = analyzer;
    this.color = '#E8830C';
    
    // Create the data buffer
    this.data = new Uint8Array(this.analyzer.frequencyBinCount);
}

FFTrace.prototype.fetch = function () {
    if(!this.fetched){
        this.analyzer.getByteFrequencyData(this.data);
    }
    this.fetched = true;
}

FFTrace.prototype.draw = function (triggerLocation) {
    var SPACING = 1;
    var BAR_WIDTH = 1;
    var numBars = Math.round(this.scope.canvas.width / SPACING);
    var multiplier = this.analyzer.frequencyBinCount / numBars;

    var context = this.scope.canvas.getContext('2d');
    context.lineCap = 'round';

    this.fetch();

    // Draw rectangle for each frequency bin.
    for (var i = 0; i < numBars; ++i) {
        var magnitude = 0;
        var offset = Math.floor(i * multiplier);
        // gotta sum/average the block, or we miss narrow-bandwidth spikes
        for (var j = 0; j < multiplier; j++) {
            magnitude += this.data[offset + j];
        }
        magnitude = magnitude / multiplier;
        context.fillStyle = "hsl(" + Math.round((i*360)/numBars) + ", 100%, 50%)";
        context.fillRect(i * SPACING, this.scope.canvas.height, BAR_WIDTH, -magnitude);
    }
    this.fetched = true;
}
