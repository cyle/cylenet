function id(wat) {
	return document.getElementById(wat);
}

function init() {
	id('go-btn').addEventListener('click', go, false);
}

function go() {
	var crl = id('address-bar').value;
	//alert(crl);
	console.log('traveling to: ' + crl);
}

window.addEventListener("load", init, false);

/*

// rendering markdown:

var markdown = require('markdown').markdown;
document.write(markdown.toHTML("Hello **World**!"));

*/