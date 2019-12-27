var TMDMonthlyRainfall = SAGE2_App.extend({
  init: function(data) {
    this.SAGE2Init('div', data);
    this.resizeEvents = "continuous";
    this.passSAGE2PointerAsMouseEvents = true;
    this.stationData = data.customLaunchParams.stationData;
    this.scale = data.customLaunchParams.scale;
    console.log(this.stationData);
    this.produceTraceFromData();
    this.generateLayout();
    this.redraw = true;
  },

  load: function(date) {

  },

  draw: function(date) {
    if (this.redraw) {
      this.redraw = false;
      this.layout.width = this.sage2_width;
      this.layout.height = this.sage2_height;
      Plotly.newPlot(this.element, [this.trace], this.layout);
    }
  },

  resize: function(date) {
    this.redraw = true;
    this.refresh(date); //redraw after resize
  },

  event: function(type, position, user, data, date) {
      
      this.refresh(date);
  },

  move: function(date) {
      
      this.refresh(date);
  },

  quit: function() {
      this.log("Done");
  },

  produceTraceFromData: function() {

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

    var date = new Date(Date.parse('January, ' + this.stationData['Year']));

    var dates = [];
    dates.push(date.getFullYear() + '-0' + (date.getMonth()+1));

    for (let i = 1; i <= 11; i++) {
      var nextDate = new Date(Date.parse(date.toDateString()));
      nextDate.setMonth(i);
      dates.push(nextDate.getFullYear() + '-0' + (nextDate.getMonth()+1));
    }

    var stationMonthlyReadings = [];

    for (let key of keys) {
      stationMonthlyReadings.push(this.stationData["MonthlyRainfall"][key]);
    }

    this.trace = {
      x: dates,
      y: stationMonthlyReadings,
      type: 'lines',
    };
    console.log(this.trace);
  },

  generateLayout: function() {
    this.layout = {
      font: {
        size: ui.titleBarHeight * 0.4
      },
      title: {
        text: "Monthly Rainfall for " + this.stationData["StationNameEnglish"],
        font: {
          size: ui.titleBarHeight * 0.4
        }
      },
      width: 600,
      height: 600,
      yaxis: {
        title: {
          text: 'Rainfall (mm)',
          font: {
            size: ui.titleBarHeight * 0.4,
          }
        },
        range: this.scale 
      },
      xaxis: {
        title: {
          text: 'Month', 
          font: {
            size: ui.titleBarHeight * 0.4,
          }
        }  
      }
    }
  },

});