function Scene(_parentDomElement, _camera, _pageConfig, _viewConfig) {
    this.pageConfig = _pageConfig;
    this.scene = [];  // Simplified scene, no need for Three.js objects
    this.parser = new DOMParser();
    this.wmCamera = _camera; // webMUSHRA camera
    this.camera = _camera.getCamera();
    this.viewConfig = _viewConfig;

    // Create a 2D canvas renderer instead of WebGL
    this.renderer = document.createElement('canvas');
    this.ctx = this.renderer.getContext('2d');
    this.renderer.width = _parentDomElement.getAttribute("width");
    this.renderer.height = _parentDomElement.getAttribute("height");
    _parentDomElement.appendChild(this.renderer);

    this.divHeight = _parentDomElement.getAttribute("height");

    this.height = null;
    this.width = null;
    this.depth = null;
    this.materialWall = null;
    this.material = null;
    this.materialWallLeft = null;
    this.materialWallRight = null;
    this.materialFloor = null;
    this.materialCeiling = null;
    this.ambient = null;
    this.wallLeft = null;
    this.wallRight = null;
    this.wall = null;
    this.wallfront = null;
    this.floor = null;
    this.ceiling = null;
};

Scene.prototype.transformRelativeCoordinates = function(_relX, _relY, _activeObjX, _activeObjY, _activeObjZ) {
    var position = [null, null, null];
    if (this.wmCamera.type == 1) { // orthographic camera
        if (this.viewConfig.view == 'front') {
            position[1] = -_relY + this.divHeight / 2;
            position[0] = _relX;
        } else if (this.viewConfig.view == 'back') {
            position[1] = -_relY + this.divHeight / 2;
            position[0] = -_relX;
        } else if (this.viewConfig.view == 'top') {
            position[0] = _relX;
            position[2] = _relY;
        } else if (this.viewConfig.view == 'right') {
            position[1] = -_relY + this.divHeight / 2;
            position[2] = -_relX;
        } else if (this.viewConfig.view == 'left') {
            position[1] = -_relY + this.divHeight / 2;
            position[2] = _relX;
        }

    } else { 
        var cameraDir = new THREE.Vector3(-this.wmCamera.getCameraX(), -this.wmCamera.getCameraY(), -this.wmCamera.getCameraZ());
        var cameraDir_n = new THREE.Vector3();
        cameraDir_n.copy(cameraDir);
        cameraDir_n.normalize();

        var quaternion_y = new THREE.Quaternion(); 
        quaternion_y.setFromUnitVectors(new THREE.Vector3(0, 0, -1), (new THREE.Vector3(cameraDir_n.x, 0, cameraDir_n.z)).normalize());
        var horizontal_rot = new THREE.Vector3();
        horizontal_rot = new THREE.Vector3(0, 0, -1);
        horizontal_rot.applyQuaternion(quaternion_y);

        var quaternion_tilt = new THREE.Quaternion();
        quaternion_tilt.setFromUnitVectors(horizontal_rot, cameraDir_n);

        var shift = cameraDir_n.dot(new THREE.Vector3(_activeObjX, _activeObjY, _activeObjZ));

        var scaling = (cameraDir.length()) * Math.tan(22.5 * Math.PI / 180) / (this.divHeight / 2);
        var unrotated = new THREE.Vector3(_relX * scaling, -_relY * scaling, 0);
        var rotated = unrotated.applyQuaternion(quaternion_y);

        rotated = rotated.applyQuaternion(quaternion_tilt);

        var newPos_vector = new THREE.Vector3(rotated.x, rotated.y, rotated.z);

        var newPos = new THREE.Vector3();
        newPos.addVectors(cameraDir, newPos_vector);
        newPos.normalize();

        newPos.multiplyScalar(Math.sqrt(Math.pow((cameraDir.length() + shift), 2) + Math.pow(newPos_vector.length() * (cameraDir.length() + shift) / cameraDir.length(), 2)));
        newPos.addVectors(newPos, cameraDir.negate());

        position[0] = newPos.x;
        position[1] = newPos.y;
        position[2] = newPos.z;
    }

    return position;
};

/**
 * Loads a scene into the room viewer.
 * @param {String} _roomXML Content of a room xml.
 */
Scene.prototype.load = function() {
    this.setAmbientLight(0xeeeeee);
    this.setDirectionalLight();
    this.buildRectangularElement();
};

/**
 *Renders the scene.
 */
Scene.prototype.render = function() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.renderer.width, this.renderer.height);

    // Drawing code here...
    // Example: Drawing the floor
    if (this.floor) {
        this.ctx.fillStyle = this.materialFloor;
        this.ctx.fillRect(this.floor.position.x, this.floor.position.y, this.width, this.depth);
    }
};

/**
 * Builds the rectangular elements (floor, walls, etc.).
 */
Scene.prototype.buildRectangularElement = function() {
    this.width = this.pageConfig.roomMeasurements[0];
    this.height = this.pageConfig.roomMeasurements[1];
    this.depth = this.pageConfig.roomMeasurements[2];

    // Set the material colors or patterns
    this.materialFloor = "#cccccc";  // Just a placeholder color
    this.floor = { position: { x: 0, y: this.height / 2, z: 0 }, width: this.width, depth: this.depth };

    this.materialWall = "#b0b0b0";  // Wall color

    // Create walls
    this.wall = { position: { x: 0, y: this.height / 2, z: -this.depth / 2 }, width: this.width, height: this.height };
    this.wallLeft = { position: { x: -this.width / 2, y: this.height / 2, z: 0 }, width: this.depth, height: this.height };
    this.wallRight = { position: { x: this.width / 2, y: this.height / 2, z: 0 }, width: this.depth, height: this.height };
    this.wallfront = { position: { x: 0, y: this.height / 2, z: this.depth / 2 }, width: this.width, height: this.height };

    // Example: floor positioning
    this.floor.rotation = { x: -Math.PI / 2 }; // Just for example
};

/**
 * Sets the ambient light color for the scene.
 * @param {string} _i Hexadecimal color for the light.
 */
Scene.prototype.setAmbientLight = function(_i) {
    this.ambient = _i;
};

/**
 * Sets the directional lights for the scene.
 */
Scene.prototype.setDirectionalLight = function() {
    // No lights in a 2D canvas rendering, so we can skip this part
};

/**
 * Set the material of walls and other objects.
 */
Scene.prototype.setGridWall = function(_grid) {
    if (_grid) {
        this.materialWall = "#f0f0f0";  // Grid material
    } else {
        this.materialWall = "#b0b0b0";  // Default wall material
    }
};
