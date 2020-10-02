var audioContext = new AudioContext();
var dt = 1.0 / audioContext.sampleRate;

var nextBufferTime = 0.0;     // when the next buffer is due.
var samples = audioContext.sampleRate / 50 // samples
const bufferLength = 1 / 50 // buffer will last 1/50 sec
const scheduleAheadTime = 0.08;    // How far ahead to schedule audio (sec)
var timerWorker = null; // Web worker used to fire timer messages

const sounds =
    [ new Sound("q", (440.0 * 2 ** (-9 * 1.0 / 12.0)), 0, false, soundStates.SILENT)
    , new Sound("2", (440.0 * 2 ** (-8 * 1.0 / 12.0)), 0, false, soundStates.SILENT)
    , new Sound("w", (440.0 * 2 ** (-7 * 1.0 / 12.0)), 0, false, soundStates.SILENT)
    , new Sound("3", (440.0 * 2 ** (-6 * 1.0 / 12.0)), 0, false, soundStates.SILENT)
    , new Sound("e", (440.0 * 2 ** (-5 * 1.0 / 12.0)), 0, false, soundStates.SILENT)
    , new Sound("r", (440.0 * 2 ** (-4 * 1.0 / 12.0)), 0, false, soundStates.SILENT)
    , new Sound("5", (440.0 * 2 ** (-3 * 1.0 / 12.0)), 0, false, soundStates.SILENT)
    , new Sound("t", (440.0 * 2 ** (-2 * 1.0 / 12.0)), 0, false, soundStates.SILENT)
    , new Sound("6", (440.0 * 2 ** (-1 * 1.0 / 12.0)), 0, false, soundStates.SILENT)
    , new Sound("y", (440.0 * 2 ** (0 * 1.0 / 12.0)), 0, false, soundStates.SILENT)
    , new Sound("7", (440.0 * 2 ** (1 * 1.0 / 12.0)), 0, false, soundStates.SILENT)
    , new Sound("u", (440.0 * 2 ** (2 * 1.0 / 12.0)), 0, false, soundStates.SILENT)
    , new Sound("i", (440.0 * 2 ** (3 * 1.0 / 12.0)), 0, false, soundStates.SILENT)
    ]

const toneColor = new ToneColor(0.025, 0.025, 0.5, 0.1, 0.2, 0.1, 0.2, 0.2);

const overTones =
    [ new OverTone("16' harm.", 0.5, 0.3)
    , new OverTone("5 1/3' harm.", 0.66, 0.5)
    , new OverTone("8' (alap) harm.", 1, 0.7)
    , new OverTone("4' harm.", 2, 0.5)
    , new OverTone("2 2/3' harm.", 3, 0)
    , new OverTone("2' harm.", 4, 0)
    , new OverTone("1 3/5' harm.", 5, 0)
    , new OverTone("1 1/3' harm.", 6, 0)
    , new OverTone("1' harm.", 8, 0)
    ]

function nextBuffer() {
    nextBufferTime += bufferLength;
}

function scheduleBuffer(time) {
    const buffer = audioContext.createBuffer(1, samples, audioContext.sampleRate);

    let bufferData = createBuffer(samples, sounds, toneColor, overTones, dt)
    buffer.copyToChannel(Float32Array.from(bufferData),0,0);
    
    let buffSource = audioContext.createBufferSource();
    buffSource.buffer = buffer;
    buffSource.connect(audioContext.destination);
    buffSource.start(time);
}

window.onload = init;

function init() {
    document.addEventListener("keydown", updateKeys, false);
    document.addEventListener("keyup", updateKeys, false);

    timerWorker = new Worker("js/synthworker.js");

    timerWorker.onmessage = function (e) {
        if (e.data == "tick") {
            scheduler();
        }
    };
    drawSettings();
    window.requestAnimationFrame(() => draw(sounds));
}

function start() {
    nextNoteTime = audioContext.currentTime;
    timerWorker.postMessage("start");
}

function scheduler() {
    // while there are notes that will need to play before the next interval, 
    // schedule them and advance the pointer.
    while (nextBufferTime < audioContext.currentTime + scheduleAheadTime) {
        scheduleBuffer(nextBufferTime);
        nextBuffer();
    }
}

function updateKeys(event) {
    for (let i = 0; i < sounds.length; i++) {
        let key = event.key;
        if (event.key == 'z') // support hungarian keyboard
            key = 'y';
        if (sounds[i].key == key) {
            sounds[i].isOn = (event.type) == ("keydown")
        }
    }
}

// keyboard drawing
function isKeyOn(key, sounds) {
    for (let i = 0; i < sounds.length; i++) {
        if (sounds[i].key == key)
            return sounds[i].isOn;
    }
    return false;
}

var lastSounds;

function draw(sounds) {
    if (JSON.stringify(lastSounds) !== JSON.stringify(sounds) ) { // draw only if sounds has changed 
        if (document.getElementById("svgKeyboard")) {
            document.getElementById("svgKeyboard").remove();
        }
        document.getElementById("keyboard").
            appendChild(drawKeyboard(sounds));
    }
    lastSounds = JSON.parse(JSON.stringify(sounds)); // deep copy
    window.requestAnimationFrame(() => draw(sounds));
}

function drawKeyboard(sounds) {
    var svgElem = createSvgElement("svg", { "width": 500, "height": 120, "viewBox": "0 0 500 120", "id": "svgKeyboard" })
    let whiteKeys = "qwertyui";
    for (let i = 0; i < whiteKeys.length; i++) {
        svgElem.appendChild(whiteKey(i * 25, whiteKeys[i], isKeyOn(whiteKeys[i], sounds)));
    }
    let blackKeys = "234567";
    for (let i = 0; i < blackKeys.length; i++) {
        if (i == 2)
            continue;
        svgElem.appendChild(blackKey(20 + i * 25, blackKeys[i], isKeyOn(blackKeys[i], sounds)));
    }
    return svgElem;
}

function whiteKey(x, label, pressed) {
    let width = 25
    let height = 100;
    let fill = pressed ? "#D7D7D7" : "white"
    var g = createSvgElement("g", {});
    var rect = createSvgElement("rect", { "x": x + width, "y": 10, "width": width, "height": height, "stroke": "black", "fill": fill })
    var text = createSvgElement("text", { "x": x + width + 7, "y": 75 })
    text.textContent = label
    g.appendChild(rect);
    g.appendChild(text);
    return g;
}

function blackKey(x, label, pressed) {
    let width = 20
    let height = 45;
    let fill = pressed ? "black" : "#363636"
    var g = createSvgElement("g", {});
    var rect = createSvgElement("rect", { "x": x + width, "y": 10, "width": width, "height": height, "stroke": "black", "fill": fill })
    var text = createSvgElement("text", { "x": x + width + 5, "y": 40, "fill": "white" })
    text.textContent = label
    g.appendChild(rect);
    g.appendChild(text);
    return g;
}


function createSvgElement(svgElement, attributes) {
    n = document.createElementNS("http://www.w3.org/2000/svg", svgElement);
    for (var attribute in attributes)
        n.setAttributeNS(null, attribute, attributes[attribute]);
    return n;
}

// draw settings

function drawSettings() {
    let overTonesHtml = document.getElementById("overTones");
    for (let i = 0; i < overTones.length; i++) {
        let input = createElement("input", {"type": "range", "min": 0, "max": 1, "step": 0.1, "name": overTones[i].name, "value": overTones[i].ratio})
        input.oninput = function () { overTones[i].ratio = +this.value;}
        let label = createElement("label", {"for": overTones[i].name})
        label.innerText = overTones[i].name
        let div = createElement("div", {});
        div.appendChild(label);
        div.appendChild(input);
        overTonesHtml.appendChild(div);
    }

    let toneColorHtml = document.getElementById("toneColor");
    for (let i in toneColor) {
        let input = createElement("input", {"type": "range", "min": 0, "max": 1, "step": 0.1, "name": i, "value": toneColor[i]})
        input.oninput = function () { toneColor[i] = +this.value;}
        let label = createElement("label", {"for": i})
        label.innerText = i
        let div = createElement("div", {});
        div.appendChild(label);
        div.appendChild(input);
        toneColorHtml.appendChild(div);
    }

}

function createElement(element, attributes) {
    let input = document.createElement(element);
    for (var attribute in attributes)
        input.setAttribute(attribute, attributes[attribute]);
    return input;
}


