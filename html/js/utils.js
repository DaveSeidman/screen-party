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


var fontStyle = {
    font: 'bold 120px Arial', // Set style, size and font
    fill: 'white', // Set fill color to blue
    align: 'center', // Center align the text, since it's multiline
    stroke: '#black', // Set stroke color to a dark blue-gray color
    strokeThickness: 4, // Set stroke thickness to 20
    lineJoin: 'round' // Set the lineJoin to round instead of 'miter'
}
