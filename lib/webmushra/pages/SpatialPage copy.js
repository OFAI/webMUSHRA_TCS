function SpatialPage(_pageManager, _pageConfig, _session, _audioContext, _bufferSize, _audioFileLoader, _errorHandler, _language) {
    this.session = _session;
    this.pageManager = _pageManager;
    this.pageConfig = _pageConfig;
    this.numberOfSpheres = this.pageConfig.numberofLocObj;
    this.time = new Date().getTime();
    this.audioContext = _audioContext;
    this.bufferSize = _bufferSize;
    this.audioFileLoader = _audioFileLoader;
    this.errorHandler = _errorHandler;
    this.language = _language;

    this.stimuli = [];

    this.div = null;

    this.renderDivs = [];
    this.canvases = [];
    this.ctxs = [];

    this.responses = {};
    this.activeResponse = null;

    this.time = 0;
    this.framerate = this.pageConfig.framerate;
    this.filePlayer = null;
    this.fpc = null;

    this.mouseDown = false;

    // Variables for the interactive blue dot
    this.circleX = 100;
    this.circleY = 100;
    this.radius = 50;
    this.isDragging = false;

    for (var key in _pageConfig.stimuli) {
        this.stimuli[this.stimuli.length] = new Stimulus(key, _pageConfig.stimuli[key]);
    }
    shuffle(this.stimuli);

    for (var i = 0; i < this.stimuli.length; ++i) {
        this.audioFileLoader.addFile(this.stimuli[i].getFilepath(), (function(_buffer, _stimulus) {
            _stimulus.setAudioBuffer(_buffer);
        }), this.stimuli[i]);
    }
}

SpatialPage.prototype.initScenes = function() {
    for (var i = 0; i < this.pageConfig.views.length; ++i) {
        this.renderDivs[i] = document.createElement("div");
        this.renderDivs[i].setAttribute("id", "renderArea" + i);
        this.renderDivs[i].setAttribute("style", "border: solid");

        // Create a canvas element for 2D rendering
        var canvas = document.createElement("canvas");
        canvas.width = this.pageConfig.roomMeasurements[0];
        canvas.height = this.pageConfig.roomMeasurements[1];
        this.renderDivs[i].appendChild(canvas);
        this.canvases[i] = canvas;
        this.ctxs[i] = canvas.getContext("2d");

        // Set up mouse event to update circle position
        canvas.onmousedown = (function(event) {
            var rect = canvas.getBoundingClientRect();
            var relX = event.clientX - rect.left;
            var relY = event.clientY - rect.top;

            // Update circle position on mouse click
            this.page.circleX = relX;
            this.page.circleY = relY;

            this.page.renderScene();  // Re-render the scene with the updated circle position
        }).bind({
            page: this,
            canvas: canvas
        });
    }
};


SpatialPage.prototype.init = function() {
    this.initScenes();
    this.filePlayer = new FilePlayer(this.audioContext, this.bufferSize, this.stimuli, this.errorHandler, this.language, this.pageManager.getLocalizer());
};

SpatialPage.prototype.render = function(_id) {
    var div = document.createElement("div");

    // Content
    if (this.pageConfig.content !== undefined) {
        var text = document.createElement("div");
        text.innerHTML = this.pageConfig.content;
        div.appendChild(text);
    }
    _id.append(div);

    // Stimuli
    var tableStimuli = document.createElement("table");
    tableStimuli.setAttribute("border", "0");
    tableStimuli.setAttribute("align", "center");
    tableStimuli.setAttribute("style", "margin-top: 0em;");
    var trStimuli = document.createElement("tr");
    for (var i = 0; i < this.stimuli.length; ++i) {
        var td = $("<td></td>");
        var divStimulus = $("<div id='spatial_stimuli_" + i + "' class='ui-body ui-body-a ui-corner-all'></div>");
        td.append(divStimulus);
        this.filePlayer.renderElement(divStimulus, i);

        trStimuli.appendChild(td.get(0));
    }
    tableStimuli.appendChild(trStimuli);
    div.appendChild(tableStimuli);

    // Responses
    for (var i = 0; i < this.pageConfig.responses.length; ++i) {
        var respConfig = this.pageConfig.responses[i];
        var stimulus = null;
        var stimulusIndex = null;
        for (var j = 0; j < this.stimuli.length; ++j) {
            if (this.stimuli[j].getId() == respConfig.stimulus) {
                stimulus = this.stimuli[j];
                stimulusIndex = j;
                break;
            }
        }

        var color = "#" + ((1 << 24) + respConfig.color).toString(16).substr(1);
        var button = $("<button id='" + respConfig.name + "' data-inline='true' style='background-color:#" + ((1 << 24) + respConfig.color).toString(16).substr(1) + "; background-image:radial-gradient(#ffffff 0%, " + color + " 100%)'>" + respConfig.label + "</button>");
        button.on("click", (function() {
            this.page.setBoxShadow(this.page.activeResponse, this.name, "#555555");
            this.page.activeResponse = this.name;
        }).bind({
            page: this,
            label: respConfig.label,
            name: respConfig.name,
            button: button
        }));
        $("#spatial_stimuli_" + stimulusIndex).append(button);
    }

    // Scenes
    var tableScenes = document.createElement("table");
    tableScenes.setAttribute("border", "0");
    tableScenes.setAttribute("align", "center");
    tableScenes.setAttribute("style", "margin-top: 0em;");
    var trScenes = document.createElement("tr");
    for (var i = 0; i < this.pageConfig.views.length; ++i) {
        var td = document.createElement("td");
        td.appendChild(this.renderDivs[i]);
        trScenes.appendChild(td);
    }

    tableScenes.appendChild(trScenes);
    div.appendChild(tableScenes);

    this.renderScene();

    _id.append(div);
};

SpatialPage.prototype.setBoxShadow = function(_lastActiveButton, _currentActiveButton, color) {
    if (_lastActiveButton != null) {
        document.getElementById(_lastActiveButton).style.boxShadow = "0 0 0 white , 0 0 0 white";
    }
    document.getElementById(_currentActiveButton).style.boxShadow = "0 0 30px " + color + " , 0 0 30px " + color;
};

SpatialPage.prototype.renderScene = function() {
    for (var i = 0; i < this.pageConfig.views.length; ++i) {
        var ctx = this.ctxs[i];
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Draw the blue circle
        ctx.beginPath();
        ctx.arc(this.circleX, this.circleY, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = "blue";
        ctx.fill();
    }
};

SpatialPage.prototype.store = function() {
    var trial_localization = this.session.getTrial("localization", this.pageConfig.id);
    var trial_asw = this.session.getTrial("asw", this.pageConfig.id);
    var trial_lev = this.session.getTrial("lev", this.pageConfig.id);
    var trial_hwd = this.session.getTrial("hwd", this.pageConfig.id);

    for (var key in this.responses) {
        if (this.responses[key].objects[0] instanceof LocalizationObject) {
            this.responses[key].objects[0].storeValues(trial_localization, this.session, this.pageConfig.id);
        }
    }
};

SpatialPage.prototype.load = function() {
    this.startTimeOnPage = new Date();
    this.frameUpdateInterval = setInterval((function() {
        this.renderScene();
    }).bind(this), this.framerate);
    this.filePlayer.init();
};

SpatialPage.prototype.save = function() {
    clearInterval(this.frameUpdateInterval);
    this.time += (new Date() - this.startTimeOnPage);
    this.filePlayer.free();
};

SpatialPage.prototype.getName = function() {
    return this.pageConfig.name;
};
