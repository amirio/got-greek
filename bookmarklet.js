//javascript:
/*global document, yepnope, gotGreek*/
function run() {
    // in all URLs leave protocol unspecified (e.g. '//url/goes/here')
    // to allow for http and/or https
    var style, menu, yepnopeScript, loadGotGreek;
    loadGotGreek = function () {
        yepnope({
            load: '//raw.githubusercontent.com/amirkdv/got-greek/master/gotgreek.js';
            callback: function () { gotGreek.boot(); }
        });
    }
    if (document.getElementById('gotgreekcss') === null) {
        style = document.createElement('link');
        style.id = 'gotgreekcss';
        style.type = 'text/css';
        style.rel = 'stylesheet';
        style.href = '//raw.githubusercontent.com/amirkdv/got-greek/master/gotgreek.css';
        menu = document.createElement('div');
        document.head.appendChild(style);
        menu.setAttribute('id', 'gotGreek-menu');
        menu.appendChild(document.createTextNode('GotGreek is Loading ...'));
        document.body.appendChild(menu);
    }
    if (typeof yepnope === 'undefined') {
        yepnopeScript = document.createElement('script');
        yepnopeScript.type = 'text/javascript';
        yepnopeScript.src = '//cdnjs.cloudflare.com/ajax/libs/yepnope/1.5.4/yepnope.min.js';
        yepnopeScript.onreadystatechange = yepnopeScript.onload = loadGotGreek;
        document.head.appendChild(yepnopeScript);
    } else {
        loadGotGreek();
    }
}
run();
void(0);
