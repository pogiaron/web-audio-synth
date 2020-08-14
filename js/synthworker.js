var lookahead = 35.0;  // How frequently to call scheduling function (in milliseconds)
self.onmessage = function (e) {
    if (e.data == "start") {
        console.log("starting");
        setInterval(function () { postMessage("tick"); }, lookahead)
    }
}