class Sound {
    constructor(key, freq, volume, isOn, state) {
        this.key = key;
        this.freq = freq;
        this.volume = volume
        this.isOn = isOn
        this.state = state;
    }
}

class ToneColor {
    constructor(attackTime, decayTime, sustainTime, releaseTime, ampModFreq, ampModAmp, phaseModFreq, phaseModAmp) {
        this.attackTime = attackTime;
        this.decayTime = decayTime;
        this.sustainTime = sustainTime;
        this.releaseTime = releaseTime;
        this.ampModFreq = ampModFreq;
        this.ampModAmp = ampModAmp;
        this.phaseModFreq = phaseModFreq;
        this.phaseModAmp = phaseModAmp;
    }
}

class OverTone {
    constructor(name, freqMultiplier, ratio) {
        this.name = name;
        this.freqMultiplier = freqMultiplier;
        this.ratio = ratio;
    }
}

const soundStates = {
    SILENT: 'silent',
    ATTACK: 'attack',
    DECAY: 'decay',
    SUSTAIN: 'sustain',
    RELEASE: 'release'
}

var t = 0;

function createBuffer(bufferLength, sounds, toneColor, overTones, dt) {
    let data = new Array(bufferLength);
    for (let i = 0; i < bufferLength; i++) {
        let sample = 0;
        // mix all sounds
        for (let i = 0; i < sounds.length; i++) {
            let sound = sounds[i];
            let s = 0;
            // adding up overtones
            if(sound.state != soundStates.SILENT) {
                s = addUpOvertones(sound, toneColor, overTones);
            }
            handleASDR(sound, toneColor); // setting sound volume and state
            sample += s * sound.volume;
        }
        // amplitude modulation
        sample *= (1 + toneColor.ampModAmp * Math.sin(toneColor.ampModFreq * 25 * 2 * Math.PI * t));
        data[i] = sample;
        t += dt;
    }
    return data;
}

function addUpOvertones(sound, toneColor, overTones) {
    let wave = 0;
    for (let k = 0; k < overTones.length; k++) {
        if (overTones[k].ratio != 0) {
            wave += overTones[k].ratio *
                Math.sin(
                    overTones[k].freqMultiplier * sound.freq * 2 * Math.PI * t
                    + 2 * toneColor.phaseModAmp
                    * Math.sin(toneColor.phaseModFreq * 25 * 2 * Math.PI * t)
                );
        }
    }
    return wave;
}

function handleASDR(sound, toneColor) {
    switch (sound.state) {
        case soundStates.SILENT:
            if (sound.isOn) {
                sound.state = soundStates.ATTACK;
            }
            break;
        case soundStates.ATTACK:
            sound.volume += 1.0 / (toneColor.attackTime + 0.01) * dt;
            if (sound.volume > 1) {
                sound.state = soundStates.DECAY;
            }
            if (!sound.isOn) {
                sound.state = soundStates.RELEASE;
            }
            break;
        case soundStates.DECAY:
            sound.volume -= 1.0 / (toneColor.decayTime + 0.01) * dt;
            if (sound.volume < toneColor.sustainTime)
                sound.state = soundStates.SUSTAIN;
            if (!sound.isOn)
                sound.state = soundStates.RELEASE;
            break;
        case soundStates.SUSTAIN:
            if (!sound.isOn) {
                sound.state = soundStates.RELEASE;
            }
            break;
        case soundStates.RELEASE:
            sound.volume -= 1.0 / (toneColor.releaseTime + 0.01) * dt;
            if (sound.volume < 0) {
                sound.volume = 0;
                sound.state = soundStates.SILENT;
            }
            break;
    }
}
