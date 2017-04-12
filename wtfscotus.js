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

	//pick data to use depending on chosen category 
	if (ChosenCategory == "All"){
		var dataset = dataset_agg;
	}
	else if (ChosenCategory != "All") {
		var dataset = dataset_byissue;	
	}

	var scdata_year = dataset.filter(function(d) { 
		//if match with year, pull out the entire data 		
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
	} 

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

	//get index of prez that appointed justice and their party and make into object with list of justices
	J_prez_index = []
	J_party = []  //president's party 
	J_prez = []
	J_name = [] //sanity check passed -- names match J_unique
	for (i = 0; i < J_unique.length; i++){
		pos = justicedata.map(function(d) { return d.justiceName; }).indexOf(J_unique[i]);	
		J_prez.push(justicedata[pos].President)
		J_name.push(justicedata[pos].justiceName)
		J_party.push(justicedata[pos].PresidentParty)
		// J_prez_index.push(pos)
	}
	J_unique_prez = d3.zip(J_unique, J_prez)   
	J_unique_party = d3.zip(J_unique, J_party)
	
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
	   		//color the blocks based on how they voted with a diff judge 
	   		//get rate of agreement 
	   		if (d.value.Case_Count > 0){
	   			var agree_rate = d.value.Total_Votes/d.value.Case_Count;
	   		} else {
	   			var agree_rate = 0;
	   		}
	   		//get color depending on if R-R, D-D, R-D
	   		if (d.value.ColorValue == 1)
	   		{//D-D
	   			return Dcolor(agree_rate);
	   		} else if (d.value.ColorValue == -1)
	   		{ //R-R
	   			return Rcolor(agree_rate);
	   		}
	   		else 
	   		{   //mix R-D		   	
   				return Pcolor(agree_rate);
   			}
   		})
		.on("mouseover", function(d){tip.show(d)})
		.on("mouseout", function(d){tip.hide(d);});
	
	//add label of prez who appointed them 
	var diag = svg.append("g").selectAll("text")
		.data(J_unique_prez)
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
	   		return d[1]
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
