//data
var justicedata = justicedata;
var dataset_agg = scotus;
var data_civil = civil_agg;  //aggregate of 5 topics: civil rights, criminal procedure, privacy, first amendment, and due process
var data_econ = scotus_econ;  //agg of economic/legal procedures
var dataset_byissue = scotus_byissue;
// var dataset_byissue = civil;
// var dataset_byissue = econ;

function wipePage() {
	var plot = document.getElementById("mainChart")	
	if (plot.hasChildNodes()){
		plot.removeChild(plot.childNodes[0])
	}
}

//find how much to shift the label/axis down by based on max length of justice name
function getDownShiftAmt(elements){
	var el = document.getElementById("ruler")
	var max_width = 0;	
	for (i = 0; i < elements.length; i++){
		
		el.innerHTML = elements[i];		
		// console.log(el.getPropertyValue('font-size'))
		var current_width = $("#ruler").width()  //width is a jquery function, must ref'n with jquery? 

		if (current_width > max_width){
			max_width = current_width;
		} 
	}

	return max_width;
}

function getChecked(){
	
	var selectedCategory = document.getElementById("filterSelect").value;
	
	var fromyear = document.getElementsByClassName("irs-from");		
	fromyear = parseInt(fromyear[0].innerHTML);		
 	
 	console.log(fromyear)
 	var toyear = document.getElementsByClassName("irs-to");		
 	toyear = parseInt(toyear[0].innerHTML);

	return {startyear: fromyear, endyear: toyear, category: selectedCategory};

}

function processData(startyear, endyear) {
	
	if (!startyear){		
		var checked = getChecked();
		var startyear = checked.startyear;
		var endyear = checked.endyear;
		var ChosenCategory = checked.category;	
	}
	
	var ChosenCategory = document.getElementById("filterSelect").value;

	//pick data to use depending on chosen category 
	if (ChosenCategory == "All"){
		var dataset = dataset_agg;
	}
	else if (ChosenCategory == 'Rights'){
		var dataset = data_civil;
	}
	else if (ChosenCategory == 'Econ') {
		var dataset = data_econ;
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
	//filter data if don't select all or an aggregate, aggregate
	if (['All', 'Rights', 'Econ'].indexOf(ChosenCategory) < 0){
		scdata_year = scdata_year.filter(function(d) {
			//return all data matching that category
			//for loop for if decide to let ppl select more than one category...doesnt make sense tho
			// for (i = 0; i < ChosenCategory.length; i++){ 
				return d.Topic == ChosenCategory;
			// }
		})
	} 

	initVis(scdata_year, ChosenCategory)
	// console.log(scdata_year)
}

function initVis(databyyear, ChosenCategory){
		
	var databy_Jpair = d3.nest()
		//get one of each year for every Justice pairing, need to calculate total rate for period of years 
		.key(function(d) { return d.J_id;})				
		.rollup(function(Jpaired,i) {			
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

		// console.log(databy_Jpair)	
	// //WHAT SHOULD SCALE BE?!
	// var max_freq = d3.max(databyyear, function(d) { return d.freq; });
	// var min_freq = d3.min(databyyear, function(d) { return d.freq; });
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
	//get the corresponding segal cover scores, sort justice list based on SC score	
	
	J_SCscore = []   //Segal Cover Score 
	for (i = 0; i < J_unique.length; i++){
		//get index of justice data matching J_unique
		pos = justicedata.map(function(d) { return d.justiceName; }).indexOf(J_unique[i]);			
		J_SCscore.push(justicedata[pos].SCScore)  
	}
	J_unique_SC = d3.zip(J_unique, J_SCscore)

	//sort zip of unique justices based on SC score, in 2nd column
	J_unique_SC.sort(function(a, b){
		return a[1] - b[1]
	});

	//redo order of J_unique based on SC scores
	J_unique = []
	for (i = 0; i < J_unique_SC.length; i++){
		// console.log(J_unique_SC[i][0])
		J_unique.push((J_unique_SC[i][0]))
	}
	
	//using order of inc/dec SC scores, 
	//get index of prez that appointed justice and their party and make into object with list of justices
	J_party = []  //president's party 
	J_prez = []
	// J_name = [] //sanity check passed -- names match J_unique
	J_lastname = [] 
	
	for (i = 0; i < J_unique.length; i++){
		pos = justicedata.map(function(d) { return d.justiceName; }).indexOf(J_unique[i]);	
		J_prez.push(justicedata[pos].President)
		// J_name.push(justicedata[pos].justiceName)
		J_party.push(justicedata[pos].PresidentParty)
		J_lastname.push(justicedata[pos].lastName)	
	}	
	J_unique_prez = d3.zip(J_unique, J_prez)   
	J_unique_party = d3.zip(J_unique, J_party)
	J_unique_lastname = d3.zip(J_lastname, J_party)	
	// console.log(J_lastname)
	// console.log(J_unique)

	//Width and height
	var w = 805;  //needs to be 805 to fit eisenhower in corner on svg
 	// var h = 720;  //for purposes of screenshotting 
 	var h = 750;
	var barPadding = 5;
	var cellsize = 630/J_unique.length;
	// var cellsize = 600/J_unique.length;
	var labelpadding = 25;	
	var fontsize = "22px";
	var fontsizevalue = 20;  //initial font size
	//change font based on cell size
	if (cellsize < 33){		
		fontsizevalue = 20;
		// fontsizevalue = Math.round(fontsizevalue)
		fontsize = fontsizevalue + "px";
	}

	if (cellsize < 22){		
		fontsizevalue = 17;
		// fontsizevalue = Math.round(fontsizevalue)
		fontsize = fontsizevalue + "px";
	}

	//how much to shift boxes/labels by based on max pixel length of text
	var downshiftAmt = getDownShiftAmt(J_lastname)
	
	//Create SVG element
	var svg = d3.select("#mainChart")
		.append("svg")
		.attr("width", w)
		.attr("height", h);

	var tip = d3.tip()
		.attr("class", "d3-tip")
		.html(function(d,i) { 
			if (d.value.Case_Count > 0)
	   		{
	   			var agree_rate = d.value.Total_Votes/d.value.Case_Count;
	   		} else {
	   			var agree_rate = 0;
	   		}
	   		var percent_rate = Math.round(agree_rate * 100) + "%";
	   	
			var tooltip_y_coor = Math.min(J_unique.indexOf(d.value.J1name), J_unique.indexOf(d.value.J2name));
			var tooltip_x_coor = Math.max(J_unique.indexOf(d.value.J1name), J_unique.indexOf(d.value.J2name));

			if (d.value.Case_Count > 0){

				if (ChosenCategory != "All"){					
					var tooltiptext = J_lastname[tooltip_x_coor] + " and " + J_lastname[tooltip_y_coor]	+ " voted together on "
					+ percent_rate + "<br> of the time regarding " + ChosenCategory + ".  (" + d.value.Total_Votes + "/" + d.value.Case_Count + ")";
				} else {
					var tooltiptext = J_lastname[tooltip_x_coor] + " and " + J_lastname[tooltip_y_coor]	+ " voted together "
					+ percent_rate + "<br> of the time.  (" + d.value.Total_Votes + "/" + d.value.Case_Count + ")";
				}
			} else {
				//no data between justices 
				// var tooltiptext = "No data.  " +  J_unique[tooltip_x_coor] + " and " + J_unique[tooltip_y_coor]	+ " did not overlap."
				var tooltiptext = "No instances. "
			}
			return tooltiptext;
		});
		
	svg.call(tip);
	
	svg.selectAll("rect")
	   .data(databy_Jpair)
	   .enter()
	   .append("rect")
	   .attr("class", "colorbox")
	   .attr("id", function (d,i) { 
	  	// return d.J1name + "_" + d.J2name;  does not work b/c order of data is random
	  	//must use J_unique to give id names
	  	var boxid = J_unique[J_unique.indexOf(d.value.J2name)] + "_" + J_unique[J_unique.indexOf(d.value.J1name)];
	  	return boxid;
		})
	   .attr("x", function(d, i) {
	   		if (d.value.Case_Count > 0){
	   			var agree_rate = d.value.Total_Votes/d.value.Case_Count;
	   		} else {
	   			var agree_rate = 0;
	   		}	   		 
	   		//want lower triangular --switch max and min if want upper triangular
	   		//get index of unique list (ie x or y loc) of justices of each justice to know where to draw
	   		// console.log(d)	   	
	   		var x_coor = Math.min(J_unique.indexOf(d.value.J1name), J_unique.indexOf(d.value.J2name));	   		
	   		return labelpadding + downshiftAmt + cellsize * (x_coor) + (cellsize - agree_rate*cellsize)/2;

	   })
	   .attr("y",  function(d, i) {   
	   		if (d.value.Case_Count > 0){
	   			var agree_rate = d.value.Total_Votes/d.value.Case_Count;
	   		} else {
	   			var agree_rate = 0;
	   		}		
	   		var y_coor = Math.max(J_unique.indexOf(d.value.J1name), J_unique.indexOf(d.value.J2name));	   		
	   		// console.log(labelpadding + 100 + cellsize * (1 + y_coor));
	   		return labelpadding + downshiftAmt + cellsize * (y_coor) + (cellsize - agree_rate*cellsize)/2;
	   	})
	  .attr("width", function(d) {
			if (d.value.Case_Count > 0){
	   			var agree_rate = d.value.Total_Votes/d.value.Case_Count;
	   		} else {
	   			var agree_rate = 0;
	   		}	   		 
	   		return agree_rate * cellsize;

	   })
	   .attr("height", function(d) {
			if (d.value.Case_Count > 0){
	   			var agree_rate = d.value.Total_Votes/d.value.Case_Count;
	   		} else {
	   			var agree_rate = 0;
	   		}	   		 
	   		return agree_rate * cellsize;

	   })		   
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
	   	.style("stroke-width", 1)
	   	.style("stroke", "black")
		.on("mouseover", function(d){ tip.show(d); })
		.on("mouseout", function(d){ tip.hide(d); });	

	fakedata = [2];
	//draw one big border around all squares
	svg.selectAll("bigbox")
		.data(fakedata)
		.enter()
		.append("rect")
		.attr("width", cellsize * J_unique.length)
		.attr("height", cellsize * J_unique.length)
		.attr("fill", "none")
		.attr("x",labelpadding + downshiftAmt)
		.attr("y",labelpadding + downshiftAmt)
		.style("stroke-width", 1)
	   	.style("stroke", "black");	   	

	//MAKE RECTANGULAR -- ADD UPPER TRIANGULAR --repeat: change selectAll tag, switch x, y coordinates, change tool tip
	var tip2 = d3.tip()
		.attr("class", "d3-tip")
		.html(function(d,i) { 
			if (d.value.Case_Count > 0)
	   		{
	   			var agree_rate = d.value.Total_Votes/d.value.Case_Count;
	   		} else {
	   			var agree_rate = 0;
	   		}
	   		var percent_rate = Math.round(agree_rate * 100) + "%";
	   	
			var tooltip_x_coor = Math.min(J_unique.indexOf(d.value.J1name), J_unique.indexOf(d.value.J2name));
			var tooltip_y_coor = Math.max(J_unique.indexOf(d.value.J1name), J_unique.indexOf(d.value.J2name));

			if (d.value.Case_Count > 0){

				if (ChosenCategory != "All"){					
					// console.log(J_unique_lastname[tooltip_x_coor])
					var tooltiptext = J_lastname[tooltip_x_coor] + " and " + J_lastname[tooltip_y_coor]	+ " voted together on "
					+ percent_rate + "<br> of the time regarding " + ChosenCategory + ".  (" + d.value.Total_Votes + "/" + d.value.Case_Count + ")";

					// console.log(tooltiptext)
				} else {
					var tooltiptext = J_lastname[tooltip_x_coor] + " and " + J_lastname[tooltip_y_coor]	+ " voted together "
					+ percent_rate + "<br> of the time.  (" + d.value.Total_Votes + "/" + d.value.Case_Count + ")";
				}
			} else {
				//no data between justices 
				// var tooltiptext = "No data.  " +  J_unique[tooltip_x_coor] + " and " + J_unique[tooltip_y_coor]	+ " did not overlap."
				var tooltiptext = "No instances. "
			}
			return tooltiptext;
		});
		
	svg.call(tip2);

	svg.selectAll("rect2")
	   .data(databy_Jpair)
	   .enter()
	   .append("rect")
	   .attr("class", "colorbox")
	   .attr("id", function (d,i) { 
	  	// return d.J1name + "_" + d.J2name;  does not work b/c order of data is random
	  	//must use J_unique to give id names
	  	var boxid = J_unique[J_unique.indexOf(d.value.J2name)] + "_" + J_unique[J_unique.indexOf(d.value.J1name)];
	  	return boxid;
		})
	   .attr("x", function(d, i) {
	   		if (d.value.Case_Count > 0){
	   			var agree_rate = d.value.Total_Votes/d.value.Case_Count;
	   		} else {
	   			var agree_rate = 0;
	   		}	 
	   		//want lower triangular --switch max and min if want upper triangular
	   		//get index of unique list (ie x or y loc) of justices of each justice to know where to draw
	   		// console.log(d)
	   		//center the squares
	   		var x_coor = Math.max(J_unique.indexOf(d.value.J1name), J_unique.indexOf(d.value.J2name));	   		
	   		return labelpadding + downshiftAmt + cellsize * (x_coor) + (cellsize - agree_rate*cellsize)/2;

	   })
	   .attr("y",  function(d, i) {   
	   		if (d.value.Case_Count > 0){
	   			var agree_rate = d.value.Total_Votes/d.value.Case_Count;
	   		} else {
	   			var agree_rate = 0;
	   		}	 
	   		var y_coor = Math.min(J_unique.indexOf(d.value.J1name), J_unique.indexOf(d.value.J2name));	   		
	   		// console.log(labelpadding + 100 + cellsize * (1 + y_coor));
	   		return labelpadding + downshiftAmt + cellsize * (y_coor) + (cellsize - agree_rate*cellsize)/2;
	   	})
	   .attr("width", function(d) {
			if (d.value.Case_Count > 0){
	   			var agree_rate = d.value.Total_Votes/d.value.Case_Count;
	   		} else {
	   			var agree_rate = 0;
	   		}	   		 
	   		return agree_rate * cellsize;

	   })
	   .attr("height", function(d) {
			if (d.value.Case_Count > 0){
	   			var agree_rate = d.value.Total_Votes/d.value.Case_Count;
	   		} else {
	   			var agree_rate = 0;
	   		}	   		 
	   		return agree_rate * cellsize;

	   })	   
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
	   	.style("stroke-width", 1)
	   	.style("stroke", "black")
		.on("mouseover", function(d){ tip2.show(d); })
		.on("mouseout", function(d){ tip2.hide(d); });	
	
	// justice labels -- vertical axis 
	var J1text = svg.append("g").selectAll("text")
		.data(J_unique_lastname)
		.enter()
		.append("text");

	J1text
		// .attr("class", "judgelabel")
		.attr("class", function(d,i) { return J_prez[i];})
		.attr("id", function(d,i) { return "J1_" + d[0] + "_" + J_prez[i];})
		.attr("x", 0)
		.attr("y", function(d, i) { 
			var ypos = labelpadding + downshiftAmt + cellsize * (1 + i) - (cellsize * 0.5); 
			return ypos; 
		})
		.attr("dy","0.35em") //center text vertically
		.text(function(d){ return d[0]; })
		.style("font-size", fontsize)
		.style("fill", function(d) {  
			if (d[1] == "D"){
				return "blue";
			} else {
				return "red";
			}
		})
		.on("mouseover", function(d,i) { 
			var J_el = document.getElementById("J1_" + d[0] + "_" + J_prez[i]);
			J_el.style.fontWeight = 'bold';	
			J_el.style.fontSize = '125%';	

			var prez_el = document.getElementById("Prez" + J_prez[i]);
			prez_el.style.fontWeight = 'bold';
			prez_el.style.fontSize = '130%';	
			prez_el.style.textDecoration = 'underline';

			//hide all other presidents except appointing president when hover over justice
			var prezes = document.getElementsByClassName("appointingPrez");
			for (j=0; j<prezes.length; j++){
				if (prezes[j].textContent != J_prez[i]){
					prezes[j].style.opacity = '0';
				}				
			}
			
		})	
		.on("mouseout", function(d,i) { 
			var J_el = document.getElementById("J1_" + d[0] + "_" + J_prez[i]);
			J_el.style.fontWeight = 'normal';	
			J_el.style.fontSize = fontsizevalue;	

			var prez_el = document.getElementById("Prez" + J_prez[i]);
			prez_el.style.fontWeight = 'normal';
			prez_el.style.fontSize = '100%';
			prez_el.style.textDecoration = 'none';

			//make all justices reappear
			var prezes = document.getElementsByClassName("appointingPrez");
			for (j=0; j<prezes.length; j++){
					prezes[j].style.opacity = '1';			
			}

		});

	J1text.exit().remove();
	//x axis--rotated labels 
	var J2text = svg.append("g")
		.selectAll("text")
			.data(J_unique_lastname)
			.enter()
			.append("text");
//wtf is going on with the x and y being swapped -- b/c i transformed? 
	J2text		
		.attr("class", function(d,i) { return J_prez[i];})
		.attr("id", function(d,i) { return d[0] + "_" + J_prez[i];})
		// .attr("x", function(d, i) {  return labelpadding + cellsize * (1 + i);  })
		.attr("x", 0)
		.attr("y", function(d, i) {  return labelpadding + downshiftAmt + cellsize * (1 + i) - (cellsize * 0.5 );  })
		.style("text-anchor", "end")
		// .attr("transform", function(d) { return "rotate(-65)" })
		.attr("transform", function(d) { return "rotate(-90)" })
		.text(function(d){ return d[0]; })
		.style("fill", function(d) {  
			if (d[1] == "D"){
				return "blue";
			} else {
				return "red";
			}
		})
		.style("font-size", fontsize)
		.attr("dy","0.35em")   //center text vertically;	
		.on("mouseover", function(d,i) { 
			var J_el = document.getElementById(d[0] + "_" + J_prez[i]);
			J_el.style.fontWeight = 'bold';	
			J_el.style.fontSize = '125%';	

			var prez_el = document.getElementById("Prez" + J_prez[i]);
			prez_el.style.fontWeight = 'bold';
			prez_el.style.fontSize = '130%';	
			prez_el.style.textDecoration = 'underline';

			//hide all other presidents except appointing president when hover over justice
			var prezes = document.getElementsByClassName("appointingPrez");
			for (j=0; j<prezes.length; j++){
				if (prezes[j].textContent != J_prez[i]){
					prezes[j].style.opacity = '0';
				}				
			}

		})
		.on("mouseout", function(d,i) { 
			var J_el = document.getElementById(d[0] + "_" + J_prez[i]);
			J_el.style.fontWeight = 'normal';	
			J_el.style.fontSize = fontsizevalue;		

			var prez_el = document.getElementById("Prez" + J_prez[i]);
			prez_el.style.fontWeight = 'normal';
			prez_el.style.fontSize = '100%';
			prez_el.style.textDecoration = 'none';

			//make all justices reappear
			var prezes = document.getElementsByClassName("appointingPrez");
			for (j=0; j<prezes.length; j++){
					prezes[j].style.opacity = '1';			
			}
		});

	//LEGEND--linear color gradient 
	var defs = svg.append("defs");

	var linearGradient = defs.append("linearGradient")
		.attr("id", "linear-gradient");

	//make horizontal gradient 
	linearGradient
		.attr("x1", "0%")
	    .attr("y1", "0%")
	    .attr("x2", "100%")
	    .attr("y2", "0%");

	//define gradient -- need stop element and its 3 attributes
	//start color
	linearGradient.append("stop")
		.attr("offset", "0%")
		.attr("stop-color", "white");

	//stop color 
	linearGradient.append("stop")
		.attr("offset", "100%")
		.attr("stop-color", "purple");

	var legendshift = 30;
	var legendtextshift = 25;
	//create rectangle and fill it with gradient -- use url to refer to css b/c fill is style property
	svg.append("rect")
		.attr("width", 150)
		.attr("height", 20)
		.attr("x", cellsize * J_unique.length + labelpadding + downshiftAmt + legendshift)
		.attr("y", downshiftAmt + labelpadding + 10)
		.style("fill", "url(#linear-gradient");

	//jeezus this is inefficient code.  clean this shit up 
	svg.append("text").text("0%")
		.attr("x", cellsize * J_unique.length + labelpadding + downshiftAmt + legendshift)
		.attr("y", downshiftAmt + labelpadding + legendtextshift)

	svg.append("text").text("100%")
		.attr("x", cellsize * J_unique.length + labelpadding + downshiftAmt + 182)
		.attr("y", downshiftAmt + labelpadding + legendtextshift)

	svg.append("text").text("Agreement Scale")
		.attr("x", cellsize * J_unique.length + labelpadding + downshiftAmt + legendshift)
		.attr("y", downshiftAmt + labelpadding)

	svg.append("text").text("Nominating Presidents")
		.attr("x", cellsize * J_unique.length + labelpadding + downshiftAmt + legendshift)
		.attr("y", downshiftAmt + labelpadding + legendtextshift + 2*legendtextshift)

	//list of nominating prez -- underline 
	svg.selectAll("prez_label")
		.data(J_unique_prez)  //justice-prez 
		.enter().append("text")
		.attr("id", function(d,i) { var prez = J_prez.filter(function(itm, i, J_prez){ return i == J_prez.indexOf(itm); });			
			return "Prez" + prez[i];
		})
		.attr("class", "appointingPrez")
		.attr("x", cellsize * J_unique.length + labelpadding + downshiftAmt + legendshift)
		.attr("y", function(d,i) { 
			return  downshiftAmt + labelpadding + legendtextshift + 3*legendtextshift + i*22; })
		.text(function(d,i){ 
			//return unique list of prez
			var prez = J_prez.filter(function(itm, i, J_prez){ return i == J_prez.indexOf(itm); });			
			return prez[i];
		})
		.style("fill", function(d,i) {
		//color prez based on party	
			var prez = J_prez.filter(function(itm, i, J_prez){ return i == J_prez.indexOf(itm); });			
			var J_prez_index = J_prez.indexOf(prez[i]); //index of prez we want (same index as party)
			var party = J_party[J_prez_index];
				
			if (party == "D"){
				return "blue";
			} else {
				return "red";
			}
		})
		.on("mouseover", function (d,i) {
			//prez we've moused over (get text of svg text tag)
			var prez = this.textContent
			// var prez = J_prez.filter(function(itm, i, J_prez){ return i == J_prez.indexOf(itm); });
			// console.log(prez[i])
			var prez_el = document.getElementById("Prez" + prez)
			prez_el.style.fontWeight = 'bold';
			prez_el.style.fontSize = '130%';	

			var J_el = document.getElementsByClassName(prez)
			for (i=0; i<J_el.length; i++){
				J_el[i].style.fontWeight = 'bold';
				J_el[i].style.textDecoration = 'underline';
				J_el[i].style.fontSize = '125%';	
			}
				
		})
		.on("mouseout", function (d,i) {
			//prez we've moused over (get text of svg text tag)
			var prez = this.textContent
		
			var prez_el = document.getElementById("Prez" + prez)
			prez_el.style.fontWeight = 'none';
			prez_el.style.fontSize = '100%';

			var J_el = document.getElementsByClassName(prez)
			for (i=0; i<J_el.length; i++){
				J_el[i].style.fontWeight = 'normal';
				J_el[i].style.textDecoration = 'none';
				J_el[i].style.fontSize = fontsizevalue;	
			}
				
		});

}

