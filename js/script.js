var initialised = false;
var c; //canvas
var ctx; //canvas 2d content
var w; // canvas width
var h; //canvas height


//important audio creation stuff
var audio;
var audioContext;
var analyserChannel0; //analyser10
var analyserChannel1; //analyser11
var processingNode; //processing node
var splitter; //audio splitter ?
var source; //source

//song data variables
var URL; //audio url (probably not needed now)
var TOP_TEXT; //top title text
var BOTTOM_TEXT; //bottom title text
var duration; // Duration of audio clip
var playhead; // playhead
var timeline; // timeline
var timelineWidth;
var onplayhead = false;

//constants to play with
var MODE = "columns";
var NUMBER_OF_POINTS = 150; // per channel (visualiser will have double this amount)
var RADIUS = 200; // central circle radius
var VISUALISER_RESOLUTION = 8192; // MUST BE A POWER OF 2!
var FREQUENCY_MULTIPLIER = 0.7; // modifies the distance of each point of the visualiser from the central circumference

//constants that should stay constant
var SCREEN_CENTER;
var THIRD_OF_CIRCUMFERENCE;
var TEXT_INCLINATION;
var CIRCUMFERENCE_STEPS;
var COLUMNS_WIDTH;
var OUTER_GRADIENT;
var INNER_GRADIENT;

//variables used to control the rotation of the central triangle
var triangleRotationStep = 0;
var triangleRotationAngle = 0;

var i, value0, value1, angle, points, point0, point1, array0, array1, middlePointX, middlePointY, s;


window.onload = function() {
    
    //set up audio and context
    audio = new Audio();
    
    //set up scrubber
    playhead = document.getElementById('playhead'); // playhead
    timeline = document.getElementById('timeline'); // timeline
    timelineWidth = timeline.offsetWidth - playhead.offsetWidth;
    
    //set up canvas
    c = document.getElementById('c');
    ctx = c.getContext('2d');
    w = c.width = window.innerWidth;
    h = c.height = window.innerHeight;
    
    //set up base context properties
    ctx.textAlign = "center";
    ctx.lineJoin = "round";
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 5;
    ctx.font = "30px Pacifico";
    
    SCREEN_CENTER = {
        X: w / 2,
        Y: h / 2
    };
    
    THIRD_OF_CIRCUMFERENCE = (Math.PI * 2) / 3;
    TEXT_INCLINATION = -Math.PI / 8;
    CIRCUMFERENCE_STEPS = (2 * Math.PI) / (NUMBER_OF_POINTS * 2);
    COLUMNS_WIDTH = (RADIUS * 2 * Math.PI) / (NUMBER_OF_POINTS * 2);
    
    //create the inner and outer gradients
    OUTER_GRADIENT = ctx.createRadialGradient(SCREEN_CENTER.X, SCREEN_CENTER.Y, 0, SCREEN_CENTER.X, SCREEN_CENTER.Y, w / 2);
    
    OUTER_GRADIENT.addColorStop(0, 'rgb(0, 0, 0)');
    OUTER_GRADIENT.addColorStop(1, 'rgb(0, 0, 0)');
    
    INNER_GRADIENT = ctx.createRadialGradient(SCREEN_CENTER.X, SCREEN_CENTER.Y, RADIUS, SCREEN_CENTER.X, SCREEN_CENTER.Y, 400);
    
    INNER_GRADIENT.addColorStop(1, 'rgb(69, 69, 69)');
    INNER_GRADIENT.addColorStop(0.05, 'rgb(69, 69, 69)');
    
    
    //variables used to control the rotation of the central triangle
    triangleRotationStep = 0;
    triangleRotationAngle = 0;    
    
    //draw the visualiser while waiting for the song and the audio api nodes to be ready
    visualise();
    
    //make sure the audio stuff is supported
    if (!window.AudioContext) {
        if (window.webkitAudioContext) {
            window.AudioContext = window.webkitAudioContext;
            
        } else {
            throw new Error('audio context not supported :(');
        }
    }
    
    addEventListeners();
};




    function init() {
        audioContext = new AudioContext(); //audio context
        source = audioContext.createMediaElementSource(audio);
        analyserChannel0 = audioContext.createAnalyser();
        analyserChannel1 = audioContext.createAnalyser();
        analyserChannel0.fftSize = analyserChannel1.fftSize = VISUALISER_RESOLUTION;
        processingNode = audioContext.createScriptProcessor(1024);
        processingNode.connect(audioContext.destination);
        processingNode.onaudioprocess = function(event) {
            array0 = new Uint8Array(analyserChannel0.frequencyBinCount);
            array1 = new Uint8Array(analyserChannel1.frequencyBinCount);
            analyserChannel0.getByteFrequencyData(array0);
            analyserChannel1.getByteFrequencyData(array1);
            visualise(array0, array1);
        };

        //splitter node to split the two stereo channels
        splitter = audioContext.createChannelSplitter(2);

        //connect the two outputs of the splitter node to each one of the analysers
        splitter.connect(analyserChannel0, 0);
        splitter.connect(analyserChannel1, 1);
        initialised = true;
    }
    
    function play(ID) {
        if (initialised == false ) {
            init();
        }
        //set the audio's source
        audio.crossOrigin = "anonymous";
        audio.src = ID;
    }
    
    //visualisation function
    function visualise(array0, array1) {
    
    //make sure the points array is empty
    points = [];
    
    //clear the canvas
    ctx.clearRect(0, 0, w, h);
    
    //fill background with the outer gradient
    ctx.fillStyle = OUTER_GRADIENT;
    ctx.fillRect(0, 0, w, h);
    
    
    ctx.fillStyle = INNER_GRADIENT;
    
    if (array0 && array1) {
    
      //get a coordinate object from every frequency value and put it in the points array
      for (i = 0; i < NUMBER_OF_POINTS; i++) {
        value0 = array0[i] * FREQUENCY_MULTIPLIER;
        value1 = array1[i] * FREQUENCY_MULTIPLIER;
        angle = i * CIRCUMFERENCE_STEPS - (Math.PI / 2);
        point0 = {
          x: SCREEN_CENTER.X + (Math.cos(angle) * (RADIUS + value0)),
          y: SCREEN_CENTER.Y + (Math.sin(angle) * (RADIUS + value0)),
          value: value0
        };
        point1 = {
          x: SCREEN_CENTER.X - (Math.cos(angle + CIRCUMFERENCE_STEPS) * (RADIUS + value1)),
          y: SCREEN_CENTER.Y + (Math.sin(angle + CIRCUMFERENCE_STEPS) * (RADIUS + value1)),
          value: value1
        };
        points.push(point0);
        points.unshift(point1);
      }
    


    
        //draw columns based visualiser
        ctx.beginPath();
        for (i = 0; i < points.length; i++) {
          ctx.save();
          ctx.translate(points[i].x, points[i].y);
          ctx.rotate(i * CIRCUMFERENCE_STEPS);
          ctx.fillRect(-(COLUMNS_WIDTH / 2), 0, COLUMNS_WIDTH - 1, -points[i].value);
          ctx.restore();
        }
    
    
      //draw the circle that encompasses the spinning triangle and the text
      ctx.beginPath();
      ctx.arc(SCREEN_CENTER.X, SCREEN_CENTER.Y, RADIUS, 0, 2 * Math.PI);
      
      
      ctx.fill();
      ctx.stroke();
    
    } else {
    
      //draw the central circle
      ctx.beginPath();
      ctx.arc(SCREEN_CENTER.X, SCREEN_CENTER.Y, RADIUS, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    
    }
    
    //draw the spinning triangle
    ctx.fillStyle = OUTER_GRADIENT;
    ctx.beginPath();
    ctx.moveTo(SCREEN_CENTER.X + Math.cos(triangleRotationAngle) * (RADIUS - 5), SCREEN_CENTER.Y + Math.sin(triangleRotationAngle) * (RADIUS - 5));
    ctx.lineTo(SCREEN_CENTER.X + Math.cos(triangleRotationAngle + THIRD_OF_CIRCUMFERENCE) * (RADIUS - 5), SCREEN_CENTER.Y + Math.sin(triangleRotationAngle + THIRD_OF_CIRCUMFERENCE) * (RADIUS - 5));
    ctx.lineTo(SCREEN_CENTER.X + Math.cos(triangleRotationAngle - THIRD_OF_CIRCUMFERENCE) * (RADIUS - 5), SCREEN_CENTER.Y + Math.sin(triangleRotationAngle - THIRD_OF_CIRCUMFERENCE) * (RADIUS - 5));
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    
    //update the traiangle's rotation velocity if the song is paused or just started playing
    if (audio && !audio.paused && triangleRotationStep < 0.05) {
      triangleRotationStep += 0.001;
    } else if (audio && audio.paused && triangleRotationStep > 0) {
      triangleRotationStep -= 0.001;
    }
    triangleRotationAngle += triangleRotationStep;
    
    ctx.save();
    ctx.fillStyle = "white";
    ctx.translate(SCREEN_CENTER.X, SCREEN_CENTER.Y);
    ctx.rotate(TEXT_INCLINATION);
    
    ctx.restore();

}
    
    
    
    
function addEventListeners() {
    
    //when the audio has ended play the next
    audio.addEventListener("ended", onFinish);

    
    //on play/pause button clicked
    $('#play-button').click(function() { 
    console.log("play-button clicked")
    if (!audio.paused) {
        console.log("pausing audio");
        audio.pause();
        showPlayButton();
    } else {
        if (audio.paused) {
            console.log("playing audio");
            audio.play();
            showPauseButton();
        }
    }
});
    
    //on resize reset gradients and calculate the canvas' new spatial properties
    window.addEventListener('resize', function() {
        //update canvas state
        w = c.width = window.innerWidth;
        h = c.height = window.innerHeight;
        SCREEN_CENTER = {
            X: w / 2,
            Y: h / 2
        };
    
        OUTER_GRADIENT = ctx.createRadialGradient(SCREEN_CENTER.X, SCREEN_CENTER.Y, 0, SCREEN_CENTER.X, SCREEN_CENTER.Y, w / 2);

        OUTER_GRADIENT.addColorStop(0, 'rgb(0, 0, 0)');
        OUTER_GRADIENT.addColorStop(1, 'rgb(0, 0, 0)');

        INNER_GRADIENT = ctx.createRadialGradient(SCREEN_CENTER.X, SCREEN_CENTER.Y, RADIUS, SCREEN_CENTER.X, SCREEN_CENTER.Y, 400);

        INNER_GRADIENT.addColorStop(1, 'rgb(69, 69, 69)');
        INNER_GRADIENT.addColorStop(0.05, 'rgb(69, 69, 69)');
        
        //reset base context properties
        ctx.textAlign = "center";
        ctx.lineJoin = "round";
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 5;
    });
    
    
    //once the audio has loaded enough to be played
    audio.addEventListener("canplaythrough", function() {
        console.log('sound clip at ' + this.src + ' loaded successfully');
        showPauseButton(); //reset the play button as a pause button
        duration = audio.duration;
        source.connect(audioContext.destination);
        source.connect(splitter);
        source.connect(processingNode);
        this.play();
    });
    
    // timeupdate event listener
    audio.addEventListener("timeupdate", timeUpdate, false);
    
    // makes timeline clickable
    timeline.addEventListener("click", function(event) {
        moveplayhead(event);
        console.log(duration * clickPercent(event));
        audio.currentTime = duration * clickPercent(event);
    }, false);
    
    playhead.addEventListener('mousedown', mouseDown, false);
    window.addEventListener('mouseup', mouseUp, false);

}


    // returns click as decimal (.77) of the total timelineWidth
    function clickPercent(event) {
        console.log("click percent: " + (event.clientX - getPosition(timeline)) / timelineWidth);
        return (event.clientX - getPosition(timeline)) / timelineWidth;

    }

    function mouseDown() {
        onplayhead = true;
        window.addEventListener('mousemove', moveplayhead, true);
        audio.removeEventListener('timeupdate', timeUpdate, false);
    }

    // mouseUp EventListener
    // getting input from all mouse clicks
    function mouseUp(event) {
        if (onplayhead == true) {
            moveplayhead(event);
            window.removeEventListener('mousemove', moveplayhead, true);
            // change current time
            audio.currentTime = duration * clickPercent(event);
            audio.addEventListener('timeupdate', timeUpdate, false);
        }
        onplayhead = false;
    }
    // mousemove EventListener
    // Moves playhead as user drags
    function moveplayhead(event) {
        var newMargLeft = event.clientX - getPosition(timeline);

        console.log("margin-left: " + newMargLeft);

        if (newMargLeft >= 0 && newMargLeft <= timelineWidth) {
            playhead.style.marginLeft = newMargLeft + "px";
        }
        if (newMargLeft < 0) {
            playhead.style.marginLeft = "0px";
        }
        if (newMargLeft > timelineWidth) {
            playhead.style.marginLeft = timelineWidth + "px";
        }
    }

    // timeUpdate
    // Synchronizes playhead position with current point in audio
    function timeUpdate() {
        var playPercent = timelineWidth * (audio.currentTime / duration);
        playhead.style.marginLeft = playPercent + "px";
    }

    function getPosition(el) {
        console.log("get position: " + el.getBoundingClientRect().left)
        return el.getBoundingClientRect().left;
    }


    function showPlayButton() {
        console.log("showing play button");
        $('#play-button').addClass('fa-play').removeClass('fa-pause');
    }


    function showPauseButton() {
        console.log("showing pause button");
        $('#play-button').addClass('fa-pause').removeClass('fa-play');
    }

    function onFinish() {
        $("#overlay").show();
        showPlayButton();
    }
