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

function empty(graphics) { // duplicated, move to main.js or create utils.js

    for (var i = 1; i < graphics.children.length; i++) {
        graphics.removeChild(graphics.children[i]);
    };
}
