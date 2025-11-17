/*************************************************************************
         (C) Copyright AudioLabs 2017 

This source code is protected by copyright law and international treaties. This source code is made available to You subject to the terms and conditions of the Software License for the webMUSHRA.js Software. Said terms and conditions have been made available to You prior to Your download of this source code. By downloading this source code You agree to be bound by the above mentionend terms and conditions, which can also be found here: https://www.audiolabs-erlangen.de/resources/webMUSHRA. Any unauthorised use of this source code may result in severe civil and criminal penalties, and will be prosecuted to the maximum extent possible under law. 

**************************************************************************/

/**
* @class GenericPage
* @property {string} title the page title
* @property {string} the page content
*/
function GenericPage(_pageManager, _pageConfig) {
  this.pageManager = _pageManager;
  this.title = _pageConfig.name;
  this.id = _pageConfig.id;
  this.content = _pageConfig.content;
  this.language = _pageConfig.language;
}

/**
* Returns the page title.
* @memberof GenericPage
* @returns {string}
*/
GenericPage.prototype.getName = function () {
  return this.title;
};

/**
* Renders the page
* @memberof GenericPage
*/
GenericPage.prototype.render = function (_parent) {
  _parent.append(this.content);
  
  if (this.id === "welcome_page0") {
    let img = new Image();
    img.src = 'configs/resources/images/logo/Logo_comic.jpg';
    img.alt = 'Mensch und Maschine treten in einer Quizshow gegeneinander an';  // Optional alt text for accessibility
    img.onload = function() {
      const scaleFactor = 3; // Scale by 4 times smaller
      img.width = img.width / scaleFactor;  // Adjust width
      img.height = img.height / scaleFactor;  // Adjust height
      _parent.append(img);  // Append the scaled image to the parent element
    };
  } else if (this.id === "welcome_page1") {
    let img = new Image();
    img.src = 'res/spatial/austria_map_recorded_places.png';
    img.alt = 'Karte von Österreich mit roten Punkten an den Orten von denen Aufnahmen verwendet wurden.';  // Optional alt text for accessibility
    _parent.append(img);  // Append the image to the parent element
  } else if (this.id === "welcome_page2") {
    let img = new Image();
    img.src = 'configs/resources/images/Austria_map_with_states_2.png';
    img.alt = 'Österreichkarte mit farbigen Einteilungen der 6 verschiedenen Dialektgruppen';
    _parent.append(img);  // Append the image to the parent element
  } else if (this.id === "welcome_page3") {
    let img = new Image();
    img.src = 'configs/resources/images/map_with_true_and_prediction.png';
    img.alt = 'Korrekter Ort, KI Vorhersage';
    _parent.append(img);  // Append the image to the parent element
  } else if (this.id === "welcome_page4") {
    let img = new Image();
    img.src = 'configs/resources/images/logo/Logo_comic.jpg';
    img.alt = 'Mensch und Maschine treten in einer Quizshow gegeneinander an';  // Optional alt text for accessibility
    img.onload = function() {
      const scaleFactor = 3; // Scale by 4 times smaller
      img.width = img.width / scaleFactor;  // Adjust width
      img.height = img.height / scaleFactor;  // Adjust height
      _parent.append(img);  // Append the scaled image to the parent element
    }
  }
  return;
};

/**
* Saves the page
* @memberof GenericPage
*/
GenericPage.prototype.save = function () {
};
