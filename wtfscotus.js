var initialCategory = "Criminal Procedure";
var initialYear = 2015; 

//data
var justicedata = justicedata;
var dataset_agg = scotus;
// var dataset = scotus;
var dataset_byissue = scotus_byissue;

function wipePage() {
	var plot = document.getElementById("mainChart")
	if (plot.hasChildNodes()){
		plot.removeChild(plot.ChildNodes[0])
	}
}

function getChecked(){
	
	var selectedCategory = document.getElementById("filterSelect").value;
	var fromyear = document.getElementsByClassName("irs-from");
	fromyear = parseInt(fromyear[0].innerHTML);

	var toyear = document.getElementsByClassName("irs-to");
	toyear = parseInt(toyear[0].innerHTML);
	
	// var selectedYear = []
	// var yearboxes = document.getElementsByClassName("Yearbox");
	
	// for (i=0; i < yearboxes.length; i++){
	// 	if (yearboxes[i].checked){
	// 		selectedYear.push(parseInt(yearboxes[i].value))	;
	// 	}		
	// }

	// return { year: selectedYear, category: selectedCategory};
	// return selectedCategory;
	return { startyear: fromyear, endyear: toyear, category: selectedCategory};
}


function processData(startyear, endyear) {
	// wipePage();
	var counter = 0
	var checked = getChecked();
	// var ChosenYear = checked.year;
	var ChosenCategory = checked.category;
	var startyear = checked.startyear;
	var endyear = checked.endyear;

	console.log(startyear);
	console.log(endyear);
	//filter data for years selected
	// if (startyear == 0){
	// 	var checked = getChecked();
	// 	console.log(checked.startyear);
	// }
	//pick data to use depending on chosen category 
	if (ChosenCategory == "All"){
		var dataset = dataset_agg;
	}
	else if (ChosenCategory != "All") {
		var dataset = dataset_byissue;	
	}

	var scdata_year = dataset.filter(function(d) { 
		//if match with year, pull out the entire data 
		// if (ChosenYear.indexOf(d.Year) >= 0) {
		// 	return d;
		// }
		if ((d.Year >= startyear) && (d.Year <= endyear))
		{				
			return d;
		}

	});
	// console.log(scdata_year);
		//filter data if don't select all, aggregate if do 
	if (ChosenCategory != "All"){
		scdata_year = scdata_year.filter(function(d) {
			//return all data matching that category
			//for loop for if decide to let ppl select more than one category...doesnt make sense tho
			// for (i = 0; i < ChosenCategory.length; i++){ 
				return d.Topic == ChosenCategory;
			// }
		})
	} //else if (ChosenCategory == "All") {
		// scdata_year = d3.nest()
		// 	//get one of each year for every Justice pairing, need to calculate total rate for period of years 
		// 		.key(function(d) { return d.J_id;})
		// 		// .key(function(d) { return d.Year;})
		// // 		.rollup(function(Jpaired) {
		// // //Jpaired = data is aggregated by J_id.  Jpaired is an array of arrays, where each nested array contains 
		// // //all issue level data for each J_id -- highest level of array is J_id, ie the key w/an array of topic level values 
		// // //  we just need one of each pair, so get first entry in each list of array values
		// // //number of arrays of obj = # of J_id.  Num obj in each array = 15, ie # of case topics 
		// // 			// console.log(Jpaired[0]);
		// // 			return Jpaired[0];
		// // 		})
		// 		.entries(scdata_year);
	//}
	console.log(scdata_year);
	// if (ChosenCategory == "All"){
	// 	newdatabyyear = []
	// 	//reformat data to match if not all 
	// 	for (i = 0; i < scdata_year.length; i++){		
	// 		newdatabyyear.push(scdata_year[i].value)
	// 	}
	// 	scdata_year = newdatabyyear;
	// }

	// console.log(scdata_year);
	initVis(scdata_year, ChosenCategory)
}

function initVis(databyyear, ChosenCategory){
	console.log(databyyear)
	var databy_Jpair = d3.nest()
		//get one of each year for every Justice pairing, need to calculate total rate for period of years 
		.key(function(d) { return d.J_id;})				
		.rollup(function(Jpaired,i) {
			// console.log(Jpaired)
			//Jpaired = row of data with same J_id
			//can use the first obj in array b/c it should be all objects of the same J_id
			var J1name = Jpaired[0].J1name;
			var J2name = Jpaired[0].J2name;
			var ColorValue = Jpaired[0].ColorValue;			
			var totalvotes = d3.sum(Jpaired, function (g) {
			return g.Total_Freq; 
		})
			var totalopps = d3.sum(Jpaired, function (g) {
				// console.log(g.Total_Freq);
			return g.Case_Opps; 
		})
			return {J1name: J1name, J2name: J2name, Case_Count: totalopps, Total_Votes: totalvotes, ColorValue: ColorValue};
			})
		.entries(databyyear); 
		console.log(databy_Jpair); 

	 // databyyear = d3.nest()
		// 	//get one of each year for every Justice pairing, need to calculate total rate for period of years 
		// 		.key(function(d) { return d.J_id;})				
		// 		.rollup(function(Jpaired) {
		// 			// console.log(Jpaired)
		// 			var totalfreq = d3.sum(Jpaired, function (g) {
		// 				// console.log(g.Total_Freq);
		// 			return g.Total_Freq; 
		// 		})
		// 			// console.log(totalfreq);
		// //Jpaired = data is aggregated by J_id.  Jpaired is an array of arrays, where each nested array contains 
		// //all issue level data for each J_id -- highest level of array is J_id, ie the key w/an array of topic level values 
		// //  we just need one of each pair, so get first entry in each list of array values
		// //number of arrays of obj = # of J_id.  Num obj in each array = 15, ie # of case topics 
		// 			// console.log(Jpaired[0]);
		// 			return totalfreq;
		// 		})
		// 		.entries(databyyear);

	// console.log(databyyear);

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
	// console.log(J_unique.length);
	// console.log(J_unique)

	//Width and height
	var w = 1000;
	var h = 800;
	var barPadding = 5;
	var cellsize = 720/J_unique.length;

	// console.log(cellsize);

	// console.log(databyyear)
	// J1text.exit().remove();
	// J2text.exit().remove();	
	//Create SVG element
	var svg = d3.select("#mainChart")
		.append("svg")
		.attr("width", w)
		.attr("height", h);

	var tip = d3.tip()
		.attr("class", "d3-tip")
		.html(function(d,i) { 
			var tooltip_y_coor = Math.min(J_unique.indexOf(d.value.J1name), J_unique.indexOf(d.value.J2name));
			var tooltip_x_coor = Math.max(J_unique.indexOf(d.value.J1name), J_unique.indexOf(d.value.J2name));
			var tooltiptext = J_unique[tooltip_x_coor] + ", " + J_unique[tooltip_y_coor]		
			return tooltiptext;});
		
	svg.call(tip);
	// console.log(tip);
	// svg.exit().remove();
	// console.log(databyyear)  //databyyear is array of objects rep every justice pairing in every year

	svg.selectAll("rect")
	   .data(databy_Jpair)
	   .enter()
	   .append("rect")
	   .attr("class", "colorbox")
	   .attr("id", function (d,i) { 
	  	// return d.J1name + "_" + d.J2name;  does not work b/c order of data is random
	  	//must use J_unique to give id names
	  	return J_unique[J_unique.indexOf(d.value.J1name)] + "_" + J_unique[J_unique.indexOf(d.value.J1name)];	  
		})
	   .attr("x", function(d, i) {
	   		//want lower triangular --switch max and min if want upper triangular
	   		//get index of unique list (ie x or y loc) of justices of each justice to know where to draw
	   		// console.log(d)
	   		var x_coor = Math.min(J_unique.indexOf(d.value.J1name), J_unique.indexOf(d.value.J2name));
	   		return cellsize * (1 + x_coor);
	   })
	   .attr("y",  function(d, i) {   
	   		var y_coor = Math.max(J_unique.indexOf(d.value.J1name), J_unique.indexOf(d.value.J2name));
	   		return cellsize * (1 + y_coor);
	   	})
	   .attr("width", cellsize)
	   .attr("height", cellsize)	   
	   .attr('fill', function(d,i) { 
	   // if (ChosenCategory == "All"){	
	   // console.log(d.value.Case_Count)		
	   		if (d.value.ColorValue == 1){
	   			if (d.value.Case_Count > 0){
	   				return Dcolor(d.value.Total_Votes/d.value.Case_Count);	
	   			}
	   			else {
	   				return 0;
	   			}
		   } else if (d.value.ColorValue == -1){
		   	// console.log(d)
		   		if (d.value.Case_Count > 0){
		   			console.log(d.value.Total_Votes/d.value.Case_Count)
	   				return Rcolor(d.value.Total_Votes/d.value.Case_Count);	
	   			}
	   			else{
	   				return 0;
	   			}
		   } else {
		   	// console.log(d)
		   		if (d.value.Case_Count > 0){
	   				return Pcolor(d.value.Total_Votes/d.value.Case_Count);	
	   			}
	   			else{
	   				return 0;
	   			}
		   } 
	   // }
	   // else {
	   // 		if (d.ColorValue == 1){
	   // 			if (d.Opps_By_Issue > 0){
	   // 				return Dcolor(d.Agree_Freq_By_Issue/d.Opps_By_Issue);	
	   // 			}
	   // 			else {
	   // 				return 0;
	   // 			}
		  //  } else if (d.ColorValue == -1){
		  //  		if (d.Opps_By_Issue > 0){
	   // 				return Rcolor(d.Agree_Freq_By_Issue/d.Opps_By_Issue);	
	   // 			}
	   // 			else {
	   // 				return 0;
	   // 			}
		  //  } else {
		  //  		if (d.Opps_By_Issue > 0){
	   // 				return Pcolor(d.Agree_Freq_By_Issue/d.Opps_By_Issue);	
	   // 			}
	   // 			else {
	   // 				return 0;
	   // 			}
		  //  } 
	   // }
	   
	})
		.on("mouseover", function(d){tip.show(d)})
		.on("mouseout", function(d){tip.hide(d);});
	
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
		.attr("class", "judgelabel")
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
		.attr("class", "judgelabel")
		.attr("x", -20)
		.attr("y", function(d, i) {  return 80 + cellsize * (1 + i) - (cellsize * 0.5 );  })
		.style("text-anchor", "end")
		.attr("transform", "rotate(-90)")
		.text(function(d){ return d});

	// svg.exit().remove();

}
