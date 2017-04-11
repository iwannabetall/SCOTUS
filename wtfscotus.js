var initialCategory = "Criminal Procedure";
var initialYear = 2015; 

//data
var justicedata = justicedata;
var aggdataset = scotus;
var dataset = scotus_byissue;

function getChecked(){
	
	var selectedCategory = document.getElementById("filterSelect").value;
	var selectedYear = []
	var yearboxes = document.getElementsByClassName("Yearbox");
	
	for (i=0; i < yearboxes.length; i++){
		if (yearboxes[i].checked){
			selectedYear.push(parseInt(yearboxes[i].value))	;
		}		
	}

	return { year: selectedYear, category: selectedCategory};

}


function processData() {

	var counter = 0
	var checked = getChecked();
	var ChosenYear = checked.year;
	var ChosenCategory = checked.category;
	//filter data for years selected

	var scdata_year = dataset.filter(function(d) { 
		//if match with year, pull out the entire data 
		if (ChosenYear.indexOf(d.Year) >= 0) {
			return d;
		}

	});

		//filter data if don't select all, aggregate if do 
	if (ChosenCategory != "All"){
		scdata_year = scdata_year.filter(function(d) {
			//for loop for if decide to let ppl select more than one category...doesnt make sense tho
			// for (i = 0; i < ChosenCategory.length; i++){ 
				return d.Topic == ChosenCategory;
			// }
		})
	} else if (ChosenCategory == "All") {
		scdata_year = d3.nest()
				.key(function(d) { return d.J_id })
				.rollup(function(Jpaired) {
		//Jpaired = data is aggregated by J_id.  Jpaired is an array of arrays, where each nested array contains 
		//all issue level data for each J_id -- highest level of array is J_id, ie the key w/an array of topic level values 
		//  we just need one of each pair, so get first entry in each list of array values
		//number of arrays of obj = # of J_id.  Num obj in each array = 15, ie # of case topics 
					// console.log(Jpaired[0]);
					return Jpaired[0];
				})
				.entries(scdata_year);
	}
	
	if (ChosenCategory == "All"){
		newdatabyyear = []
		//reformat data to match if not all 
		for (i = 0; i < scdata_year.length; i++){		
			newdatabyyear.push(scdata_year[i].value)
		}
		scdata_year = newdatabyyear;
	}

	// console.log(scdata_year);
	initVis(scdata_year, ChosenCategory)
}

function initVis(databyyear, ChosenCategory){
	//WHAT SHOULD SCALE BE?!
	var max_freq = d3.max(databyyear, function(d) { return d.freq; });
	var min_freq = d3.min(databyyear, function(d) { return d.freq; });
	//color schemes depending on if R-R, D-D, R-D etc
	var Rcolor = d3.scaleLinear().range(["white", "red"]).domain([0, 1]);
	var Dcolor = d3.scaleLinear().range(["white", "blue"]).domain([0, 1]);
	var Pcolor = d3.scaleLinear().range(["white", "purple"]).domain([0, 1]);
	

	//get unique list of justices for axes
	var J2_list = []		
	var J1_list = []
	for (i = 0; i < databyyear.length; i++){
		J1_list.push(databyyear[i].J1name)  //name of all justices
		J2_list.push(databyyear[i].J2name)  //name of all justices
	}
	J_list = J1_list.concat(J2_list);  // list of all justices
	
	var J_unique = J_list.filter(function(itm, i, J_list){
		return i == J_list.indexOf(itm);
	});
	J_unique.sort()  //sort list 
	// console.log(J_unique);

	//Width and height
	var w = 800;
	var h = 800;
	var barPadding = 5;
	var cellsize = 60;

	// console.log(databyyear)
	// J1text.exit().remove();
	// J2text.exit().remove();	
	//Create SVG element
	var svg = d3.select("#mainChart")
		.append("svg")
		.attr("width", w)
		.attr("height", h);

	// svg.exit().remove();

	svg.selectAll("rect")
	   .data(databyyear)
	   .enter()
	   .append("rect")
	   .attr("x", function(d, i) {
	   		//want lower triangular --switch max and min if want upper triangular
	   		var x_coor = Math.min(J_unique.indexOf(databyyear[i].J1name), J_unique.indexOf(databyyear[i].J2name));
	   		return cellsize * (1 + x_coor);
	   })
	   .attr("y",  function(d, i) {   
	   		var y_coor = Math.max(J_unique.indexOf(databyyear[i].J1name), J_unique.indexOf(databyyear[i].J2name));
	   		return cellsize * (1 + y_coor);
	   	})
	   .attr("width", cellsize)
	   .attr("height", cellsize)
	   .attr('fill', function(d) { 
	   if (ChosenCategory == "All"){
	   		if (d.ColorValue == 1){
	   			if (d.Case_Opps > 0){
	   				return Dcolor(d.Total_Freq/d.Case_Opps);	
	   			}
	   			else{
	   				return 0;
	   			}
		   } else if (d.ColorValue == -1){
		   		if (d.Case_Opps > 0){
	   				return Rcolor(d.Total_Freq/d.Case_Opps);	
	   			}
	   			else{
	   				return 0;
	   			}
		   } else {
		   		if (d.Case_Opps > 0){
	   				return Pcolor(d.Total_Freq/d.Case_Opps);	
	   			}
	   			else{
	   				return 0;
	   			}
		   } 
	   }
	   else {
	   		if (d.ColorValue == 1){
	   			if (d.Opps_By_Issue > 0){
	   				return Dcolor(d.Agree_Freq_By_Issue/d.Opps_By_Issue);	
	   			}
	   			else {
	   				return 0;
	   			}
		   } else if (d.ColorValue == -1){
		   		if (d.Opps_By_Issue > 0){
	   				return Rcolor(d.Agree_Freq_By_Issue/d.Opps_By_Issue);	
	   			}
	   			else {
	   				return 0;
	   			}
		   } else {
		   		if (d.Opps_By_Issue > 0){
	   				return Pcolor(d.Agree_Freq_By_Issue/d.Opps_By_Issue);	
	   			}
	   			else {
	   				return 0;
	   			}
		   } 
	   }
	   
	});		
	
	//add label of prez who appointed them 
	var diag = svg.append("g").selectAll("text")
		.data(J_unique)
		.enter()
		.append("text");

	diag
		.attr("x", function(d, i) {
	   		//want lower triangular --switch max and min if want upper triangular
	   		return 80 + cellsize * (1 + i) - (cellsize * 0.5 ); 
	   })
	   .attr("y",  function(d, i) {   
	   		return 80 + cellsize * (1 + i) - (cellsize * 0.5 ); 
	   	})
	   .text(function(d) { 
	   		return d
		})

	// justice labels
	var J1text = svg.append("g").selectAll("text")
		.data(J_unique)
		.enter()
		.append("text");

	J1text
		.attr("x", 20 )
		.attr("y", function(d, i) { return 80 + cellsize * (1 + i) - (cellsize * 0.5 );  })
		.text(function(d){ return d});

	// J1text.data(J_unique).exit().remove();

	var J2text = svg.append("g")
		.selectAll("text")
			.data(J_unique)
			.enter()
			.append("text");
//wtf is going on with the x and y being swapped -- b/c i transformed? 
	J2text
		.attr("x", -20)
		.attr("y", function(d, i) {  return 80 + cellsize * (1 + i) - (cellsize * 0.5 );  })
		.style("text-anchor", "end")
		.attr("transform", "rotate(-90)")
		.text(function(d){ return d});

	svg.exit().remove();

}
