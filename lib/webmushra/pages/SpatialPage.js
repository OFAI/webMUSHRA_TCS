function SpatialPage(_pageManager, _audioContext, _bufferSize, _audioFileLoader, _session, _pageConfig, _mushraValidator, _errorHandler, _language) {
    this.isMushra = false;
    this.pageManager = _pageManager;
    this.audioContext = _audioContext;
    this.bufferSize = _bufferSize;
    this.audioFileLoader = _audioFileLoader;
    this.session = _session;
    this.pageConfig = _pageConfig;
    this.mushraValidator = _mushraValidator;
    this.errorHandler = _errorHandler;
    this.language = _language
    this.mushraAudioControl = null;
    this.div = null;
    this.waveformVisualizer = null;
    this.macic = null;
    this.renderDivs = [];
    this.canvases = [];
    this.ctxs = [];
    this.scenes = [];
    this.framerate = this.pageConfig.framerate;
    this.cameras = [];
    this.responses = {};
    this.mouseDown = false;
    this.circleX = 100;
    this.circleY = 100;
    this.radius = 50;
    this.isDragging = true;
    this.activeResponse = null;
    this.isPositionSelected = false;
    this.autoplay = true;

    this.currentItem = null;

    this.tdLoop2 = null;

    this.conditions = [];
    for (var key in this.pageConfig.stimuli) {
        this.conditions[this.conditions.length] = new Stimulus(key, this.pageConfig.stimuli[key]);
    }
    this.reference = new Stimulus("reference", this.pageConfig.reference);
    this.audioFileLoader.addFile(this.reference.getFilepath(), (function (_buffer, _stimulus) { _stimulus.setAudioBuffer(_buffer); }), this.reference);
    for (var i = 0; i < this.conditions.length; ++i) {
        this.audioFileLoader.addFile(this.conditions[i].getFilepath(), (function (_buffer, _stimulus) { _stimulus.setAudioBuffer(_buffer); }), this.conditions[i]);
    }

    // data
    this.ratings = [];
    this.loop = { start: null, end: null };
    this.slider = { start: null, end: null };

    this.time = 0;
    this.startTimeOnPage = null;
}

SpatialPage.prototype.getName = function () {
    return this.pageConfig.name;
};

SpatialPage.prototype.renderScene = function () {
    for (var i = 0; i < this.pageConfig.views.length; ++i) {
        var ctx = this.ctxs[i];
        var canvas = this.canvases[i];

        // Use the current image source or the default one
        if (!this.currentImageSrc) {
            this.currentImageSrc = 'configs/resources/images/listening_test_wavs_maps/map_empty.png';
        }

        let img = new Image();
        img.src = this.currentImageSrc;

        img.onload = (function (ctx, canvas, page) {
            return function () {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                ctx.beginPath();
                ctx.arc(page.circleX, page.circleY, 10, 0, 2 * Math.PI);
                ctx.fillStyle = "blue";
                ctx.fill();
                ctx.stroke();
            };
        })(ctx, canvas, this);

        // Change image on mousedown
        // only for id test_page1
        var cur_img = this.pageConfig.id + '.png';
        if (this.pageConfig.id && /^\d{5}/.test(this.pageConfig.id)) { // checks if starts with 5 numbers
            canvas.addEventListener('mousedown', (function (ctx, canvas, page) {
                return function () {
                    page.currentImageSrc = 'configs/resources/images/listening_test_wavs_maps/'+cur_img;
                    let newImg = new Image();
                    newImg.src = page.currentImageSrc;

                    newImg.onload = function () {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(newImg, 0, 0, canvas.width, canvas.height);
                        ctx.beginPath();
                        ctx.arc(page.circleX, page.circleY, 10, 0, 2 * Math.PI);
                        // ctx.fillStyle = "blue"; // Optional: Change circle color if needed
                        ctx.fill();
                        ctx.stroke();
                    };
                };
            })(ctx, canvas, this));
        }
    }
};

SpatialPage.prototype.initScenes = function () {
    // console.log("Initializing scenes...");
    for (var i = 0; i < this.pageConfig.views.length; ++i) {
        // console.log(`Creating scene for view: ${this.pageConfig.views[i].view}`);
        this.renderDivs[i] = document.createElement("div");
        this.renderDivs[i].setAttribute("id", "renderArea" + i);
        this.renderDivs[i].setAttribute("style", "border = solid");

        // Create a canvas element for 2D rendering
        var canvas = document.createElement("canvas");
        canvas.style.cursor = "pointer";  // This makes the cursor a hand when hovering over the canvas
        let img = new Image();
        img.src = 'configs/resources/images/map_blank_with_main_cities.png';
        img.onload = () => {
            // Set canvas size to match the image's natural size
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            this.renderScene();
        };
        this.renderDivs[i].appendChild(canvas);
        this.canvases[i] = canvas;
        this.ctxs[i] = canvas.getContext("2d");

        var updateDotPosition = (function(event) {
            var rect = canvas.getBoundingClientRect();
            var relX = event.clientX - rect.left;
            var relY = event.clientY - rect.top;

            this.page.circleX = relX;
            this.page.circleY = relY;
        }).bind({ page: this, canvas: canvas });

        // Mouse event for placing the dot
        canvas.onmousedown = (function (event) {
            updateDotPosition(event);
            this.page.isDragging = true;
            this.page.renderScene();
        }).bind({ page: this, canvas: canvas });

        canvas.onmouseup = (function (event) {
            this.page.isPositionSelected = true;
            this.page.isDragging = false;

            var rect = canvas.getBoundingClientRect();
            var relX = event.clientX - rect.left;
            var relY = event.clientY - rect.top;

            this.page.circleX = relX;
            this.page.circleY = relY;

            if (this.page.activeResponse && this.page.responses[this.page.activeResponse]) {
                // console.log(`x, y: ${relX}, ${relY}`);
                this.page.responses[this.page.activeResponse].objects[0].position = { x: relX, y: relY };
            }

            this.page.renderScene();
        }).bind({ page: this, canvas: canvas });

        canvas.onmousemove = (function (event) {
            if (!this.page.isPositionSelected || this.page.isDragging) {
                updateDotPosition(event);
            }

            this.page.renderScene();
        }).bind({ page: this, canvas: canvas });

        canvas.onmouseenter = (function (event) {
            if (!this.page.isPositionSelected) {
                updateDotPosition(event);
            }
            this.page.renderScene();            
        }).bind({ page: this, canvas: canvas });

        // Camera and scene settings for 2D views
        if (this.pageConfig.views[i].view === 'front' || this.pageConfig.views[i].view === 'back' || this.pageConfig.views[i].view === 'top' || this.pageConfig.views[i].view === 'right' || this.pageConfig.views[i].view === 'left') {
            this.cameras[i] = new Camera(CameraType.ORTHOGRAPHIC, this.renderDivs[i]);
            this.cameras[i].setPosition(0, this.pageConfig.roomMeasurements[1] / 2, 800, 0, 0, 0);  // Adjust based on view type
        }

        // Scene configuration for 2D rendering
        this.scenes[i] = new Scene(this.renderDivs[i], this.cameras[i], this.pageConfig, this.pageConfig.views[i]);

        this.renderDivs[i].onmouseup = (function (event) {
            this.page.mouseDown = false;
        }).bind({ page: this });
    }

    for (var i = 0; i < this.pageConfig.views.length; ++i) {
        this.scenes[i].load();
    }

    for (var i = 0; i < this.pageConfig.objects.length; ++i) {
        var objConfig = this.pageConfig.objects[i];
        // console.log(`Adding object of type: ${objConfig.type}`);
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
        // console.log(`Configuring response: ${respConfig.name}`);
        this.responses[respConfig.name] = {
            objects: [],
            config: respConfig
        };
        for (var j = 0; j < this.pageConfig.views.length; ++j) {
            var locObj = new LocalizationObject(respConfig);
            locObj.init(this.scenes[j].scene);
            this.responses[respConfig.name].objects.push(locObj);
        }
    }
};

SpatialPage.prototype.init = function () {
    var toDisable;
    var active;

    if (this.pageConfig.strict !== false) {
        this.mushraValidator.checkNumConditions(this.conditions);
        this.mushraValidator.checkStimulusDuration(this.reference);
    }

    this.mushraValidator.checkNumChannels(this.audioContext, this.reference);
    var i;
    for (i = 0; i < this.conditions.length; ++i) {
        this.mushraValidator.checkSamplerate(this.audioContext.sampleRate, this.conditions[i]);
    }
    this.mushraValidator.checkConditionConsistency(this.reference, this.conditions);

    this.mushraAudioControl = new MushraAudioControl(this.audioContext, this.bufferSize, this.reference, this.conditions, this.errorHandler, this.pageConfig.createAnchor35, this.pageConfig.createAnchor70, this.pageConfig.randomize, this.pageConfig.switchBack);
    window.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            event.preventDefault(); // Prevent scrolling when pressing space
            if (this.mushraAudioControl.isPlaying()) {
                this.mushraAudioControl.stop();
            } else {
                this.mushraAudioControl.playReference();
            }
        }
    });

    this.mushraAudioControl.addEventListener((function (_event) {
        if (_event.name == 'stopTriggered') {
            $(".audioControlElement").text(this.pageManager.getLocalizer().getFragment(this.language, 'playButton'));

            if ($('#buttonReference').attr("active") == "true") {
                $.mobile.activePage.find('#buttonReference')  //remove color from Reference
                    .removeClass('ui-btn-b')
                    .addClass('ui-btn-a').attr('data-theme', 'a');
                $('#buttonReference').attr("active", "false");
            }

            $.mobile.activePage.find('#buttonStop')    //add color to stop
                .removeClass('ui-btn-a')
                .addClass('ui-btn-b').attr('data-theme', 'b');
            $.mobile.activePage.find('#buttonStop').focus();
            $('#buttonStop').attr("active", "true");

        } else if (_event.name == 'playReferenceTriggered') {

            if ($('#buttonStop').attr("active") == "true") {
                $.mobile.activePage.find('#buttonStop')  //remove color from Stop
                    .removeClass('ui-btn-b')
                    .addClass('ui-btn-a').attr('data-theme', 'a');
                $('#buttonStop').attr("active", "false");
            }

            var j;
            for (j = 0; j < _event.conditionLength; j++) {
                active = '#buttonConditions' + j;
                toDisable = $(".scales").get(j);
                if ($(active).attr("active") == "true") {
                    $.mobile.activePage.find(active)			// remove color from conditions
                        .removeClass('ui-btn-b')
                        .addClass('ui-btn-a').attr('data-theme', 'a');
                    $(active).attr("active", "false");
                    $(toDisable).slider('disable');
                    $(toDisable).attr("active", "false");
                    break;
                }
            }

            $.mobile.activePage.find('#buttonReference')		//add color to reference
                .removeClass('ui-btn-a')
                .addClass('ui-btn-b').attr('data-theme', 'b');
            $.mobile.activePage.find('#buttonReference').focus();
            $('#buttonReference').attr("active", "true");
        } else if (_event.name == 'playConditionTriggered') {

            var index = _event.index;
            var activeSlider = $(".scales").get(index);
            var selector = '#buttonConditions' + index;

            if ($('#buttonStop').attr("active") == "true") {
                $.mobile.activePage.find('#buttonStop')  //remove color from Stop
                    .removeClass('ui-btn-b')
                    .addClass('ui-btn-a').attr('data-theme', 'a');
                $('#buttonStop').attr("active", "false");
            }

            if ($('#buttonReference').attr("active") == "true") {
                $.mobile.activePage.find('#buttonReference')	//remove color from Reference
                    .removeClass('ui-btn-b')
                    .addClass('ui-btn-a').attr('data-theme', 'a');
                $('#buttonReference').attr("active", "false");
            }
            var k;
            for (k = 0; k < _event.length; k++) {
                active = '#buttonConditions' + k;
                toDisable = $(".scales").get(k);
                if ($(active).attr("active") == "true") {
                    $.mobile.activePage.find(active)    // remove color from conditions
                        .removeClass('ui-btn-b')
                        .addClass('ui-btn-a').attr('data-theme', 'a');
                    $(toDisable).slider('disable');
                    $(active).attr("active", "false");
                    $(toDisable).attr("active", "false");
                    break;
                }
            }


            $(activeSlider).slider('enable');
            $(activeSlider).attr("active", "true");
            $.mobile.activePage.find(selector)    //add color to conditions
                .removeClass('ui-btn-a')
                .addClass('ui-btn-b').attr('data-theme', 'b');
            $.mobile.activePage.find(selector).focus();
            $(selector).attr("active", "true");
        } else if (_event.name == 'surpressLoop') {
            this.surpressLoop();
        }


    }).bind(this));

    this.initScenes();
};

SpatialPage.prototype.render = function (_parent) {
    var div = $("<div></div>");
    _parent.append(div);
    var content;
    if (this.pageConfig.content === null) {
        content = "";
    } else {
        content = this.pageConfig.content;
    }

    var p = $("<p>" + content + "</p>");
    div.append(p);

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
    div.append(tableScenes);

    this.renderScene();
    var tableUp = $("<table id='mainUp'></table>");
    div.append(tableUp);

    var trLoop = $("<tr id='trWs'></tr>");
    tableUp.append(trLoop);

    var tdLoop1 = $("<button data-theme='a' id='buttonReference' data-role='button' class='audioControlElement' onclick='" + this.pageManager.getPageVariableName(this) + ".btnCallbackReference()' style='margin : 0 auto;'>" + this.pageManager.getLocalizer().getFragment(this.language, 'playButton') + "</button>");
    trLoop.append(tdLoop1);

    var tdRight = $("<td></td>");
    trLoop.append(tdRight);

    for (var i = 0; i < this.pageConfig.responses.length; ++i) {
        var respConfig = this.pageConfig.responses[i];
        var stimulus = null;
        var stimulusIndex = null;
        for (var j = 0; j < this.conditions.length; ++j) {
            if (this.conditions[j].getId() == respConfig.stimulus) {
                stimulus = this.conditions[j];
                stimulusIndex = j;
                break;
            }
        }
        // Automatically set the response as active
        this.activeResponse = respConfig.name;
    }


    this.macic = new MushraAudioControlInputController(this.mushraAudioControl, this.pageConfig.enableLooping);
    this.macic.bind();

    this.waveformVisualizer = new WaveformVisualizer(this.pageManager.getPageVariableName(this) + ".waveformVisualizer", tdRight, this.reference, this.pageConfig.showWaveform, this.pageConfig.enableLooping, this.mushraAudioControl, true);
    this.waveformVisualizer.create();
    this.waveformVisualizer.load();
};

SpatialPage.prototype.pause = function () {
    this.mushraAudioControl.pause();
};

SpatialPage.prototype.setLoopStart = function () {
    var slider = document.getElementById('slider');
    var startSliderSamples = this.mushraAudioControl.audioCurrentPosition;

    var endSliderSamples = parseFloat(slider.noUiSlider.get()[1]);

    this.mushraAudioControl.setLoop(startSliderSamples, endSliderSamples);
};

SpatialPage.prototype.setLoopEnd = function () {
    var slider = document.getElementById('slider');
    var startSliderSamples = parseFloat(slider.noUiSlider.get()[0]);

    var endSliderSamples = this.mushraAudioControl.audioCurrentPosition;

    this.mushraAudioControl.setLoop(startSliderSamples, endSliderSamples);
};

SpatialPage.prototype.btnCallbackReference = function () {
    this.currentItem = "ref";
    var label = $("#buttonReference").text();
    if (label == this.pageManager.getLocalizer().getFragment(this.language, 'pauseButton')) {
        this.mushraAudioControl.pause();
        $("#buttonReference").text(this.pageManager.getLocalizer().getFragment(this.language, 'playButton'));
    } else if (label == this.pageManager.getLocalizer().getFragment(this.language, 'playButton')) {
        $(".audioControlElement").text(this.pageManager.getLocalizer().getFragment(this.language, 'playButton'));
        this.mushraAudioControl.playReference();
        $("#buttonReference").text(this.pageManager.getLocalizer().getFragment(this.language, 'pauseButton'));
    }
};

SpatialPage.prototype.surpressLoop = function () {
    if (this.currentItem == "ref") {
        var id = $("#buttonReference");
    } else {
        var id = $("#buttonConditions" + this.currentItem);
    }
    id.text(this.pageManager.getLocalizer().getFragment(this.language, 'playButton'));
}

SpatialPage.prototype.btnCallbackCondition = function (_index) {
    this.currentItem = _index;

    var label = $("#buttonConditions" + _index).text();
    if (label == this.pageManager.getLocalizer().getFragment(this.language, 'pauseButton')) {
        this.mushraAudioControl.pause();
        $("#buttonConditions" + _index).text(this.pageManager.getLocalizer().getFragment(this.language, 'playButton'));
    } else if (label == this.pageManager.getLocalizer().getFragment(this.language, 'playButton')) {
        $(".audioControlElement").text(this.pageManager.getLocalizer().getFragment(this.language, 'playButton'));
        this.mushraAudioControl.playCondition(_index);
        $("#buttonConditions" + _index).text(this.pageManager.getLocalizer().getFragment(this.language, 'pauseButton'));
    }
};

SpatialPage.prototype.load = function () {
    this.startTimeOnPage = new Date();

    this.mushraAudioControl.initAudio();
    // Autoplay the reference audio


    if (this.ratings.length !== 0) {
        var scales = $(".scales");
        var i;
        for (i = 0; i < scales.length; ++i) {
            $(".scales").eq(i).val(this.ratings[i].value).slider("refresh");
        }
    }
    if (this.loop.start !== null && this.loop.end !== null) {
        this.mushraAudioControl.setLoop(0, 0, this.mushraAudioControl.getDuration(), this.mushraAudioControl.getDuration() / this.waveformVisualizer.stimulus.audioBuffer.sampleRate);
        this.mushraAudioControl.setPosition(0);
    }

};

SpatialPage.prototype.save = function () {
    this.macic.unbind();
    this.time += (new Date() - this.startTimeOnPage);
    this.mushraAudioControl.freeAudio();
    this.mushraAudioControl.removeEventListener(this.waveformVisualizer.numberEventListener);
    var scales = $(".scales");
    this.ratings = [];
    var i;

    this.loop.start = parseInt(this.waveformVisualizer.mushraAudioControl.audioLoopStart);
    this.loop.end = parseInt(this.waveformVisualizer.mushraAudioControl.audioLoopEnd);
    // console.log(this.loop.start);
    var start = this.loop.start / this.waveformVisualizer.stimulus.audioBuffer.sampleRate;
    // round to 3 decimal places
    start = Math.round(start * 1000.0) / 1000.0;
    var end = this.loop.end / this.waveformVisualizer.stimulus.audioBuffer.sampleRate;
    end = Math.round(end * 1000.0) / 1000.0;
    for (i = 0; i < scales.length; ++i) {
        this.ratings[i] = { name: scales[i].name, value: scales[i].value };
    }

    for(const name in this.responses) {
        this.ratings.push({ name: name, value: [
            Math.round(this.responses[name].objects[0].position.x * 1000.0) / 1000.0, 
            Math.round(this.responses[name].objects[0].position.y * 1000.0) / 1000.0, 
            start, 
            end 
        ]});
    }
};

SpatialPage.prototype.store = function () {
    var trial = new Trial();
    trial.type = 'spatial_2d';
    trial.id = this.pageConfig.id;
    var i;
    for (i = 0; i < this.ratings.length; ++i) {
        var rating = this.ratings[i];
        var ratingObj = new MUSHRARating();
        ratingObj.stimulus = rating.name;
        ratingObj.name = rating.name;
        ratingObj.position = rating.value;
        if(!ratingObj.stimulusRating) {
            ratingObj.stimulusRating = rating.value;
        }
        ratingObj.time = this.time;
        trial.responses[trial.responses.length] = ratingObj;
    }
    this.session.trials[this.session.trials.length] = trial;
};
