function SpatialPage(_pageManager, _pageConfig, _session, _audioContext, _bufferSize, _audioFileLoader, _errorHandler, _language) {
    console.log("Initializing SpatialPage...");
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
	
    this.scenes = [];
    this.cameras = [];
    this.responses = {};
    this.activeResponse = null;

    // this.time = 0;
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
        console.log(`Adding stimulus: ${key}`);
        this.stimuli[this.stimuli.length] = new Stimulus(key, _pageConfig.stimuli[key]);
    }
    shuffle(this.stimuli);

    for (var i = 0; i < this.stimuli.length; ++i) {
        console.log(`Loading audio file for stimulus: ${this.stimuli[i].getId()}`);
        this.audioFileLoader.addFile(this.stimuli[i].getFilepath(), (function(_buffer, _stimulus) {
            console.log(`Audio file loaded for stimulus: ${_stimulus.getId()}`);
            _stimulus.setAudioBuffer(_buffer);
        }), this.stimuli[i]);
    }
}

SpatialPage.prototype.initScenes = function() {
    console.log("Initializing scenes...");
    for (var i = 0; i < this.pageConfig.views.length; ++i) {
        console.log(`Creating scene for view: ${this.pageConfig.views[i].view}`);
        this.renderDivs[i] = document.createElement("div");
        this.renderDivs[i].setAttribute("id", "renderArea" + i);
        this.renderDivs[i].setAttribute("style", "border = solid");
        // Create a canvas element for 2D rendering
        var canvas = document.createElement("canvas");
		canvas.style.cursor = "pointer";  // This makes the cursor a hand when hovering over the canvas
		let img = new Image();
		img.src = '/res/spatial/map_with_states.png';

		img.onload = () => {
			// Set canvas size to match the image's natural size
			canvas.width = img.naturalWidth;
			canvas.height = img.naturalHeight;
			// Draw the image fully onto the canvas
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

			// Optionally, trigger the initial scene render after image loads
			this.renderScene();
		};
		this.renderDivs[i].appendChild(canvas);
		this.canvases[i] = canvas;
		this.ctxs[i] = canvas.getContext("2d");
		(canvas, this.ctxs[i], this);

		// Mouse event for placing the dot
		canvas.onmousedown = (function(event) {
			var rect = canvas.getBoundingClientRect();
			var relX = event.clientX - rect.left;
			var relY = event.clientY - rect.top;

			this.page.circleX = relX;
			this.page.circleY = relY;

			this.page.renderScene();  // Re-render with the dot at the new position
		}).bind({ page: this, canvas: canvas });
        // Camera and scene settings for 2D views
        if (this.pageConfig.views[i].view === 'front' || this.pageConfig.views[i].view === 'back' || this.pageConfig.views[i].view === 'top' || this.pageConfig.views[i].view === 'right' || this.pageConfig.views[i].view === 'left') {
            let img = document.createElement("img");
            // img.src = '/res/spatial/map_with_states.png';  // Adjust the path as needed
            // img.style.width = "100%";  // Set appropriate width
            // img.style.height = "auto";  // Maintain aspect ratio
            // this.renderDivs[i].appendChild(img);
            // // Use a simple 2D canvas for rendering
            this.cameras[i] = new Camera(CameraType.ORTHOGRAPHIC, this.renderDivs[i]);
            this.cameras[i].setPosition(0, this.pageConfig.roomMeasurements[1] / 2, 800, 0, 0, 0);  // Adjust based on view type
        }

        // Scene configuration for 2D rendering
        this.scenes[i] = new Scene(this.renderDivs[i], this.cameras[i], this.pageConfig, this.pageConfig.views[i]);

		this.renderDivs[i].onmousemove = (function(event) {
			var newtime = new Date().getTime();
			if ((newtime - this.page.time) >= this.page.framerate) {
				this.page.time = newtime;
				console.log("Mouse move event triggereddddd. Updating...");
				var parentOffset = $(event.target).parent().offset();
				var width = parseFloat(this.div.getAttribute("width"));
				var height = parseFloat(this.div.getAttribute("height"));
				var relX = event.pageX - parentOffset.left;
				var relY = event.pageY - parentOffset.top;
		
				// var relPosX = relX - width / 2.0;
				// var relPosY = relY - height / 2.0;
				var relPosX = relX;
				var relPosY = relY;
				console.log(`Mouse position: (${relX}, ${relY})`);
				console.log(`Relative mouse position: (${relPosX}, ${relPosY})`);
				
				if (this.page.activeResponse !== null) {
					console.log(this.page.responses[this.page.activeResponse].objects);
					this.page.responses[this.page.activeResponse].objects[0].position = { x: relPosX, y: relPosY };	
					// create a red dot at the position of the mouse (relX, relY)
					
								
					var objects = this.page.responses[this.page.activeResponse].objects;
					var centerPosition = [relPosX, relPosY];
					console.log(`Center position: ${centerPosition[0]}, ${centerPosition[1]}`);
					for (var j = 0; j < objects.length; ++j) {
						if (objects[j].eventOnMouseMove && objects[j].eventOnMouseMove instanceof Function) {
							console.log(`Moving object: ${objects[j]} to position: ${relPosX}, ${relPosY}`);
							objects[j].eventOnMouseMove(event, relPosX, relPosY);
						}
					}
				}
				// }
			}
		}).bind({
			page: this,
			div: this.renderDivs[i],
			scene: this.scenes[i]
		});
		
        this.renderDivs[i].onmouseup = (function(event) {
            console.log("Mouse up event triggered.");
            this.page.mouseDown = false;
        }).bind({
            page: this
        });
    }

    for (var i = 0; i < this.pageConfig.views.length; ++i) {
        this.scenes[i].load();
    }

    for (var i = 0; i < this.pageConfig.objects.length; ++i) {
        var objConfig = this.pageConfig.objects[i];
        console.log(`Adding object of type: ${objConfig.type}`);
        if (objConfig.type === "listener") {
            for (var j = 0; j < this.pageConfig.views.length; ++j) {
                this.scenes[j].addListener(objConfig);
            }
        } else if (objConfig.type === "custom") {
            for (var j = 0; j < this.pageConfig.views.length; ++j) {
                this.scenes[j].addCustomObject(objConfig);
            }
        }
    }

    for (var i = 0; i < this.pageConfig.responses.length; ++i) {
        var respConfig = this.pageConfig.responses[i];
        console.log(`Configuring response: ${respConfig.name}`);
        // if (respConfig.type === "localization") {
		this.responses[respConfig.name] = {
			objects: [],
			config: respConfig
		};
		for (var j = 0; j < this.pageConfig.views.length; ++j) {
			var locObj = new LocalizationObject(respConfig);
			locObj.init(this.scenes[j].scene);
			this.responses[respConfig.name].objects[this.responses[respConfig.name].objects.length] = locObj;
		}
        // }
    }
};

SpatialPage.prototype.init = function() {
	this.initScenes();
	this.filePlayer = new FilePlayer(this.audioContext, this.bufferSize, this.stimuli, this.errorHandler, this.language, this.pageManager.getLocalizer());
};

SpatialPage.prototype.render = function(_id) {
	var div = document.createElement("div");

	// Content
	var content;
	if (this.pageConfig.content !== undefined) {
		content = this.pageConfig.content;
		var text = document.createElement("div");
		text.innerHTML = content;
		div.appendChild(text);
	}
	_id.append(div);

	// stimuli
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

	// responses

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
		button = $("<button id='" + respConfig.name + "' data-inline='true' style='background-color:#" + ((1 << 24) + respConfig.color).toString(16).substr(1) + "; background-image:radial-gradient(#ffffff 0%, " + color + " 100%)'>" + respConfig.label + "</button>");
		button.on("click", (function() {
			this.page.setBoxShadow(this.page.activeResponse, this.name, "#555555");
			this.page.activeResponse = this.name;
		}).bind({
			page : this,
			label : respConfig.label,
			name : respConfig.name,
			button : button
		}));
		$("#spatial_stimuli_" + stimulusIndex).append(button);
	}
	// Scenes rendering (using 2D canvas now)
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

// Further methods...


SpatialPage.prototype.setBoxShadow = function(_lastActiveButton, _currentActiveButton, color) {
	if (_lastActiveButton != null) {
		document.getElementById(_lastActiveButton).style.boxShadow = "0 0 0 white , 0 0 0 white";

	}
	document.getElementById(_currentActiveButton).style.boxShadow = "0 0 30px " + color + " , 0 0 30px " + color;
};

// SpatialPage.prototype.renderScene = function() {
// 	for (var i = 0; i < this.pageConfig.views.length; ++i) {
// 		this.scenes[i].render();
// 	}
// };

SpatialPage.prototype.renderScene = function() {
    for (var i = 0; i < this.pageConfig.views.length; ++i) {
        var ctx = this.ctxs[i];
        var canvas = this.canvases[i];
        let img = new Image();
        img.src = '/res/spatial/map_with_states.png';
        img.onload = (function(ctx, canvas, page) {
            return function() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                ctx.beginPath();
                ctx.arc(page.circleX, page.circleY, 10, 0, 2 * Math.PI);
                ctx.fillStyle = "blue";
                ctx.fill();
                ctx.stroke();
            };
        })(ctx, canvas, this);
    }
};

SpatialPage.prototype.store = function() {
  var trial_localization = this.session.getTrial("localization", this.pageConfig.id);
  
	for (key in this.responses) { 
		if(this.responses[key].objects[0] instanceof (LocalizationObject)){
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
