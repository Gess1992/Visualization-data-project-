var margin = {
  left : 120,
  right: 10,
  top: 10,
  bottom: 120
};

var width = 1500 - margin.left - margin.right;
var height = 600 - margin.top - margin. bottom;

var labelFontSize = 16;

var g = d3.select("#chart-area")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

// X scale
var x = d3.scaleBand()
  .range([0, width]);

// Array from 1 to 12
var monthsArr = d3.range(1, 13, 1);

// Array of month names generated by iife
var monthNames = (function(){
  var arr = [];
  for (var i = 1; i < monthsArr.length + 1; i++){
    var dateObj = d3.timeParse("%m")(i);
    var monthName = d3.timeFormat("%B")(dateObj);
    arr.push(monthName);
  }
  return arr;
})();

// X-axis
var xAxisGroup = g.append("g")
  // Id for fcc tests
  .attr("id", "x-axis")
  .attr("transform", "translate(0, " + height + ")");

// The X and Y axes don't need labels "Month" and "Years"
// because January and 1870 are obviously a month and a year.

// Y scale
var y = d3.scaleBand()
  .domain(monthsArr)
  .range([0, height]);

// Y-axis
var yAxisGroup = g.append("g")
  // Id for fcc tests
  .attr("id", "y-axis");

// Y-axis call
var yAxisCall = d3.axisLeft(y)
  // Make Y-Axis ticks be month names
  .tickFormat(function(d){
    return monthNames[d-1];
  });
yAxisGroup.call(yAxisCall);

// Color scale
var colorScale = d3.scaleSequential()
  .interpolator(d3.interpolateCool);

var tooltip = d3.select("#chart-area")
  .append("div")
  .attr("class", "tooltip")
  .attr("id", "tooltip")
  .style("opacity", 0);

//
//
// ***LEGEND***
//
//

var legendWidth = 300;
var legendHeight = 20;

// Colors for legend
var legendColorScale = d3.scaleSequential()
  .domain([1, legendWidth])
  .interpolator(d3.interpolateCool);

// Horizontal spacing for legend
var legendWidthScale = d3.scaleBand()
  .range([0, legendWidth]);

// Append legend as group under chart
// Halfway down the margin.bottom
var legend = g.append("g")
// id for fcc tests
 .attr("id", "legend")
 .attr("transform", "translate(0, " + (height + margin.bottom/2) + ")");

// Legend Axis,
// to mark the temperatures in the legend
var legendGroup = legend.append("g")
  .attr("transform", "translate(0, 20)");

var legendLabel = legend.append("text")
  .attr("transform", "translate(0, -5)")
  .text("Base temperature in ˚C");

//
//
// ***GET data***
//
//
d3.json("https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json").then(function(data){

  var baseTemp = data.baseTemperature;

  $("#base-temp").html(baseTemp);

  var dataset = data.monthlyVariance;
  console.log(dataset);

  // Array of each year in the dataset
  var yearsArr = d3.range(d3.min(dataset, function(d){
    return d.year;
  }), d3.max(dataset, function(d){
    // It's "+ 1" because d3.range doesn't
    // include the last number in the range
    return d.year + 1;
  }), 1);

  // Calculate 1st round decade in dataset
  var earliestFullDecade = (function(){
    var earliestYear = yearsArr[0];
    return Math.ceil(earliestYear/10) * 10;
  })();

  // Array of decades in dataset
  var decadesArr = d3.range(earliestFullDecade, yearsArr[yearsArr.length-1] , 10);

  // Set X-Axis domain based on years
  x.domain(yearsArr);

  // X-Axis call
  var xAxisCall = d3.axisBottom(x)
    // Make ticks every 10 years starting on first full decade
    .tickValues(decadesArr);
  xAxisGroup.call(xAxisCall);

  // Set colors based on temperatures
  colorScale.domain([d3.min(dataset, function(d){
    return d.variance;
  }), d3.max(dataset, function(d){
    return d.variance;
  })]);

  // JOIN data to rectangles
  var rects = g.selectAll("rect")
    .data(dataset);

  // ADD new rectangles to graph
  rects.enter()
    .append("rect")
    .attr("class", "cell")
    // Three data attr's for fcc tests
    .attr("data-month", function(d){
      return d.month - 1;
    })
    .attr("data-year", function(d){
      return d.year;
    })
    .attr("data-temp", function(d){
      return d.variance;
    })
    .attr("x", function(d){
      return x(d.year);
    })
    .attr("y", function(d){
      return y(d.month);
    })
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("fill", function(d){
      return colorScale(d.variance);
    })
    .attr("stroke", "black")
    .attr("stroke-width", 0)
    // Mouseover a rectangle
    .on("mouseover", function(d){

      // Add border
      var rect = d3.select(this);
      rect.attr("stroke-width", 1);

      // Distance of tooltip from pointer
      var pxFromEvent = 28;

      var b = "<span style='font-weight: bold'>";
      var endLine = "</span><br/>";

      // Show tooltip
      tooltip
        .style("left", d3.event.pageX + pxFromEvent + "px")
        .style("top", (d3.event.pageY - pxFromEvent) + "px")
        // data-year property to pass fcc tests
        .attr("data-year", function(){
          return d.year;
        })
        .html(function(){
          var text = b + monthNames[d.month - 1] + " ";
          text += d.year + endLine;
          text += "Temperature: ";
          text += b + d3.format(".2f")(d.variance + baseTemp) + "˚C" + endLine;
          text += "Temperature variance: ";
          text += b + d3.format("+.2f")(d.variance) + "˚C" + endLine;
          return text;
        })
        .style("opacity", 0.9);
    })
    // Hide tooltip and border
    .on("mouseout", function(d){
      // Border
      var rect = d3.select(this);
      rect.attr("stroke-width", 0);
      // Tooltip
      tooltip.style("opacity", 0);
    });

//
//
//
// ***Create legend based on temperatures from data***
//
//
//

    // ADD rects to legend AFTER adding rects to chart
    for (var j = 0; j < legendWidth; j++){
      // Create one rectangle of color for each pixel in legend
      var legendColor = legend.append("rect")
        // Each rectangle is one pixel more to the right.
        .attr("transform", "translate(" + j + ", 0)")
        // Rectangle width, should equal increment value of this loop, 1
        .attr("width", 1)
        // Rectangle height, should equal half of legend's height
        .attr("height", 20)
        // Color based on d3-chromatic
        .attr("fill", function(){
          return legendColorScale(j);
        });
     }

    // Minimum temperature
    var minTemp = d3.min(dataset, function(d){
      return d.variance;
    });
    // Maximum temperature
    var maxTemp = d3.max(dataset, function(d){
      return d.variance;
    });
    // Difference between min and max temperatures
    var tempRange = maxTemp - minTemp;
    // Array of temperatures between min and max
    var tempArray = d3.range(minTemp, maxTemp, tempRange/10 );
    // Add base temperature
    tempArray = tempArray.map(function(d){
      return d3.format(".1f")(d + baseTemp);
    });

    legendWidthScale
      .domain(tempArray);

    // Legend axis call
    var legendAxisCall = d3.axisBottom(legendWidthScale);
    legendGroup.call(legendAxisCall);

//
//
//
// ***END of json.then()***
//
//
//
})
.catch(function(error){
  console.log("Failed to load data.");
});
