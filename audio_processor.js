const PERCENTAGE_MINMAX = 0.05;
const LOWER_THRESHOLD = -1.0;

class SpinAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  // Static getter to define AudioParam objects in this custom processor.
  static get parameterDescriptors() {
    return [{
      name: 'upper_threshold',
      defaultValue: 0.8,
    },
    {
      name: 'lower_threshold',
      defaultValue: 0.1
    },
    ];
  }

  process(inputList, _outputList, parameters) {
    const samples = inputList[0][0];
    const upper_threshold = parameters.upper_threshold[0];
    const lower_threshold = parameters.lower_threshold[0];

    var high_signals = [];
    var low_signals = [];
    var high = false;
    var low = false;
    for (var i = 0; i < samples.length; i++) {
      const sample = samples[i];

      if (sample > upper_threshold && !high) {
        high = true;
        high_signals.push(currentTime + i / sampleRate);
      } else if (sample < lower_threshold && high) {
        high = false;
      }
      if (sample < -upper_threshold && !low) {
        low = true;
        low_signals.push(currentTime + i / sampleRate);
      } else if (sample > -lower_threshold && low) {
        low = false;
      }
    }

    if (high_signals.length > 0 || low_signals.length > 0) {
      const max = Math.max(...samples);
      this.port.postMessage([high_signals, low_signals, low, max]);
    }

    return true;
  }
}

registerProcessor("spin-audio-processor", SpinAudioProcessor);

