var LandSAGE = SAGE2_App.extend({
  init: function (data) {
    this.SAGE2Init('div', data);
    this.resizeEvents = "continuous";
    this.passSAGE2PointerAsMouseEvents = true;

    // Initializing the Map
    var northEast = [21.08450008351735, 109.84130859375001];
    var southWest = [5.222246513227375, 93.09814453125];
    this.map = L.map(this.element, {
      minZoom: 4,
      maxZoom: 8
    });
    this.map.fitBounds([northEast, southWest]);

    // Creating the Loader for data loading message
    this.createLoader();

    // Binding popup events to markers
    this.bindPopupOpenEvent();

    // For access to the TMD API
    this.apiUID = 'u62bwooton';
    this.apiUKey = 'a11d133c2049c1d048284200c8bfe937';


    // For access to the FileSystem; Needed for reading/writing of cached data
    this.fs = require('fs');
    this.os = require('os');
    console.log(this.fs);
    console.log(this.resrcPath + 'data/');

    // Load all resources
    this.loadMRCSensorIDs();
    this.getUrls();
    this.getApplicationDirectoryFromFS();

    // Boolean fields for tracking when data sources are loaded
    this.cdmDataLoaded = false;
    this.tmdDataLoaded = false;
    this.mrcBoundaryLoaded = false;
    this.mrcMekongLoaded = false;
    this.markerDataLoaded = false;
    this.monthlyRainfallDataLoaded = false;

    // Boolean field for controlling when redraw occurs
    this.redraw = true;

    // Boolean field for checking when layer control has initialized
    this.layerControlsInitialized = false;

    this.initializeTileLayers();

    // initialize an empty array for storing geoJSON layers
    this.geoLayers = {};
    // initialize an empty array for storing data collections
    this.mapDataCollections = {};
    this.markerData = [];
    // initialize and empty array for storing Leaflet Markers
    this.leafletMarkers = [];
    this.requiredLength = this.markerUrls.length;

    this.fetchData(this.tmdUrl, "loadTMDData");
    this.fetchData(this.tmdRainfallUrl, "loadMonthlyRainfallData");
    this.fetchData(this.geoJsonUrls, "loadMRCData");
    this.fetchData(this.markerUrls, "loadMarkerData");
    this.fetchData(this.cdmUrl, "loadCDMData");

  },

  load: function (date) {

  },

  draw: function (date) {
    this.initializeControlsIfNeeded();
    if (this.redraw) {
      this.map.invalidateSize();
      let dataLoaded = this.isDataLoaded();
      this.renderLoader(dataLoaded);
      this.redraw = false;
    }
  },

  resize: function (date) {
    this.redraw = true;
    this.repositionLoader();
    this.refresh(date); //redraw after resize
  },

  event: function (type, position, user, data, date) {

    this.refresh(date);
  },

  move: function (date) {

    this.refresh(date);
  },

  quit: function () {
    this.log("Done");
  },

  /* Method for Fetching Data from Remote APIs */
  fetchData: function (urls, callback) {
    this.applicationRPC({ urls: urls }, callback, true);
  },

  // Methods for Loading Data from Various Sources ======================
  loadTMDData: function (response) {
    var data = response.data.replace("@attributes", "attributes").trim();
    var stations = JSON.parse(data)['Stations'];
    if (stations['Station'] === undefined) {
      this.loader.innerHTML = "<h1>No TMD Data</h1>";
      this.loader.appendChild(this.loaderSpinner);
      this.readDataFromCache("TMDSensors");
      return;
    }
    this.sensorData = stations['Station'];
    this.writeDataToCache('TMDSensors');
    console.log("Loaded data from TMD");
    this.generateGeoJSONFromSensorData();
    this.makeTMDGeoJSON();
    this.tmdDataLoaded = true;
  },

  loadMonthlyRainfallData: function (response) {
    var data = response.data.replace("@attributes", "attributes").trim();
    try {
      this.rainfallData = JSON.parse(data)["StationMonthlyRainfall"];
      this.monthlyRainfallDataLoaded = true;
      this.calculateScaleForRainfall();
      this.writeDataToCache("TMDMonthlyRainfall");
      console.log("Loaded monthly rainfall data");
    } catch(err) {
      this.readDataFromCache("TMDMonthlyRainfall");
    }
  },

  loadMRCData: function (response) {
    var uriPath = response.resp.request.uri.path;
    try {
      var responseData = JSON.parse(response.data);
      var properties = responseData["features"][0].properties;
      var style = {
        "color": properties["stroke"],
        "weight": properties["stroke-width"] * 1.5,
        "opacity": properties["stroke-opacity"]
      };
      if (uriPath === "/lmb-boundary.geojson") {
        console.log("Loaded MRC Boundary Path");
        this.mrcBoundaryData = responseData;
        this.mrcBoundaryLoaded = true;
        this.geoLayers["MRCBoundary"] = L.geoJSON(responseData, {
          style: style
        });
        this.writeDataToCache("MRCBoundary");
      } else {
        console.log("Loaded MRC Mekong Path");
        this.mrcMekongData = responseData;
        this.mrcMekongLoaded = true;
        this.geoLayers["MRCMekong"] = L.geoJSON(responseData, {
          style: style
        });
        this.writeDataToCache("MRCMekong");
      }
    } catch (err) {
      if (uriPath === "/lmb-boundary.geojson") {
        this.readDataFromCache("MRCBoundary");
      } else {
        this.readDataFromCache("MRCMekong");
      }
    }
  },

  loadCDMData: function (response) {
    try {
      this.mapDataCollections["CDMData"] = JSON.parse(response.data);
      this.cdmDataLoaded = true;
      this.writeDataToCache("CDM");
      console.log("Loaded CDM Data");
      this.makeCDMGeoJSON();
    } catch(err) {
      this.readDataFromCache("CDM");
    }
  },


  loadMarkerData: function (response) {
    if (response.data !== undefined) {
      this.markerData.push(JSON.parse(response.data));
    } else {
      this.requiredLength--;
    }
    if (this.markerData.length == this.requiredLength) {
      if (this.markerData.length > 0) {
        this.markerDataLoaded = true;
        console.log("Loaded MRC Sensor Data from " + this.requiredLength + " sensors");
        this.writeDataToCache("MRCMarkers");
        this.makeSensorMarkersGeoJSON();
      } else {
        this.readDataFromCache("MRCMarkers");
      }
    }
  },

  // Methods for adding data to the map once loaded from source =======
  makeTMDGeoJSON: function () {
    var _this = this;
    var geoJSONMarkerOptions = {
      radius: ui.titleBarHeight * 0.25,
      fillColor: "#0078ff",
      color: "#000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8,
      interactive: true,
      riseOnHover: true,
      alt: "TMDWeatherSensor"
    };
    this.geoLayers["TMD"] = L.geoJSON(this.mapDataCollections["TMDData"], {
      pointToLayer: function (feature, latlng) {
        var marker = L.circleMarker(latlng, geoJSONMarkerOptions);
        _this.leafletMarkers.push(marker);
        return marker;
      }
    });
  },

  makeCDMGeoJSON: function () {
    var _this = this;
    var geoJSONMarkerOptions = {
      radius: ui.titleBarHeight * 0.25,
      fillColor: "#69b57b",
      color: "#000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8,
      interactive: true,
      riseOnHover: true,
      alt: "CDMWeatherSensor"
    };
    this.geoLayers["CDM"] = L.geoJSON(this.mapDataCollections["CDMData"], {
      pointToLayer: function (feature, latlng) {
        var marker = L.circleMarker(latlng, geoJSONMarkerOptions);
        _this.leafletMarkers.push(marker);
        return marker;
      }
    });
    this.bindStyleToPopupsAndControls();
  },

  makeSensorMarkersGeoJSON: function () {
    let markerList = [];
    for (let markerDatum of this.markerData) {
      let latLng = [
        markerDatum.latitude,
        markerDatum.longitude
      ];
      let geoJSONMarkerOptions = {
        radius: ui.titleBarHeight * 0.25,
        fillColor: "#e62615",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
        interactive: true,
        riseOnHover: true,
        alt: "MRCRiverSensor",
      };
      let marker = L.circleMarker(latLng, geoJSONMarkerOptions);
      this.leafletMarkers.push(marker);
      let popup = L.popup()
        .setContent(this.constructPopupContent(markerDatum));
      marker.bindPopup(popup, { maxWidth: 1000 });
      markerList.push(marker);
    }
    let markersGroup = L.layerGroup(markerList);
    this.geoLayers["MRCSensors"] = markersGroup;
  },

  calculateScaleForRainfall: function () {
    var keys = [
      'RainfallJAN',
      'RainfallFEB',
      'RainfallMAR',
      'RainfallAPR',
      'RainfallMAY',
      'RainfallJUN',
      'RainfallJUL',
      'RainfallAUG',
      'RainfallSEP',
      'RainfallOCT',
      'RainfallNOV',
      'RainfallDEC'
    ];
    var max = 0;
    for (let datum of this.rainfallData) {
      let monthlyRainfallValues = datum["MonthlyRainfall"];
      for (let key of keys) {
        if (Number(monthlyRainfallValues[key]) > max) {
          max = Number(monthlyRainfallValues[key]);
        }
      }
    }
    this.rainfallScale = [0, max + 100];
  },

  generateGeoJSONFromSensorData: function () {
    var geoJSON = {
      type: "FeatureCollection",
      features: [],
    };

    for (var i = 0; i < this.sensorData.length; i++) {
      var sensorDatum = this.sensorData[i];
      var feature = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [sensorDatum.Longitude, sensorDatum.Latitude],
        },
        properties: {
          name: sensorDatum.StationNameEnglish,
          nameThai: sensorDatum.StationNameThai,
          number: sensorDatum.WmoStationNumber,
          observation: sensorDatum.Observation,
          province: sensorDatum.Province
        }
      };
      geoJSON.features.push(feature);
    }
    this.mapDataCollections["TMDData"] = geoJSON;
  },

  createHTMLTableFromProperties: function (properties) {
    var _this = this;
    var element = document.createElement('table');
    var inner = "<tr><th>Name </th><td>" + properties.name + "</td></tr>";
    inner += "<tr><th>Thai Name </th><td>" + properties.nameThai + "</td></tr>";
    inner += "<tr><th>StationNumber </th><td>" + properties.number + "</td></tr>";
    inner += '<tr style="color:#2a60b0;"><th>Rainfall24Hr </th><td>' + properties.observation.Rainfall24Hr + " mm</td></tr>";
    inner += '<tr style="color:#2a60b0;"><th>AirTemperature </th><td>' + properties.observation.AirTemperature + " C</td></tr>";
    inner += '<tr style="color:#2a60b0;"><th>DewPoint </th><td>' + properties.observation.DewPoint + " C</td></tr>";
    inner += '<tr style="color:#2a60b0;"><th>RelativeHumidity </th><td>' + properties.observation.RelativeHumidity + " %</td></tr>";
    inner += '<tr style="color:#2a60b0;"><th>VaporPressure </th><td>' + properties.observation.VaporPressure + " mm Hg</td></tr>";
    inner += '<tr style="color:#2a60b0;"><th>WindDirection </th><td>' + properties.observation.WindDirection + " Deg</td></tr>";
    inner += '<tr style="color:#2a60b0;"><th>WindSpeed </th><td>' + properties.observation.WindSpeed + " kph</td></tr>";

    monthlyDataFetchCallback = function (stationNumber) {
      var stationData = _this.getMonthlyRainfallForStationNumber(stationNumber);
      var launchParams = {
        stationData: stationData,
        scale: _this.rainfallScale
      };
      _this.launchAppWithValues("TMDMonthlyRainfall", launchParams, this.sage2_x + 600, this.sage2_y + 600);
    }
    inner += '<tr id="fetch-button"><td colspan="2"><button type="button" class="btn btn-primary" style="border:none;font-weight:bold;font-style:oblique;text-align:center;border-radius:5px;font-size:' + ui.titleBarHeight * 0.65 + 'px;" onclick="monthlyDataFetchCallback(' + properties.number + ')">View Monthly Rainfall</button></td></tr>';

    element.innerHTML = inner;
    element.style.fontSize = ui.titleBarHeight * 0.65 + "px";
    return element;
  },

  constructPopupContent: function (properties) {
    var _this = this;
    var element = document.createElement('table');
    var inner = "<tr><th>Name </th><td>" + properties.name + "</td></tr>";
    inner += "<tr><th>StationNumber </th><td>" + properties.stationId + "</td></tr>";
    inner += "<tr><th>Country </th><td>" + properties.country + "</td></tr>";
    inner += "<tr><th>River </th><td>" + properties.river + "</td></tr>";
    inner += "<tr><th>Latitude </th><td>" + properties.latitude + "</td></tr>";
    inner += "<tr><th>Longitude </th><td>" + properties.longitude + "</td></tr>";
    let rainfall = properties.rainFall24H;
    rainfall = rainfall !== null ? rainfall : 0;
    inner += '<tr style="color:#2a60b0;"><th>Rainfall24Hr </th><td>' + rainfall + " mm</td></tr>";
    inner += '<tr style="color:#2a60b0;"><th>WaterLevel </th><td>' + properties.waterLevel + " m</td></tr>";

    dataFetchCallback = function (stationNumber) {
      let url = `https://monitoring.mrcmekong.org/station/${stationNumber}`;
      _this.launchAppWithValues("Webview", { action: "address", clientInput: url }, _this.sage2_x + 600, _this.sage2_y + 600, "navigation");
    };

    inner += '<tr id="fetch-button"><td colspan="2"><button type="button" class="btn btn-primary" style="border:none;font-weight:bold;font-style:oblique;text-align:center;border-radius:5px;font-size:' + ui.titleBarHeight * 0.65 + 'px;" onclick="dataFetchCallback(\'' + properties.stationId + '\')">View Data</button></td></tr>';

    element.innerHTML = inner;
    element.style.fontSize = ui.titleBarHeight * 0.65 + "px";
    return element;

  },

  positionMap: function () {
    var bounds = this.geoLayers["MRCBoundary"].getBounds();
    this.map.fitBounds(bounds);
    this.redraw = true;
  },

  initializeTileLayers: function () {
    // initialize an object for storing different tile layers
    this.tileLayers = {};
    this.tileLayers['OpenStreetMap'] = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    this.tileLayers['OpenTopoMap'] = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    });

    this.tileLayers['StamenToner'] = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
      attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: 'abcd',
      minZoom: 0,
      maxZoom: 20,
      ext: 'png'
    });

    this.tileLayers['StamenTerrain'] = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}', {
      attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: 'abcd',
      minZoom: 0,
      maxZoom: 18,
      ext: 'png'
    });

    this.tileLayers['EsriWorldStreetMap'] = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
    });

    this.tileLayers['EsriWorldTopoMap'] = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
    });

    this.tileLayers['EsriWorldImagery'] = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    this.tileLayers['EsriWorldImagery'].addTo(this.map);
  },

  createLoader: function () {
    console.log('Creating Loader');
    this.loader = document.createElement('div'); ''
    this.loader.id = 'loader';
    var loaderMessage = document.createElement('h1');
    loaderMessage.innerText = "Loading Data...";
    this.loader.appendChild(loaderMessage);
    this.loaderSpinner = document.createElement('div');
    this.loaderSpinner.className = 'spinner-border';
    this.loaderSpinner.setAttribute('role', 'status');
    this.loaderSpinner.style.display = "inline-block";
    var loaderSpan = document.createElement('span');
    loaderSpan.className = 'sr-only';
    loaderSpan.innerText = "Loading...";
    this.loaderSpinner.appendChild(loaderSpan);
    this.loader.appendChild(this.loaderSpinner);
    this.loader.style = "padding-top: 50px; padding-left: 50px; padding-bottom: 50px; padding-right: 50px; background-color: #FFFFFF; opacity: 0.8; z-index: 1; position: absolute; text-align: center;";
    this.loader.style.top = (this.sage2_height / 2 - 100) + "px";
    this.loader.style.left = (this.sage2_width / 2 - 150) + "px";
    this.element.parentElement.appendChild(this.loader);
    this.redraw = true;
  },

  renderLoader: function (dataLoaded) {
    var visibility = dataLoaded ? 'hidden' : 'visible';
    this.loader.style.visibility = visibility;
  },

  repositionLoader: function () {
    var loader = document.getElementById('loader');
    loader.style.top = (this.sage2_height / 2 - 100) + "px";
    loader.style.left = (this.sage2_width / 2 - 150) + "px";
  },

  getMonthlyRainfallForStationNumber: function (number) {
    return this.rainfallData.find(function (stationDatum) {
      return stationDatum["WmoStationNumber"] == number;
    });
  },

  getUrls: function () {
    let tmdUrl = 'https://data.tmd.go.th/api/Weather3Hours/V2/';
    tmdUrl += '?uid=' + this.apiUID;
    tmdUrl += '&ukey=' + this.apiUKey;
    tmdUrl += '&format=json';

    let tmdRainfallUrl = 'https://data.tmd.go.th/api/ThailandMonthlyRainfall/v1/';
    tmdRainfallUrl += '?uid=' + this.apiUID;
    tmdRainfallUrl += '&ukey=' + this.apiUKey;
    tmdRainfallUrl += '&format=json';

    this.tmdUrl = [tmdUrl];
    this.tmdRainfallUrl = [tmdRainfallUrl];
    this.cdmUrl = ['http://www.cambodiameteo.com/obsmap/index/getdata?geojson=1'];
    this.geoJsonUrls = [
      "https://686-pub.s3-ap-southeast-1.amazonaws.com/lmb-boundary.geojson",
      "https://686-pub.s3-ap-southeast-1.amazonaws.com/Mekong_river.geojson"
    ];
    this.markerUrls = this.sensorIDs.map(function (id) {
      return "https://api.mrcmekong.org/api/v1/nrtm/station/" + id;
    });

  },

  addGeoLayersToMapIfNeeded: function () {
    let _this = this;
    this.geoLayers["MRCSensors"].addTo(this.map);
    this.geoLayers["TMD"] && this.geoLayers["TMD"]
      .bindPopup(function (layer) {
        return _this.createHTMLTableFromProperties(layer.feature.properties);
      }, {
          maxWidth: 1000
        })
      .addTo(this.map);
    this.geoLayers["CDM"]
      .bindPopup(function (layer) {
        return layer.feature.properties.popupContent;
      }, {
          maxWidth: 1000
        })
      .addTo(this.map);
    this.redraw = true;
  },

  initializeControlsIfNeeded: function () {
    let dataLoaded = this.isDataLoaded();
    if (dataLoaded && !this.layerControlsInitialized) {
      let mrcLayerGroup = L.layerGroup([
        this.geoLayers["MRCBoundary"],
        this.geoLayers["MRCMekong"],
        this.geoLayers["MRCSensors"]
      ]);
      mrcLayerGroup.addTo(this.map);
      this.addGeoLayersToMapIfNeeded();
      this.overlays = {
        "CDMWeatherSensors": this.geoLayers["CDM"],
        "MRCRiverSensors": mrcLayerGroup
      };
      if (this.geoLayers["TMD"]) {
        this.overlays["TMDWeatherSensors"] = this.geoLayers["TMD"];
      }
      L.control.layers(this.tileLayers, this.overlays).addTo(this.map);
      this.redraw = true;
      this.layerControlsInitialized = true;
      this.positionMap();
      this.bindMouseEventsToMarkers();
    }
  },

  bindMouseEventsToMarkers: function () {
    var _this = this;
    for (let marker of this.leafletMarkers) {
      let altString = marker.options.alt;
      let mouseOutColor = "";
      switch (altString) {
        case "TMDWeatherSensor":
          mouseOutColor = "#0078ff";
          break;
        case "CDMWeatherSensor":
          mouseOutColor = "#69b57b";
          break;
        case "MRCRiverSensor":
          mouseOutColor = "#e62615";
          break;
        default:
          mouseOutColor = "#ffffff";
          break;
      }

      marker.on("mouseover", function (ev) {
        let target = ev.originalEvent.target;
        target.style.fill = "#ffffff";
        target.classList.add("leaflet-marker-hover");
        _this.redraw = true;
      });
      marker.on("mouseout", function (ev) {
        let target = ev.originalEvent.target;
        target.style.fill = mouseOutColor;
        target.classList.remove("leaflet-marker-hover");
        _this.redraw = true;
      });
    }
  },

  isDataLoaded: function () {
    return this.mrcBoundaryLoaded && this.cdmDataLoaded &&
      (this.tmdDataLoaded || this.loader.innerHTML === "<h1>No TMD Data</h1>") && this.markerDataLoaded && this.monthlyRainfallDataLoaded && this.mrcMekongLoaded;
  },

  loadMRCSensorIDs: function () {
    this.sensorIDs = ["092600", "092980", "350101", "120101", "270502", "360106", "430106", "390102", "011201", "320107", "260101", "100102", "013901", "350102", "230113", "270101", "320101", "350105", "011901", "050106", "290113", "290102", "011903", "010501", "013801", "013402", "013101", "012001", "070103", "150101", "680103", "550102", "590101", "033401", "019905", "020106", "640102", "610101", "014901", "450101", "020102", "430102", "530101", "014501", "440102", "451305", "039803", "039801", "908001", "450701", "450502", "440201", "901503", "908002", "019804", "902601", "019803", "985203", "980601", "902602"];
  },

  bindStyleToPopupsAndControls: function () {
    var popupStyle = document.createElement('style');
    popupStyle.innerText = `.leaflet-popup-content { font-size: ${ui.titleBarHeight * 0.7}px; font-style: oblique; font-family: Verdana;}`;
    popupStyle.innerText += `.leaflet-control-layers-expanded {
      font-style: oblique; font-family: Verdana; font-size: ${ui.titleBarHeight * 0.6}px;
    }`;
    this.element.insertBefore(popupStyle, this.element.childNodes[0]);
  },

  writeDataToCache: function(source) {
    console.log('caching data...');
    let fileName = this.appDirectory;
    switch(source) {
      case "TMDSensors":
        fileName += 'data/tmdsens' + '.json';
        console.log(fileName);
        this.fs.writeFile(fileName, JSON.stringify(this.sensorData), function(err) {
          console.log(err);
        });
        break;
      case "TMDMonthlyRainfall":
        fileName += 'data/tmdrain' + '.json';
        this.fs.writeFile(fileName, JSON.stringify(this.rainfallData), function(err) {
          console.log(err);
        });
        break;
      case "CDM":
        fileName += 'data/cdm' + '.json';
        this.fs.writeFile(fileName, JSON.stringify(this.mapDataCollections["CDMData"]), function(err) {
          console.log(err);
        });
        break;
      case "MRCBoundary":
        fileName += 'data/mrcbound' + '.json';
        this.fs.writeFile(fileName, JSON.stringify(this.mrcBoundaryData), function(err) {
          console.log(err);
        });
        break;
      case "MRCMekong":
        fileName += 'data/mrcmekong' + '.json';
        this.fs.writeFile(fileName, JSON.stringify(this.mrcMekongData), function(err) {
          console.log(err);
        });
        break;
      case "MRCMarkers":
        fileName += 'data/mrcmarkers' + '.json';
        this.fs.writeFile(fileName, JSON.stringify(this.markerData), function(err) {
          console.log(err);
        });
        break;
    }
  },

  readDataFromCache: function(source) {
    console.log("Reading data from cache...");
    let fileName = this.appDirectory;
    var _this = this;
    switch(source) {
      case "TMDSensors":
        fileName += '/data/tmdsens.json';
        this.fs.readFile(fileName, {encoding: "utf-8"}, function(err, data) {
          if (err) {
            console.log(err);
          } else {
            console.log(data[0], data[1], data[2])
            _this.sensorData = JSON.parse(data);
            console.log("Loaded TMD data from cache");
            _this.generateGeoJSONFromSensorData();
            _this.makeTMDGeoJSON();
            _this.tmdDataLoaded = true;
          }
        });
        break;
      case "TMDMonthlyRainfall":
        fileName += '/data/tmdrain.json';
        this.fs.readFile(fileName, function(err, data) {
          if (err) {
            console.log(err);
          } else {
            _this.rainfallData = JSON.parse(data);
            console.log("Loaded TMD rainfall from cache");
            _this.monthlyRainfallDataLoaded = true;
            _this.calculateScaleForRainfall();
          }
        });
        break;
      case "CDM":
        fileName += '/data/cdm.json';
        this.fs.readFile(fileName, function(err, data) {
          if (err) {
            console.log(err);
          } else {
            _this.mapDataCollections["CDMData"] = JSON.parse(data);
            _this.cdmDataLoaded = true;
            console.log("Loaded CDM Data from cache");
            _this.makeCDMGeoJSON();
          }
        });
        break;
      case "MRCBoundary":
        fileName += '/data/mrcbound.json';
        this.fs.readFile(fileName, function(err, data) {
          if (err) {
            console.log(err);
          } else {
            _this.mrcBoundaryData = JSON.parse(data);
            _this.mrcBoundaryLoaded = true;
            console.log("Loaded MRC Boundary Path from cache");
            _this.geoLayers["MRCBoundary"] = L.geoJSON(responseData, {
              style: style
            });
          }
        });
        break;
      case "MRCMekong":
        fileName += '/data/mrcmekong.json';
        this.fs.readFile(fileName, function(err, data) {
          if (err) {
            console.log(err);
          } else {
            console.log("Loaded MRC Mekong Path from cache");
            _this.mrcMekongData = JSON.parse(data);
            _this.mrcMekongLoaded = true;
            _this.geoLayers["MRCMekong"] = L.geoJSON(responseData, {
              style: style
            });
          }
        });
        break;
      case "MRCMarkers":
        fileName += 'data/mrcmarkers' + '.json';
        this.fs.readFile(fileName, function(err, data) {
          if (err) {
            console.log(err);
          } else {
            console.log("Loaded MRC Marker Data from cache");
            _this.markerData = JSON.parse(data);
            _this.markerDataLoaded = true;
            _this.makeSensorMarkersGeoJSON();
          }
        });
        break;
    }
  },

  getApplicationDirectoryFromFS: function() {
    let appDirectory = this.os.homedir();

    switch(this.os.platform()) {
      case 'darwin':
        appDirectory += '/Documents/SAGE2_Media/apps/LandSAGE/';
        break;
      case 'win32':
        appDirectory += "\\Documents\\SAGE2_Media\\apps\\LandSAGE\\";
        break;
      case 'linux':
        appDirectory += "/Documents/SAGE2_Media/apps/LandSAGE/";
        break;
    }
    this.appDirectory = appDirectory;
  },

  bindPopupOpenEvent: function() {
    let _this = this;
    this.map.on('popupopen', function() {
      console.log("popup opened");
      let button = document.querySelector('a.leaflet-popup-close-button');
      console.log(button);
      button.style.fontSize = (ui.titleBarHeight * 0.7) + "px";
      button.style.color = "white";
      button.style.backgroundColor = "red";
      button.style.borderRadius = "10px";
      button.style.height = (ui.titleBarHeight * 0.5) + "px";
      button.style.width = (ui.titleBarHeight * 0.5) + "px";
      setTimeout(() => _this.ensurePopupCloseStyleBinding(), 250);
    });
  },

  ensurePopupCloseStyleBinding: function() {
    let button = document.querySelector('a.leaflet-popup-close-button');
      console.log(button);
      button.style.fontSize = (ui.titleBarHeight * 0.7) + "px";
      button.style.color = "white";
      button.style.backgroundColor = "red";
      button.style.borderRadius = "10px";
      button.style.height = (ui.titleBarHeight * 0.5) + "px";
      button.style.width = (ui.titleBarHeight * 0.5) + "px";
  }

});