$(document).ready(function(){
	//generate checkboxes for each year 
	// for (var i = 1946; i < 2016; i++){
	// 	$('.checkboxes').append('<input type ="checkbox" class="Yearbox" id=year' + i + " value=" + i + " onchange=" + '"processData()";><label class=' + 'yearlabel'+ '>' + i +'</label> <br>');	
	// }
	// $years = $.map($(Array(8)),function(val, i) { return i; });
	// console.log($years)

	 $(function () {

        $("#range").ionRangeSlider({
        	// values: $years,
            hide_min_max: true,
            keyboard: true,
            min: 1946,
            max: 2015,
            from: 1975, //where slider starts 
            to: 1980,
            type: 'double',
            step: 1,
            grid: true,
            prettify_enabled: false,
            onStart: function (data){
            	//process data with selected years
            	processData(data.from, data.to);
            },
            onFinish: function (data) {
            	processData();  
            }
        });

    });

});