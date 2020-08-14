var audioContext = new AudioContext();

var t = 0;
var dt = 1.0 / audioContext.sampleRate;

var nextBufferTime = 0.0;     // when the next buffer is due.
var samples = audioContext.sampleRate / 50 // samples
const bufferLength = 1 / 50 // buffer will last 1/50 sec
const scheduleAheadTime = 0.08;    // How far ahead to schedule audio (sec)
var timerWorker = null; // Web worker used to fire timer messages

function nextBuffer() {
    nextBufferTime += bufferLength;
}

function scheduleBuffer(time) {
    const buffer = audioContext.createBuffer(1, samples, audioContext.sampleRate);
    let data = buffer.getChannelData(0);
    for (let i = 0; i < samples; i++) {
        let sample = 0;
        for (let i = 0; i < sounds.length; i++) {
            let sinWaveAtT;
            sinWaveAtT = Math.sin(sounds[i].freq * 2 * Math.PI * t)
            if (sounds[i].isOn) {
                if (sounds[i].volume < 1)
                    sounds[i].volume += 0.001
            } else {
                if (sounds[i].volume < 0.001)
                    sounds[i].volume = 0;
                if (sounds[i].volume > 0)
                    sounds[i].volume -= 0.001
            }
            sample += sinWaveAtT * sounds[i].volume
        }
        data[i] = sample
        t += dt;
    }
    let buffSource = audioContext.createBufferSource();
    buffSource.buffer = buffer;
    buffSource.connect(audioContext.destination);
    buffSource.start(time);
}

class Sound {
    constructor(key, freq, volume, isOn) {
        this.key = key;
        this.freq = freq;
        this.volume = volume
        this.isOn = isOn
    }
}

const sounds =
    [new Sound("q", (440.0 * 2 ** (-9 * 1.0 / 12.0)), 0, false)
        , new Sound("2", (440.0 * 2 ** (-8 * 1.0 / 12.0)), 0, false)
        , new Sound("w", (440.0 * 2 ** (-7 * 1.0 / 12.0)), 0, false)
        , new Sound("3", (440.0 * 2 ** (-6 * 1.0 / 12.0)), 0, false)
        , new Sound("e", (440.0 * 2 ** (-5 * 1.0 / 12.0)), 0, false)
        , new Sound("r", (440.0 * 2 ** (-4 * 1.0 / 12.0)), 0, false)
        , new Sound("5", (440.0 * 2 ** (-3 * 1.0 / 12.0)), 0, false)
        , new Sound("t", (440.0 * 2 ** (-2 * 1.0 / 12.0)), 0, false)
        , new Sound("6", (440.0 * 2 ** (-1 * 1.0 / 12.0)), 0, false)
        , new Sound("y", (440.0 * 2 ** (0 * 1.0 / 12.0)), 0, false)
        , new Sound("7", (440.0 * 2 ** (1 * 1.0 / 12.0)), 0, false)
        , new Sound("u", (440.0 * 2 ** (2 * 1.0 / 12.0)), 0, false)
        , new Sound("i", (440.0 * 2 ** (3 * 1.0 / 12.0)), 0, false)
    ]

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
        if (sounds[i].key == event.key) {
            sounds[i].isOn = (event.type) == ("keydown")
        }
    }
}

// keyboard
function isKeyOn(key, sounds) {
    for (let i = 0; i < sounds.length; i++) {
        if (sounds[i].key == key)
            return sounds[i].isOn;
    }
    return false;
}

function draw(sounds) {
    if (document.getElementById("svgKeyboard")) {
        document.getElementById("svgKeyboard").remove();
    }
    document.getElementById("keyboard").
        appendChild(drawKeyboard(sounds));
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
    return n
}


