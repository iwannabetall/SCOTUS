//data
var scdata = scotus;

//get max and min freq to scale colors --
// should you scale ot max per year or max overall?
var max_freq = d3.max(scdata, function(d) { return d.freq; });
var min_freq = d3.min(scdata, function(d) { return d.freq; });

//color is a function to scale the color strength
var color = d3.scaleLinear().range(["brown", "steelblue"])
				.domain([min_freq, max_freq]);

 // var x = d3.scaleLinear()
 //            .domain([min_date, max_date])
 //            .range([0,800]);

//select the data 
var scdata_1y = scdata.filter(function(d) {return d.J_id == "78_79";});
console.log(color(scdata_1y[1].freq));


var svg = d3.select("#vis_canvas").append("svg");

var boxes = svg.selectAll(".rect").data(scdata_1y);
// svg.selectAll(".wait").data(filtered_meeting_data, function(d) { return d.id;});
console.log(boxes);
    boxes.enter()
		.append("rect")
	    .attr("class", "rect")
	    .attr("width", function(d){ return d.freq; })
	    .attr("height", 100)
	    .attr("x", 100)
	    .attr("y", 50)
	    .attr("fill", "red");
    console.log(boxes);


// boxes.exit().remove();


// var samevote = svg.selectAll(".vote").data(scdata, function(d){return d.J1;});
// console.log(samevote)
// samevote.enter().append("rect")