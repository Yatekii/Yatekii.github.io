var micTrace = null;
function init() {
    if (!navigator.getUserMedia)
        navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (!navigator.cancelAnimationFrame)
        navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
    if (!navigator.requestAnimationFrame)
        navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

    audioContext = getAudioContext();
    // osc1.output.connect(audioContext.destination);
    // osc2.output.connect(audioContext.destination);
    scope = new Oscilloscope(document.getElementById('scope-container'), '100%', '256px');

    osc1 = new Waveform(document.getElementById('node-tree-canvas'), scope);
    osc1.osc.frequency.value = 500;
    osc2 = new Waveform(document.getElementById('node-tree-canvas'), scope);
    mic = new Microphone(document.getElementById('node-tree-canvas'), scope);

    scope.addTrace(new NormalTrace(
        document.getElementById('node-tree-canvas'), scope, osc1
    ));
    scope.addTrace(new NormalTrace(
        document.getElementById('node-tree-canvas'), scope, osc2
    ));
    scope.traces[1].setColor('#E85D55');
    var micTrace = new NormalTrace(
        document.getElementById('node-tree-canvas'), scope, mic
    );
    scope.addTrace(micTrace);
    var micFFT = new FFTrace(
        document.getElementById('node-tree-canvas'), scope, mic
    );
    scope.addTrace(micFFT);
    mic.onactive = function onMicActive(source){
        micTrace.setSource(source);
        micFFT.setSource(source);
    };

    osc1.start(audioContext.currentTime+0.05);
    osc2.start(audioContext.currentTime+0.05);
    draw(scope);

    var doneDraggables = []
    jsPlumb.ready(function(){
        var i = 0;

        // Make existing boxes draggable
        scope.traces.forEach(function(trace) {
            i++;

            if(doneDraggables.indexOf(trace.source.repr.id) < 0){
                trace.source.repr.style.top = (200 + (i * 150)) + 'px';
                jsPlumb.draggable(trace.source.repr.id, {
                    containment:true,
                    grid:[50,50]
                });

                jsPlumb.addEndpoint(trace.source.repr.id, { 
                    anchor: ["Right", {shape: "Rectangle"}],
                    isSource: true,
                });
            }

            if(doneDraggables.indexOf(trace.repr.id) < 0){
                trace.repr.style.top = (200 + (i * 150)) + 'px';
                trace.repr.style.left = '500px';
                
                jsPlumb.draggable(trace.repr.id, {
                    containment:true,
                    grid:[50,50]
                });

                jsPlumb.addEndpoint(trace.repr.id, {
                    anchor: ["Left", {shape: "Rectangle"}],
                    isTarget: true,
                });
            }
            
            doneDraggables.push(trace.source.repr.id);
            doneDraggables.push(trace.repr.id);

            jsPlumb.connect({
                source: trace.source.repr.id,
                target: trace.repr.id,
                endpoint: "Dot",
                anchors: [["Right", {shape:"Circle"}], ["Left", {shape:"Circle"}]]
            });
        });

        // Bind connection event
        jsPlumb.bind('connection', function(info) {
            info.target.controller.source = info.source.controller;
        });

        // Bind connectionDetached event
        jsPlumb.bind('connectionDetached', function(info) {
            info.target.controller.source = null;
        });
    });
}

function drawUI() {

}

window.addEventListener("load", init);