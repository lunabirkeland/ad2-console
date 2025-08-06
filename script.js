const MIN_RPM = 10;
const MAX_RPM = 300;

const getStoredSettings = () => {
  var settings = JSON.parse(localStorage.getItem('settings'));
  if (!settings) {
    settings = {
      decimals: {
        rpm: 0,
        speed: 1,
        distance: 2,
        energy: 1,
      },
      units: {
        speed: "mph",
        distance: "miles",
        energy: "calories",
      },
      calibration: {
        threshold: 0.5,
      },
    };
  }
  return settings;
};

const setStoredSettings = settings => localStorage.setItem('settings', JSON.stringify(settings));

class Timer {
  constructor() {
    this.last_update = null;
    this.seconds = 0;
    this.spins = 0;
    this.rpm = 0;
    this.speed_mph = 0;
    this.distance_miles = 0;
    this.energy_calories = 0;

    this.threshold_callback = null;

    this.settings = getStoredSettings();
    this.update_scaling();
    this.update_display();

    window.addEventListener('DOMContentLoaded', () => {
      document.getElementById("speed-title").innerText = "Speed (" + this.settings.units.speed + ")";
      document.getElementById("speed-select").value = this.settings.units.speed;
      document.getElementById("speed-decimal-select").value = this.settings.decimals.speed;
      document.getElementById("distance-title").innerText = "Distance (" + this.settings.units.distance + ")";
      document.getElementById("distance-select").value = this.settings.units.distance;
      document.getElementById("distance-decimal-select").value = this.settings.decimals.distance;
      document.getElementById("energy-title").innerText = "Energy (" + this.settings.units.energy + ")";
      document.getElementById("energy-select").value = this.settings.units.energy;
      document.getElementById("energy-decimal-select").value = this.settings.decimals.energy;
      document.getElementById("energy-decimal-select").value = this.settings.decimals.energy;
      document.getElementById("sensitivity-range").value = 1 - this.settings.calibration.threshold;
    });

    document.getElementById("speed-select").oninput = (event) => {
      document.getElementById("speed-title").innerText = "Speed (" + event.target.value + ")";
      this.settings.units.speed = event.target.value;
      this.update_scaling();
      this.update_display();
      setStoredSettings(this.settings);
    }

    document.getElementById("distance-select").oninput = (event) => {
      document.getElementById("distance-title").innerText = "Distance (" + event.target.value + ")";
      this.settings.units.distance = event.target.value;
      this.update_scaling();
      this.update_display();
      setStoredSettings(this.settings);
    }

    document.getElementById("energy-select").oninput = (event) => {
      document.getElementById("energy-title").innerText = "Energy (" + event.target.value + ")";
      this.settings.units.energy = event.target.value;
      this.update_scaling();
      this.update_display();
      setStoredSettings(this.settings);
    }

    document.getElementById("speed-decimal-select").oninput = (event) => {
      this.settings.decimals.speed = event.target.value;
      this.update_display();
      setStoredSettings(this.settings);
    }

    document.getElementById("distance-decimal-select").oninput = (event) => {
      this.settings.decimals.distance = event.target.value;
      this.update_display();
      setStoredSettings(this.settings);
    }

    document.getElementById("energy-decimal-select").oninput = (event) => {
      this.settings.decimals.energy = event.target.value;
      this.update_display();
      setStoredSettings(this.settings);
    }

    document.getElementById("sensitivity-range").oninput = (event) => {
      this.settings.calibration.threshold = 1 - event.target.value;
      this.threshold_callback(this.settings.calibration.threshold);
      setStoredSettings(this.settings);
    }

    setInterval(() => {
      if (this.last_update && audioContext.currentTime - this.last_update < 4.0) {
        this.seconds += 0.250;
        this.update_display();
      }
    }, 250)
  }

  new_spin(time, est_rpm) {
    var delta_seconds = time - this.last_update;
    console.log(delta_seconds);
    var rpm = 60 / delta_seconds;
    if (!this.last_update || delta_seconds > 10) {
      rpm = est_rpm;
      delta_seconds = 60 / rpm;
    }

    this.last_update = time;
    this.rpm = rpm;
    this.spins += 1;
    this.speed_mph = rpm / ( 10 / 3 );
    this.distance_miles += delta_seconds * this.speed_mph / 3600;

    // obtained from https://github.com/nickmomrik/pi-ad2
    // y = 1.035E-4x^2 - 1.605E-3x + 0.022
    // https://jsfiddle.net/nickmomrik/jwcp5eq1/7/
    // (spinTime / 1000) * _.ceil((0.0001035 * Math.pow(rpms, 2)) - (0.001605 * rpms) + 0.022, 3);
    console.log(delta_seconds  + " " + rpm);
    this.energy_calories += delta_seconds * (0.0001035 * Math.pow(rpm, 2) - 0.001605 * rpm + 0.022);
  }

  update_scaling() {
    switch (this.settings.units.speed) {
      case "mph":
        this.speed_scaling = 1;
        break;
      case "km/h":
        this.speed_scaling = 1.609;
        break;
      case "m/s":
        this.speed_scaling = 0.4470;
        break;
    }

    switch (this.settings.units.distance) {
      case "miles":
        this.distance_scaling = 1;
        break;
      case "km":
        this.distance_scaling = 1.609;
        break;
      case "m":
        this.distance_scaling = 1609;
        break;
    }

    switch (this.settings.units.energy) {
      case "calories":
        this.energy_scaling = 1;
        break;
      case "kJ":
        this.energy_scaling = 4.184;
        break;
    }
  }

  update_display() {
    let hours = Math.floor(this.seconds / 3600);
    let minutes = Math.floor((this.seconds - hours * 3600) / 60);
    let seconds = Math.floor(this.seconds - minutes * 60 - hours * 3600);

    if (minutes < 10) {
      minutes = "0" + minutes;
    }
    if (seconds < 10) {
      seconds = "0" + seconds;
    }

    document.getElementById("time").innerText = hours + ":" + minutes + ":" + seconds;
    document.getElementById("rpm").innerText = this.rpm.toFixed(this.settings.decimals.rpm);
    document.getElementById("speed").innerText = (this.speed_scaling * this.speed_mph).toFixed(this.settings.decimals.speed);
    document.getElementById("distance").innerText = (this.distance_scaling * this.distance_miles).toFixed(this.settings.decimals.distance);
    document.getElementById("energy").innerText = (this.energy_scaling * this.energy_calories).toFixed(this.settings.decimals.energy);
    document.getElementById("spins").innerText = this.spins;
  }
}

const timer = new Timer();

const audioContext = new AudioContext();

if (!navigator.getUserMedia)
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

if (navigator.getUserMedia){

  navigator.getUserMedia({audio:true}, 
    function(stream) {
      start_microphone(stream);
    },
    function(e) {
      alert('Error capturing audio.');
    }
  );

} else { alert('getUserMedia not supported in this browser.'); }

async function start_microphone(stream){
  gain_node = audioContext.createGain();

  microphone_stream = audioContext.createMediaStreamSource(stream);
  microphone_stream.connect(gain_node);

  await audioContext.audioWorklet.addModule("audio_processor.js");
  let process_node = new AudioWorkletNode(audioContext, "spin-audio-processor");
  let upper_threshold = process_node.parameters.get("upper_threshold");
  upper_threshold.setValueAtTime(timer.settings.calibration.threshold, 0);
  timer.threshold_callback = (value) => {upper_threshold.setValueAtTime(value, 0)};

  const analyserNode = audioContext.createAnalyser();
  analyserNode.smoothingTimeConstant = 0.01;
  microphone_stream.connect(analyserNode);
  analyserNode.connect(process_node);

  var last_low_signal = null;

  const amplitude_bar = document.getElementById("amplitude-bar");

  process_node.port.onmessage = function(message) {
    const [high_signals, low_signals, still_low, max] = message.data;

    if (high_signals.length > 0) {
      const delta = high_signals[0] - last_low_signal;
      const rpm = 3.75 / delta;
      if (rpm >= MIN_RPM && rpm <= MAX_RPM) {
        timer.new_spin(last_low_signal, rpm);
        last_low_signal = null;
        return;
      }
    }

    for (const low_signal of low_signals) {
      for (const high_signal of high_signals) {
        if (high_signal > low_signal) {
          const delta = high_signals[0] - last_low_signal;
          const rpm = 3.75 / delta;
          if (rpm >= MIN_RPM && rpm <= MAX_RPM) {
            timer.new_spin(last_low_signal, rpm);
            last_low_signal = null;
            return;
          }
        }
      }
    }

    if (low_signals.length > 0 && !still_low) {
      last_low_signal = low_signals[low_signals.length - 1];
    }

    amplitude_bar.style.width = 100 * max + "%";
  };
}
