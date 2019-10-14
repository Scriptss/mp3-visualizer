var overlay;


$(document).ready(function(){
    $( "#on-start" ).click(function() {
        $("#overlay").hide();
        play("test.mp3")
    });
});