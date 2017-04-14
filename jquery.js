$(document).ready(function(){
	//generate checkboxes for each year 
	// for (var i = 1946; i < 2016; i++){
	// 	$('.checkboxes').append('<input type ="checkbox" class="Yearbox" id=year' + i + " value=" + i + " onchange=" + '"processData()";><label class=' + 'yearlabel'+ '>' + i +'</label> <br>');	
	// }
	// $years = $.map($(Array(8)),function(val, i) { return i; });
	// console.log($years)

	//generate years 
	$('#YearPicker').append('<select id="oneYear" onchange="wipePage();processData(this.value, this.value);">');
	for (var i = 1946; i < 2016; i++){
		$('#oneYear').append('<option value="' + i + '">' + i +'</option>');
	}
	$('#YearPicker').append('</select>');


	 $(function () {

        $("#range").ionRangeSlider({
        	// values: $years,
            hide_min_max: true,
            keyboard: true,
            min: 1946,
            max: 2015,
            from: 1977, //where slider starts 
            to: 1980,
            type: 'double',
            step: 1,
            grid: true,
            prettify_enabled: false,
            onStart: function (data){
            	wipePage();
            	//process data with selected years -- what happens to function without parameter            	
            	processData(data.from, data.to);
            },
            onFinish: function (data) {
            	wipePage();
            	processData(data.from, data.to);
            }
        });

    });

	var vid = $('#v0')[0];

	vid.onplay = vid.onclick = function() {
	    vid.onplay = vid.onclick = null;

	    setTimeout(function() {
	        vid.pause();
	        setInterval(function() {
	            if($.browser.opera) {
	                var oldHandler = vid.onplay;
	                vid.onplay = function() {
	                    vid.pause();
	                    vid.onplay = oldHandler;
	                };
	                vid.play();
	            } else {
	                vid.currentTime += (1 / 29.97);
	            }
	        }, 2000);
	    }, 12000);

	    setInterval(function() {
	        $('#time').html((vid.currentTime * 29.97).toPrecision(5));
	    }, 100);
	};


});