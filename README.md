# PumpSense: Acoustic Health Monitoring 🚜

## 📌 Project Overview

In rural agriculture, irrigation pumps are vital. Mechanical failures like clogs or bearing wear lead to expensive downtime. PumpSense uses a smartphone's microphone to detect these failures early by analyzing the pump's "acoustic fingerprint."

## 🧮 The Calculus Solution

The core of this app is built on **Fourier Analysis.**

- **Fourier Series**: We represent the pump's sound as a sum of sine and cosine waves.

- **Integration**: We use the Fourier integral to calculate coefficients ($a_n, b_n$), which tell us the strength of specific frequencies.

- **Harmonic Shifts**: When a pump starts to fail, new high-frequency harmonics appear. We detect these by comparing the current partial sums against a "healthy" baseline.

## 💻 Technical Implementation

This prototype is built using **Python** and the **SciPy** library.

1. **Self-Calibration:** The farmer records a 5-second "Healthy" baseline.

2. **FFT Processing:** We use ```scipy.fft.rfft``` to transform audio into the frequency domain.

3. **Deviation Analysis:** The app calculates the Sum of Squared Errors (SSE) between the baseline and the live recording.

$$\text{Error} = \sum |X_{live}(f) - X_{baseline}(f)|^2$$

4. **Green/Red Logic:** If the error exceeds a set tolerance $\epsilon$, the system flags a mechanical fault.

## 🚀 Getting Started
**Dependencies**: ```numpy```, ```scipy```, ```matplotlib```

**Usage**: Run the Jupyter notebook to simulate the calibration and testing phases.