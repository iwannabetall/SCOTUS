$(document).ready(function(){

	for (var i = 1946; i < 2016; i++){
		// var html = '<input type ="checkbox" id=year' + i + " value=" + i + " onchange=" + '"changeYear(' + i + ');><label class=' + 'yearlabel'+ '>' + i +'</label>';
		// var html = html + html;
		// console.log(html);
		// // $('.checkboxes').html('<input type ="checkbox";><label class=' + 'yearlabel'+ '>' + "god dammit" +'</label>');
// // <input type="checkbox" id="Martin O'Malley" value="Martin O'Malley" class="renderBox prelimInput" onchange="candidateProcessor();justChecked(this.value);"><label class="prelimLabel">O'Malley</label>
		$('.checkboxes').append('<input type ="checkbox" class="Yearbox" id=year' + i + " value=" + i + " onchange=" + '"processData()";><label class=' + 'yearlabel'+ '>' + i +'</label>');	
	}
});

// function createNewCheckboxt(name, id){
//     var checkbox = document.createElement('input'); 
//     checkbox.type= 'checkbox';
//     checkbox.value = id;
//     checkbox.id = id;
//     checkbox.label = name;	
//     return checkbox;
// }

// for (var i = 1946; i < 2016; i++){
// 	console.log(document.getElementById("checkboxes"));
// 	// document.getElementById("checkboxes").appendChild(createNewCheckboxt(i, "year" + i));
// }
// });