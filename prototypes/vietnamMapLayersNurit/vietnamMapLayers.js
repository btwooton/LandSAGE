var vietnamMapLayers = SAGE2_App.extend({
  init: function(data) {
    console.log(data);

    this.SAGE2Init('div', data);
    this.element.id = data.id;
    this.resizeEvents = "continuous";
    this.passSAGE2PointerAsMouseEvents = true;
    this.redraw = true;
    this.initialWidth = this.element.offsetWidth;
    this.initialHeight = this.element.offsetHeight;
    this.zoomLevel = 13;
    this.center = [22.597483, 104.492310];
    this.element.position = "relative";
    handleMenuMouseOver = this.handleMenuMouseOver;
    handleMenuMouseOut = this.handleMenuMouseOut;
    this.element.innerHTML = this.element.innerHTML
        +`<div id='`+this.element.id+`map' style='position:relative;width:100%;height:100%'></div>`
    this.element.innerHTML = this.element.innerHTML + `<div id='`+this.element.id+`control1' style='font-size:`+ui.titleBarHeight*1.2+`px;position:absolute; width:35%; top:80px; left: 12px;color:white;background:rgb(0,0,0,0.7);border-radius:5px; z-index:100000;padding:1em;font-family:Arial;visibility:hidden '><h2 style="padding-bottom:0.5em">Landslides</h2></div>
        <div id='`+this.element.id+`control2' style='font-size:`+ui.titleBarHeight*1.2+`px;position:absolute; width:35%; top:80px; left: 12px;color:white;background:rgb(0,0,0,0.7);border-radius:5px; z-index:100000;padding:1em;font-family:Arial;visibility:hidden '><h2 style="padding-bottom:0.5em">Human Factors</h2></div>
        <div id='`+this.element.id+`control3' style='font-size:`+ui.titleBarHeight*1.2+`px;position:absolute; width:35%; top:80px; left: 12px;color:white;background:rgb(0,0,0,0.7);border-radius:5px; z-index:100000;padding:1em;font-family:Arial;visibility:hidden '><h2 style="padding-bottom:0.5em">Natural Factors</h2></div>`;

    this.landslideControl = document.getElementById(this.element.id+'control1');
    this.humanControl = document.getElementById(this.element.id+'control2');
    this.natureControl = document.getElementById(this.element.id+'control3');

    this.controlParent = this.landslideControl.parentNode;
    this.mode = 0;
    //this.humanControl.style.visibility = 'visible';


    // to use special symbols
    let l = document.createElement('link');
    l.rel = "stylesheet";
    l.href= "https://use.fontawesome.com/releases/v5.7.2/css/all.css";
    l.integrity = "sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr";
    l.crossOrigin = "anonymous";
    document.body.appendChild(l);
    ////



    //this.map = L.map(this.element)
    this.map = L.map(document.getElementById(this.element.id+'map'))
      .setView(this.center, this.zoomLevel);

    this.tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
    });

    this.tileLayer.addTo(this.map);

    this.namDanCoords = this.getNamDanCoords();
    this.currentLayer = 0;
	// ---------------------------------------------------------------------------------------------------- Get bounds of nam dan coordinates, then adjust
  console.log("Nam Dan Coords", this.namDanCoords);
  /*
  this.namDanLayer = L.polygon(
    this.namDanCoords.map(function(coords) { return [coords[1], coords[0]]; }),
    {color: 'red'}
  );
  this.namDanLayer.addTo(this.map);
  */
  this.imageTopLeft = [
    Math.min(...this.namDanCoords.map(function(coords){ return coords[1]; })) + 0.0007,
    Math.min(...this.namDanCoords.map(function(coords){ return coords[0]; })) - 0.005
  ];

  this.imageBottomRight = [
    Math.max(...this.namDanCoords.map(function(coords){ return coords[1]; })) + 0.0005,
    Math.max(...this.namDanCoords.map(function(coords){ return coords[0]; })) + 0.003
  ];

  this.imageBounds = [this.imageTopLeft, this.imageBottomRight];
 
	// ---------------------------------------------------------------------------------------------------- Add image layers
	//let layerFileNames = this.getLayerFileNamesFromImageFolder();
  let layerFileNames = this.getLayerInformation();
  let layerPrefixPath = this.resrcPath + "images/";
	this.allLayerObjects = [];
	let tempLayer;
  let mapRef = this.map;

	for (let i = 0 ; i < layerFileNames.length; i++) {
		//tempLayer = L.imageOverlay(layerPrefixPath + layerFileNames[i],
    tempLayer = L.imageOverlay(layerPrefixPath + layerFileNames[i].file,
			this.imageBounds,
			{opacity: 0.45}); // More opacity? Less?. NOTE: Not added yet
		this.allLayerObjects.push(tempLayer);
		// Adding additional accounting
		tempLayer.enabled = true
		tempLayer.toggle = function () {
			this.enabled = !this.enabled;
			if (this.enabled) { this.removeFrom(mapRef); }
			else { this.addTo(mapRef); }
		}
    let _this = this;
    tempLayer.enable = function() {
      _this.disableAllLayers();
      this.enabled = true;
      this.addTo(mapRef);

      element = document.getElementById(_this.element.id+'_option_'+this.index);
      element.childNodes[0].classList.remove('fa-square');
      element.childNodes[0].classList.add('fa-check-square');
    }
    tempLayer.index = i;

    if (layerFileNames[i].type == 0) {//landslide
      this.landslideControl.innerHTML = this.landslideControl.innerHTML +
        '<div id="'+this.element.id+'_option_'+i+'" class="control_option" style="width:100%;padding:0.25em 0;border-top:1px solid white;"><i class="fa fa-square" style="padding-right:1em"></i>'+ layerFileNames[i].title +' </div>';
    }
    if (layerFileNames[i].type == 1) {//human Factors
      this.humanControl.innerHTML = this.humanControl.innerHTML +
        '<div id="'+this.element.id+'_option_'+i+'" class="control_option" style="width:100%;padding:0.25em 0;border-top:1px solid white;"><i class="fa fa-square" style="padding-right:1em"></i>'+ layerFileNames[i].title +' </div>';
    }
    if (layerFileNames[i].type == 2) {//natural Factors
      this.natureControl.innerHTML = this.natureControl.innerHTML +
        '<div id="'+this.element.id+'_option_'+i+'" class="control_option" style="width:100%;padding:0.25em 0;border-top:1px solid white;"><i class="fa fa-square" style="padding-right:1em"></i>'+ layerFileNames[i].title +' </div>';
    }
  }
  /*
  this.landslideControl.innerHTML = this.landslideControl.innerHTML +
  '<div style="padding-top:2em;"><span style="display:inline-block;width:50px">Start:</span><i class="fa fa-calendar"  style="font-size:30px"></i> </div>' +
  '<div style="padding-top:1em"><span style="display:inline-block;width:50px">End:</span><i class="fa fa-calendar"  style="font-size:30px"></i> </div>';

  this.landslideControl.innerHTML = this.landslideControl.innerHTML + 
      '<div id="' + this.element.id + 'close_control" style="padding-top:1em"><span style="display:inline-block; width:50px">Close:</span><i class="fa fa-window-close" style="font-size:30px;"></i></div>';
  
  this.natureControl.innerHTML = this.natureControl.innerHTML + 
  '<div id="' + this.element.id + 'close_control" style="padding-top:1em"><span style="display:inline-block; width:50px">Close:</span><i class="fa fa-window-close" style="font-size:30px;"></i></div>';
  
  this.humanControl.innerHTML = this.humanControl.innerHTML + 
      '<div id="' + this.element.id + 'close_control" style="padding-top:1em"><span style="display:inline-block; width:50px">Close:</span><i class="fa fa-window-close" style="font-size:30px;"></i></div>';
  */
  this.landslideMode();
  this.getFullContextMenuAndUpdate();
  this.addListeners();
  this.loadIcon();
  this.cursorMarker = null;

  // For eating synchronized cursor events
  this.eventLastFired = Date.now();

  this.handleMapZoom = this.handleMapZoom.bind(this);
  this.handleMapPan = this.handleMapPan.bind(this);
	this.handleMapMouseMove = this.handleMapMouseMove.bind(this);
	this.handleMapMouseClick = this.handleMapMouseClick.bind(this);
  this.placeMarkerAtLocation = this.placeMarkerAtLocation.bind(this);
  this.removeCursorMarker = this.removeCursorMarker.bind(this);
  this.removeControl = this.removeControl.bind(this);
  this.lsNumChildren = this.landslideControl.childNodes.length;
  this.humNumChildren = this.humanControl.childNodes.length;
  this.natNumChildren = this.natureControl.childNodes.length;
  /*
  this.landslideControl.childNodes[this.lsNumChildren-1].addEventListener(
    "click",
    this.removeControl
  );

  this.humanControl.childNodes[this.humNumChildren-1].addEventListener(
    "click",
    this.removeControl
  );

  this.natureControl.childNodes[this.natNumChildren-1].addEventListener(
    "click",
    this.removeControl
  );
  */
  this.landslideControl.get
  this.map.on('zoomend', this.handleMapZoom);
  this.map.on('moveend', this.handleMapPan);
  this.map.on('mousemove', this.handleMapMouseMove);
	this.map.on('mouseout', this.handleMapMouseOut);
	this.map.on('click', this.handleMapMouseClick)
 
	// ---------------------------------------------------------------------------------------------------- Server data grabber

  // Add the server based map view sync
	this.setupServerDataGrabber();

 
	// ---------------------------------------------------------------------------------------------------- Resize sync
	this.resizeData = {};
	this.resizeData.typeOptions = ["rs_styleExpandFromTopLeft", "rs_expandFromCenter", "rs_attemptToTileLock"];
	this.resizeData.type = {};
	for (let i = 0; i < this.resizeData.typeOptions.length; i++) {
		this.resizeData.type[this.resizeData.typeOptions[i]] = this.resizeData.typeOptions[i];
	}
	this.resizeData.selectedTypeIndex = 0;
	this.resizeData.selectedType = this.resizeData.typeOptions[this.resizeData.selectedTypeIndex];
	this.resizeData.squelch = {}; // need squelching to prevent inf resize loop
	this.resizeData.squelch.lastTime = Date.now();
	this.resizeData.squelch.shouldSendSync = false;
	this.resizeData.squelch.lastChangeFromSync = Date.now();
	this.resizeData.squelch.delay = 500; // Half a second? more? less?
	this.resizeData.squelch.queue = [];

}, // end init

placeMarkerAtLocation: function(latlng) {
  var now = Date.now();
  console.log(now - this.eventLastFired);
  if ((now - this.eventLastFired) >= this.fps * 1.5) {
    
    var newMarker = L.marker(latlng, {icon: this.icon}).addTo(this.map);
    if (this.cursorMarker !== null) {
      this.map.removeLayer(this.cursorMarker);
    }
    this.cursorMarker = newMarker;
    this.eventLastFired = now;
    this.redraw = true;
  }
},

removeControl: function() {
  this.controlParent.removeChild(this.landslideControl);
  this.controlParent.removeChild(this.humanControl);
  this.controlParent.removeChild(this.natureControl);
},

addControl: function(msgParams) {
  if (document.getElementById(this.element.id+'control1') === null) {
    this.controlParent.appendChild(this.landslideControl);
    this.controlParent.appendChild(this.humanControl);
    this.controlParent.appendChild(this.natureControl);
  }
  this.redraw = true;
  this.getFullContextMenuAndUpdate();
},

removeCursorMarker: function() {
  if (this.cursorMarker !== null && this.cursorMarker !== undefined) {
    this.map.removeLayer(this.cursorMarker);
  }
},

addListeners: function() {
  let _this = this;
  var elements = document.getElementsByClassName("control_option");
  var elementsArray = [];
  
  for (var i = 0; i < elements.length; i++) {
    elementsArray.push(elements[i]);
  }

  var elements = elementsArray.filter(function(element) {
    var tokens = element.id.split('_');
    var elementID = tokens[0] + '_' + tokens[1];
    return elementID === _this.id;
  });

  let mouse_out = function(event) {
    event.target.style.backgroundColor = "rgb(0,0,0,0)";
    event.target.style.color = "white";
  }
  let mouse_over = function(event) {
     event.target.style.backgroundColor = "gray";
     event.target.style.color = "black";
   }
   let mouse_click = function(event) {
     tokens = event.target.id.split("_");
     index = parseInt(tokens[tokens.length - 1]);
     _this.allLayerObjects[index].enable();
    }
  for (var i = 0; i < elements.length; i++) {
    elements[i].addEventListener('mouseout', mouse_out, false);
    elements[i].addEventListener('mouseover', mouse_over, false);
    elements[i].addEventListener('click', mouse_click, false);
  }
},

disableAllLayers: function(){
  for (let i = 0 ; i < this.allLayerObjects.length; i++) {
    if (this.allLayerObjects[i].enabled) { this.allLayerObjects[i].removeFrom(this.map); }
    this.allLayerObjects[i].enabled = false;
    element = document.getElementById(this.element.id+'_option_'+this.allLayerObjects[i].index);
    element.childNodes[0].classList.add('fa-square');
    element.childNodes[0].classList.remove('fa-check-square');
  }
},
getContextEntries: function() {
  var entries = [];

  var entry   = {
      description: "Landslide mode", // A string
      callback: "landslideMode", // Name of an existing function within this application. Must be in a string.
      parameters: {}, // An object that will be passed to the callback function
    };
  entries.push(entry);
  entry   = {
      description: "Human mode", // A string
      callback: "humanMode", // Name of an existing function within this application. Must be in a string.
      parameters: {}, // An object that will be passed to the callback function
  };
  entries.push(entry);
  entry   = {
      description: "Nature mode", // A string
      callback: "naturalMode", // Name of an existing function within this application. Must be in a string.
      parameters: {}, // An object that will be passed to the callback function
  };
  entries.push(entry);
  entry = {
    description: "Add Controls",
    callback: "addControl",
    parameters: {},
  };
	entries.push(entry);
	entries.push({ description: "separator" }); // This creates a line entry used for visual separation
  entry = {
    description: "Next Resize Style",
    callback: "rs_cycleToNextResizeStyle",
    parameters: {},
  };
  entries.push(entry);
  entries.push({ description: "separator" }); // This creates a line entry used for visual separation
  return entries;
},
test : function(msgParams){

  console.log("fuck");
},
landslideMode: function(msgParams) {
  this.mode = 0;
  this.landslideControl.style.visibility = 'visible';
  this.humanControl.style.visibility = 'hidden';
  this.natureControl.style.visibility = 'hidden';
  // choose the first in the mode
  this.allLayerObjects[1].enable();
  this.redraw = true;
  this.getFullContextMenuAndUpdate();
},
humanMode: function(msgParams) {
  console.log("HHHHHHHHHHHHHH");
  this.mode = 1;
  this.landslideControl.style.visibility = 'hidden';
  this.humanControl.style.visibility = 'visible';
  this.natureControl.style.visibility = 'hidden';
  // choose the first in the mode
  this.allLayerObjects[0].enable();
  this.redraw = true;
  this.getFullContextMenuAndUpdate();
},
naturalMode: function(msgParams) {
  this.mode = 2;
  this.landslideControl.style.visibility = 'hidden';
  this.humanControl.style.visibility = 'hidden';
  this.natureControl.style.visibility = 'visible';
  // choose the first in the mode
  this.allLayerObjects[3].enable();
  this.redraw = true;
  this.getFullContextMenuAndUpdate();
},
load: function(date) {

},

setupServerDataGrabber: function() {
	this.dataLinking = {};
	this.dataLinking.varForCenterLock = "KeepCenterLocked";
	this.dataLinking.disableCounters = {}; // Used to prevent self updates
	this.dataLinking.disableCounters.boundsFromMap = 0;
	this.dataLinking.lastTime = Date.now();

	// Unsure if better way. Params are: server variable name, name of local method to handle
	this.serverDataSubscribeToValue(this.dataLinking.varForCenterLock, "handleServerData" + this.dataLinking.varForCenterLock);

	// This sets up the bound change detection
	this.map.on("moveend", () => {
		// disable counter for bounds is to prevent inf trigger on self from late packets
		if (this.dataLinking.disableCounters.boundsFromMap > 0) {
			this.dataLinking.disableCounters.boundsFromMap--;
		} else {
			let c = {
				c: this.map.getCenter(),
				z: this.map.getZoom(),
				t: Date.now(),
				s: this.id
			}
			this.dataLinking.lastTime = c.t;
			// this.dataLinking.disableCounters.boundsFromMap++; // Prevent self trigger
			this.serverDataSetValue(this.dataLinking.varForCenterLock, c, "Center data for view");
		}
	});
},

handleServerDataKeepCenterLocked: function(value) {
	console.log("handleServerDataKeepCenterLocked");
	if (value.s !== this.id) {
		if (this.dataLinking.lastTime + 200 < value.t) {
			// if (this.dataLinking.disableCounters.boundsFromMap > 0) {
			// 	this.dataLinking.disableCounters.boundsFromMap--;
			// 	console.log("--Squelching");
			// } else {
				console.log("--Using");
				this.dataLinking.disableCounters.boundsFromMap++;
				this.map.setZoom(value.z);
				this.dataLinking.disableCounters.boundsFromMap++; // Prevent trigger from self
				this.map.setView([value.c.lat, value.c.lng]);
			// }
		}
	}
},

draw: function(date) {

  if (this.redraw) {
    this.redraw = false;
    console.log(this.zoomLevel);
    console.log(this.center);
    this.map.invalidateSize();
	}
	this.rs_checkIfNeedResize();
},

resize: function(date) {
    var percentChange = (this.element.offsetHeight - this.initialHeight) / (this.initialHeight * 15);
    this.initialHeight = this.element.offsetHeight;
    this.initialWidth = this.element.offsetWidth;

    this.zoomLevel += this.zoomLevel * percentChange;
    console.log(this.zoomLevel);
    this.map.setZoom(this.zoomLevel);
    this.map.panInside(this.center);

		this.redraw = true;

		this.rs_update();
		
    this.refresh(date); //redraw after resize
},

event: function(type, position, user, data, date) {
    if (type == "specialKey") {
      if (data.code == 37) { //left
        console.log(this.allLayerObjects);
      }
      else if (data.code == 39) { //right
        if (this.currentLayer < this.allLayerObjects.length-1) {
          this.allLayerObjects[this.currentLayer].toggle();
          this.currentLayer++;
          this.allLayerObjects[this.currentLayer].toggle();
        }
        else {
          this.allLayerObjects[this.currentLayer].toggle();
          this.currentLayer = 0;
          this.allLayerObjects[this.currentLayer].toggle();
        }
			} else if ((data.code === 13) && (data.state === "up")) {
				if (document.getElementById(this.element.id+'control1') === null) {
					this.addControl();
				} else {
					this.removeControl();
				}
			}
    }
    this.refresh(date);
},

move: function(date) {
    this.redraw = true;
    this.refresh(date);
},

quit: function() {
    this.log("Done");
},

// ---------------------------------------------------------------------------------------------------- Resize types

rs_cycleToNextResizeStyle: function() {
	this.resizeData.selectedTypeIndex++;
	if (this.resizeData.selectedTypeIndex >= this.resizeData.typeOptions.length) {
		this.resizeData.selectedTypeIndex = 0;
	}
	this.resizeData.selectedType = this.resizeData.typeOptions[this.resizeData.selectedTypeIndex];
	console.log("Resize selectedType", this.resizeData.selectedType);
},


/*
	Changed over time...

	Current format: track lastTime this received a resize.
*/
rs_update: function() {
	if (this.resizeData.squelch.lastChangeFromSync + this.resizeData.squelch.delay * 2 < Date.now()) {
		this.resizeData.squelch.lastTime = Date.now();
		this.resizeData.squelch.shouldSendSync = true;
		console.log("Resize thinks should send sync after delay");
	}
},

// Get other apps like this one then perform the resize method.
rs_determineTypeToActivate: function() {
	let size = {};
	size.time = Date.now();
	size.w = this.sage2_width;
	size.h = this.sage2_height;
	let appsToResize = this.rs_getOtherAppsLikeThisType();
	this[this.resizeData.selectedType](size, appsToResize);
},

// For this method keep everything in the same top left position and expand.
rs_styleExpandFromTopLeft: function(size, appsToResize) {
	console.log("Resize thinks should tell others rs_styleExpandFromTopLeft");
	let appSize;
	// For each app, keep their original x, y, but use this app's width / height;
	appsToResize.forEach((app) => {
		appSize = Object.assign({}, size);
		appSize.x = app.sage2_x;
		appSize.y = app.sage2_y - ui.titleBarHeight; // The issue with title bars affecting location
		app.resizeData.squelch.queue.push(appSize);
	});
},

rs_expandFromCenter: function(size, appsToResize) {
	console.log("Resize thinks should tell others rs_expandFromCenter");
	let appSize, center = {};
	// For each app, keep their original x, y, but use this app's width / height;
	appsToResize.forEach((app) => {
		center.x = app.sage2_x + (app.sage2_width / 2); // current center
		center.y = (app.sage2_y - ui.titleBarHeight)+ (app.sage2_height / 2); // Does titlebar affect? unsure...
		appSize = Object.assign({}, size);
		appSize.x = center.x - (size.w / 2);
		appSize.y = center.y - (size.h / 2);
		app.resizeData.squelch.queue.push(appSize);
	});
},

rs_attemptToTileLock: function(size, appsToResize) {
	console.log("Resize thinks should tell others rs_attemptToTileLock");
	// Prioritize vertical stacking
	let verticalSupport = ui.json_cfg.resolution.height * ui.json_cfg.layout.rows; // total vertical resolution
	let border = 50;
	verticalSupport = parseInt(verticalSupport / (size.h + border)); // How many are supported

	// If it got resized beyond the height, assume at least one is supported.
	if (verticalSupport < 1) { vertCounter = 1; }
	let vertCounter = 0;
	let horiCounter = 0;
	let appSize;
	// use this app as part of the position
	appsToResize.splice(0, 0, this); // params: index, delete amount, insert elements
	appsToResize.forEach((app) => {
		appSize = Object.assign({}, size);
		appSize.x = horiCounter * (size.w + border)
		appSize.y = vertCounter * (size.h + border);
		app.resizeData.squelch.queue.push(appSize);
		vertCounter++;
		if (vertCounter >= verticalSupport) {
			vertCounter = 0;
			horiCounter++;
		}
	});
},

rs_getOtherAppsLikeThisType: function() {
	let akeys = Object.keys(applications);
	let app, appsLikeThis = [];
	for (let i = 0; i < akeys.length; i++) {
		app = applications[akeys[i]];
		if ((app.id !== this.id)
			&& (app.application === this.application)) {
				appsLikeThis.push(app);
		}
	}
	return appsLikeThis;
},

/*
	Resize is based upon the squelch queue. Only uses the most recent.
	Then send system update packets for position and resize.
	
	Unsure if bug:
		updateApplicationPosition, necessary to update position. BUT doens't visually update.
		resize causes the position to update even if no size(w/h) change.
*/
rs_checkIfNeedResize: function() {

	// If app thinks got a user resize event, and the time period of waiting for resize ended, try determine which resize method to use.
	if (this.resizeData.squelch.shouldSendSync) {
		if (this.resizeData.squelch.lastTime + this.resizeData.squelch.delay < Date.now()) {
			this.resizeData.squelch.shouldSendSync = false;
			console.log("Resize thinks should tell other like apps to update now");
			this.rs_determineTypeToActivate();
		}
	}


	// Otherwise, if this app received a resize from another, it will end up in the squelch queue, and only use the most recent.
	let mostRecent = null;
	if (this.resizeData.squelch.queue.length > 0) {
		mostRecent = this.resizeData.squelch.queue[0];
		for (let i = 1; i < this.resizeData.squelch.queue.length; i++) {
			if (mostRecent.time < this.resizeData.squelch.queue[i].time) {
				mostRecentTime = this.resizeData.squelch.queue[i];
			}
		}
	}
	if (mostRecent) {
		console.log("Resize thinks needs to update based on notification from another app");
		this.resizeData.squelch.queue = []; // clear out the squelch queue.
		let posAdjust = {};
		posAdjust.appPositionAndSize = {};
		posAdjust.appPositionAndSize.elemId = this.id;
		posAdjust.appPositionAndSize.elemLeft = mostRecent.x;
		posAdjust.appPositionAndSize.elemTop = mostRecent.y;
		posAdjust.appPositionAndSize.elemHeight = mostRecent.h;
		posAdjust.appPositionAndSize.elemWidth = mostRecent.w;
		console.log("Repositioning using:", mostRecent);
		// send
		wsio.emit("updateApplicationPosition", posAdjust);
		setTimeout( () => { this.sendResize(mostRecent.w, mostRecent.h); }, this.resizeData.squelch.delay / 2);
		this.resizeData.squelch.lastChangeFromSync = Date.now();
	}
},



// ---------------------------------------------------------------------------------------------------- Map events
handleMapZoom: function(e) {
  this.zoomLevel = e.target._zoom;
  this.redraw = true;
},

handleMapPan: function(e) {
  this.center = [this.map.getCenter().lat, this.map.getCenter().lng];
  this.redraw = true;
},

handleMapMouseMove: function(e) {
  // console.log(e.latlng);
  for (appID in applications) {
    if (appID !== this.id && (applications[appID].application === this.application || applications[appID].application === "wholeVietnamMap")) {
      // console.log(applications[appID]);
      var latlng = [e.latlng.lat, e.latlng.lng];
      applications[appID].placeMarkerAtLocation(latlng);
    } else {
      this.removeCursorMarker();
    }
  }
},

handleMapMouseOut: function(e) {
  for (appID in applications) {
    if (applications[appID].application === this.application || applications[appID].application === "wholeVietnamMap") {
      applications[appID].removeCursorMarker();
    }
  }
},

handleMapMouseClick: function(e) {
	// console.log("map click", e);
	// if there is a webview and it is on windy, then update the coordinates.
  for (appID in applications) {
    if ((applications[appID].application === "Webview" )&& (applications[appID].state.url.includes("windy.com"))) {
			applications[appID].changeURL("https://www.windy.com/" + e.latlng.lat + "/" + e.latlng.lng + "?14.900,103.480,6", false);
			// https://www.windy.com/18.681/105.521?rainAccu,18.088,105.524,8,m:ecjai41
		}
  }
},

//----------------------------------------------------------------------------------------------------- Menu Events
handleMenuMouseOver: function(el) {
  el.style.opacity = 1;
},
handleMenuMouseOut: function(el) {
  el.style.opacity = 0;
},
// ---------------------------------------------------------------------------------------------------- Data Storage


getNamDanCoords: function() {
	return [
		[104.53433990478521, 22.600080490112305],
		[104.52680969238281, 22.598884582519645],
		[104.5262451171875, 22.597156524658203],
		[104.52052307128906, 22.59026908874523],
		[104.5198364257813, 22.58804512023937],
		[104.5182037353515, 22.588111877441406],
		[104.5111465454101, 22.579690933227653],
		[104.51381683349604, 22.575023651123047],
		[104.5121078491211, 22.569698333740234],
		[104.50918579101574, 22.567895889282227],
		[104.50345611572277, 22.567920684814396],
		[104.50194549560558, 22.568916320800895],
		[104.50160980224604, 22.567518234252987],
		[104.49979400634771, 22.567356109619084],
		[104.49396514892572, 22.569669723510856],
		[104.48394012451178, 22.570178985595817],
		[104.47723388671875, 22.568000793457145],
		[104.4755477905274, 22.566082000732422],
		[104.47188568115234, 22.56677627563471],
		[104.46526336669928, 22.56536865234375],
		[104.46131896972668, 22.56722640991211],
		[104.45981597900402, 22.572462081909237],
		[104.46635437011719, 22.574806213378963],
		[104.46467590332037, 22.57940483093273],
		[104.46292114257812, 22.589218139648438],
		[104.46248626708996, 22.594860076904297],
		[104.46390533447266, 22.597913742065373],
		[104.46015930175793, 22.601863861084098],
		[104.4590530395509, 22.604158401489258],
		[104.46044921875, 22.607482910156364],
		[104.46017456054699, 22.610662460327262],
		[104.4622192382813, 22.613180160522404],
		[104.46424865722656, 22.618387222290153],
		[104.47553253173828, 22.629915237426758],
		[104.479965209961, 22.630012512206974],
		[104.48390197753906, 22.631443023681584],
		[104.48668670654308, 22.631084442138672],
		[104.48731994628906, 22.629417419433707],
		[104.4920883178711, 22.629661560058594],
		[104.4926528930664, 22.628423690796012],
		[104.49343872070312, 22.628305435180778],
		[104.49507904052746, 22.628963470458928],
		[104.49832916259777, 22.628643035888672],
		[104.5018920898438, 22.627481460571346],
		[104.50289916992199, 22.625940322876033],
		[104.50436401367193, 22.626493453979606],
		[104.50683593750006, 22.625469207763786],
		[104.50782775878912, 22.62599372863781],
		[104.51044464111328, 22.624897003173942],
		[104.51514434814447, 22.624673843383903],
		[104.51828765869146, 22.618677139282227],
		[104.51986694335949, 22.613346099853516],
		[104.52422332763678, 22.611944198608455],
		[104.53142547607422, 22.611270904541016],
		[104.53483581542969, 22.60900306701666],
		[104.53626251220714, 22.603666305541992],
		[104.53452301025396, 22.60245704650879],
		[104.53433990478521, 22.600080490112305]
	];
},

getLayerFileNamesFromImageFolder: function() {
	return [
		["DEM_0000_assets-value-distribution.png"],
		["DEM_0001_landslide-hazard-index.png"],
		["DEM_0002_landslide-hazard-zonation.png"],
		["DEM_0003_vertical-segmentation.png"],
		["DEM_0004_geologic-lithology.png"],
		["DEM_0005_housing-distribution.png"],
		["DEM_0006_rainfall-zonation.png"],
		["DEM_0007_geomorphology.png"],
		["DEM_0008_road-density.png"],
		["DEM_0009_population-density-distribution.png"],
		["DEM_0010_fracture-density.png"],
		["DEM_0011_density-of-horizontal-segmentation.png"],
		["DEM_0012_land-use.png"],
		["DEM_0013_slope-aspect.png"],
		["DEM_0014_slope-angle.png"],
		["DEM_0015_weathering-coverage.png"],
		["DEM_0016_landslide-inventory.png"],
		["DEM_0017_Layer-1.png"],
	];
},

loadIcon: function() {
  if (this.icon === undefined) {
    this.icon = L.icon({
      iconUrl: this.resrcPath + '/images/icon.png',
      iconSize: [40, 60],
      iconAnchor: [0, 0],
    });
  }
},

getLayerInformation: function() {
	return [
		{"file":"DEM_0000_assets-value-distribution.png", "title":"Assets Value Distribution", "type":1 },
		{"file":"DEM_0001_landslide-hazard-index.png", "title":"Landslide Hazard Index", "type":0},
		{"file":"DEM_0002_landslide-hazard-zonation.png", "title":"Landslide Hazard Zonation", "type":0},
		{"file":"DEM_0003_vertical-segmentation.png", "title":"Vertical Segmentation","type":2},
		{"file":"DEM_0004_geologic-lithology.png", "title":"Geologic Lithology","type":2},
		{"file":"DEM_0005_housing-distribution.png", "title":"Housing Distribution", "type":1},
		{"file":"DEM_0006_rainfall-zonation.png", "title":"Rainfall Zonation","type":2},
		{"file":"DEM_0007_geomorphology.png", "title":"Geomorphology","type":2},
		{"file":"DEM_0008_road-density.png", "title":"Road Density","type":1},
		{"file":"DEM_0009_population-density-distribution.png", "title":"Population Density Distribution","type":1},
		{"file":"DEM_0010_fracture-density.png", "title":"Fracture Density","type":2},
		{"file":"DEM_0011_density-of-horizontal-segmentation.png", "title":"Density of Horizontal Segmentation","type":2},
		{"file":"DEM_0012_land-use.png", "title":"Land Use","type":1},
		{"file":"DEM_0013_slope-aspect.png", "title":"Slope Aspect","type":2},
		{"file":"DEM_0014_slope-angle.png", "title":"Slope Angle","type":2},
		{"file":"DEM_0015_weathering-coverage.png", "title":"Weathering Coverage","type":2},
		{"file":"DEM_0016_landslide-inventory.png", "title":"Landslide Inventory", "type":0},
		{"file":"DEM_0017_Layer-1.png", "title":"DEM","type":2},
	];
}
});
