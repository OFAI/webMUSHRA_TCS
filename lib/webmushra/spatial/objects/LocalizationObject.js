function LocalizationObject(_objConfig) {
  this.objConfig = _objConfig;
  // No need for THREE.js materials, using basic color for the circle
  this.color = _objConfig.color || '#FF0000'; // Default to red if no color is specified
  this.size = _objConfig.size || 10; // Default size
  this.position = { x: _objConfig.position[0], y: _objConfig.position[1] }; // 2D position
}

LocalizationObject.prototype.init = function(_ctx) { 
  // You don't need to add to a scene in a 2D canvas, but you'll use the context (_ctx) for drawing
  this.ctx = _ctx;
};

LocalizationObject.prototype.eventOnMouseUp = function(_event, _x, _y) {    
  // Handle mouse up events if needed
};

LocalizationObject.prototype.eventOnMouseDown = function(_event, _x, _y) {
  // Check if event coordinates are correctly passed
  if (_event) {
    const canvasRect = _event.target.getBoundingClientRect(); // Get the canvas's position on the page
    _x = _event.clientX - canvasRect.left; // Get the mouse's x position relative to the canvas
    _y = _event.clientY - canvasRect.top;  // Get the mouse's y position relative to the canvas
  }

  if (_x != null) {
    this.position.x = _x; // Set new x position
  }
  if (_y != null) {
    this.position.y = _y; // Set new y position
  }
};


LocalizationObject.prototype.render = function() {  
  // Draw the object on the canvas as a circle
  this.ctx.beginPath();
  this.ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2, false);
  this.ctx.fillStyle = this.color;
  this.ctx.fill();
};

LocalizationObject.prototype.getCenterPosition = function() {
  return [this.position.x, this.position.y];  
};

/**
 * Returns a hash map with values to save.
 */
LocalizationObject.prototype.storeValues = function(_trial, _session, _trial_id) {  
  if (_trial === null) {
    _trial = new Trial();
    _trial.type = this.objConfig.type;
    _trial.id = _trial_id;
    _session.trials[_session.trials.length] = _trial;	  
  }
  var rating = new SpatialLocalizationRating();
  rating.name = this.objConfig.name;
  rating.stimulus = this.objConfig.stimulus; 
  rating.position = [this.position.x, this.position.y]; // Save 2D position
  
  _trial.responses[_trial.responses.length] = rating;
};
