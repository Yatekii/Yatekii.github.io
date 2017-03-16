import * as helpers from './helpers.js';
import * as marker from './marker.js';

export const Oscilloscope = function(state) {
    // Remember scope state
    this.state = state;

    // Create a new canvas to draw the scope onto
    this.canvas = document.getElementById('scope');

    this.traces = [];

    this.sources = [];

    this.markerMoving = false;
};

Oscilloscope.prototype.draw = function() {
    var me = this;

    if(this.canvas == null){
        return;
    }
    var width = this.canvas.clientWidth;
    var height = this.canvas.clientHeight;
    var halfHeight = this.state.height / 2;
    var context = this.canvas.getContext('2d');

    // Assign new scope properties
    this.canvas.height = this.state.height = height;
    this.canvas.width = this.state.width = width;
    context.strokeWidth = 1;

    // Draw background
    context.fillStyle='#222222';
    context.fillRect(0, 0, width, height);
    // Draw trigger level
    context.strokeStyle = '#278BFF';
    context.beginPath();
    context.moveTo(0, halfHeight - this.state.triggerLevel * halfHeight * this.state.scaling);
    context.lineTo(width, halfHeight - this.state.triggerLevel * halfHeight * this.state.scaling);
    context.stroke();

    if(this.state.triggerTrace && !(this.state.triggerTrace.node)){
        this.state.triggerTrace.node = helpers.getNodeByID(this.state.traces.map(function(trace){ return trace.node }), this.state.triggerTrace.id)[0];
    }
    this.state.triggerTrace.node.ctrl.fetch();
    var triggerLocation = getTriggerLocation(this.state.triggerTrace.node.ctrl.data, width, this.state.triggerLevel, this.state.triggerType);
    if(triggerLocation === undefined && this.state.autoTriggering){
        triggerLocation = 0;
    }
    if(this.state.traces.nodes){
        this.state.traces.forEach(function(trace) {
            if(trace.node.ctrl && trace.node.ctrl.on && trace.node.source.node !== null && trace.node.source.node.ctrl.ready){
                trace.node.ctrl.draw(context, me.state, triggerLocation); // TODO: triggering
            }
        });
    }

    me.state.markers.forEach(function(m) {
        marker.draw(context, me.state, m);
    });
};

function getTriggerLocation(buf, buflen, triggerLevel, type){
    switch(type){
    case 'rising':
    default:
        return risingEdgeTrigger(buf, buflen, triggerLevel);
    case 'falling':
        return fallingEdgeTrigger(buf, buflen, triggerLevel);
    }
}

function risingEdgeTrigger(buf, buflen, triggerLevel) {
    for(var i=1; i< buflen; i++){
        if(buf[i] > 128 + triggerLevel && buf[i - 1] < 128 + triggerLevel){
            return i;
        }
    }
}

function fallingEdgeTrigger(buf, buflen, triggerLevel) {
    for(var i=1; i< buflen; i++){
        if(buf[i] < 128 + triggerLevel && buf[i - 1] > 128 + triggerLevel){
            return i;
        }
    }
}

Oscilloscope.prototype.onMouseDown = function(event, scope){
    // Start moving triggerlevel
    var halfHeight = scope.canvas.height / 2;
    var triggerLevel = this.state.triggerLevel * halfHeight * this.state.scaling;
    if(halfHeight - event.offsetY < triggerLevel + 3 && halfHeight - event.offsetY > triggerLevel - 3){
        scope.triggerMoving = true;
        return;
    }

    // Start moving markers
    for(var i = 0; i < this.state.markers.length; i++){
        if(this.state.markers[i].type == 'vertical'){
            var x = this.state.markers[i].x * scope.canvas.width;
            if(event.offsetX < x + 3 && event.offsetX > x - 3){
                scope.markerMoving = i;
                return;
            }
        } else {
            var y = this.state.markers[i].y * halfHeight * this.state.scaling;
            if(halfHeight - event.offsetY < y + 3 && halfHeight - event.offsetY > y - 3){
                scope.markerMoving = i;
                return;
            }
        }
    }
}

Oscilloscope.prototype.onMouseUp = function(event, scope){
    // End moving triggerlevel
    if(scope.triggerMoving){
        scope.triggerMoving = false;
    }

    // Start moving markers
    if(scope.markerMoving !== false){
        scope.markerMoving = false;
    }
}

Oscilloscope.prototype.onMouseMove = function(event, scope){
    var halfHeight = scope.canvas.height / 2;
    var triggerLevel = this.state.triggerLevel * halfHeight * this.state.scaling;

    // Change cursor
    if(halfHeight - event.offsetY < triggerLevel + 3 && halfHeight - event.offsetY > triggerLevel - 3){
        document.body.style.cursor = 'row-resize';
    }
    else{
        var changed = false;
        for(var i = 0; i < this.state.markers.length; i++){
            if(this.state.markers[i].type == 'vertical'){
                var x = this.state.markers[i].x * scope.canvas.width;
                if(event.offsetX < x + 3 && event.offsetX > x - 3){
                    document.body.style.cursor = 'col-resize';
                    changed = true;
                    break;
                }
            } else {
                var y = this.state.markers[i].y * halfHeight * this.state.scaling;
                if(halfHeight - event.offsetY < y + 3 && halfHeight - event.offsetY > y - 3){
                    document.body.style.cursor = 'row-resize';
                    changed = true;
                    break;
                }
            }
        }
        if(!changed){
            document.body.style.cursor = 'initial';
        }
    }

    // Move triggerlevel
    if(scope.triggerMoving){
        triggerLevel = (halfHeight - event.offsetY) / (halfHeight * this.state.scaling);
        if(triggerLevel > 1){
            triggerLevel = 1;
        }
        if(triggerLevel < -1){
            triggerLevel = -1;
        }
        this.state.triggerLevel = triggerLevel;
        return;
    }

    // Move markers
    if(scope.markerMoving !== false){
        var markerLevel = 0;
        if(this.state.markers[scope.markerMoving].type == 'vertical'){
            markerLevel = event.offsetX / scope.canvas.width;
            if(markerLevel > 1){
                markerLevel = 1;
            }
            if(markerLevel < 0){
                markerLevel = 0;
            }
            this.state.markers[scope.markerMoving].x = markerLevel;
            return;
        } else {
            markerLevel = (halfHeight - event.offsetY) / (halfHeight * this.state.scaling);
            if(markerLevel > 1){
                markerLevel = 1;
            }
            if(markerLevel < -1){
                markerLevel = -1;
            }
            this.state.markers[scope.markerMoving].y = markerLevel;
            return;
        }
    }
}

Oscilloscope.prototype.onScroll = function(event, scope){
    this.state.scaling += event.wheelDeltaY * 0.01;
    if(this.state.scaling < 0){
        this.state.scaling = 0;
    }
    console.log(this.state.scaling)
}