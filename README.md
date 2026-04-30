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
### Prerequisites

Ensure you have the following installed:

- **Node.js**
- **pnpm**

### Installation & Setup

1. #### Clone the repository: 

[https://github.com/MichaelMukiibi/pump-health.git](https://github.com/MichaelMukiibi/pump-health.git)

```sh
    git clone https://github.com/MichaelMukiibi/pump-health.git
    cd pump-health
```

2. #### Install dependencies
```bash
    pnpm install
```

3. #### Run  Development Server
```bash
    pnpm dev
```

## Testing and Evaluation

**Usage**: Run the Jupyter notebook to simulate the calibration and testing phases.

**Dependencies**: ```numpy```, ```scipy```, ```matplotlib```

```bash
    pip install numpy scipy matplotlib
```

## Tech Stack
- **Framework**: React + Vite
- **Package Manager**: pnpm
- **Icons**: Lucide React
- **Analysis Engine**: Web Audio API (AnalyserNode)

## Usage
1. **Baseline Calibration**: Start the pump in a known "Healthy" Sate. Click **"Set Baseline"**. The app will record the Fourier coefficients for 3 seconds to create a reference model.
2. **Live Monitoring**: Click **"Start Live Check"**. The app will continuously compare the live sound to the baselien.
3. **Status Indicators**:
    - **Green**: The Fourier spectrum is stable (System Healthy)
    - **Red**: Anomalous harmonics detected (Mechanical Fault)


