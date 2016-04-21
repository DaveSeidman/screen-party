function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        }, wait);
        if (immediate && !timeout) func.apply(context, args);
    };
};


function getAgent() {
    var agent = "default";
    if(navigator.userAgent.match(/Android/i)) agent = "android";
    if(navigator.userAgent.match(/BlackBerry/i)) agent = "blackberry";
    if(navigator.userAgent.match(/iPhone|iPad|iPod/i)) agent = "ios";
    if(navigator.userAgent.match(/Opera Mini/i)) agent = "opera";
    if(navigator.userAgent.match(/IEMobile/i)) agent = "ie";
    return agent;
}

function smoothArray(array, samples) {

    var smoothedArray = [];
    for(var i = 0; i < array.length - samples; i++) {
        var sum = 0;
        for(var j = 0; j < samples; j++) {
            sum += array[i+j];
        }
        var avg = sum/samples;
        smoothedArray.push(avg);
    }
    return smoothedArray;
}

var fontStyle = {
    font: 'bold 120px Arial',
    fill: 'white',
    align: 'center',
    stroke: '#black',
    strokeThickness: 4,
    lineJoin: 'round'
}
