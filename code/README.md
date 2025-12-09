# Differentiable Model Calibration with JAX

An introduction to differentiable model calibration using JAX, covering automatic differentiation, dynamical systems, and variational inference.

## Notebooks

1. **1_jax_intro.ipynb** - JAX primer: arrays, JIT compilation, autodiff, vmap
2. **2_lotka_volterra.ipynb** - Parameter estimation with gradient descent on the Lotka-Volterra model
3. **3_numpyro.ipynb** - Variational inference with NumPyro

## Setup

### Using uv (recommended)

First, install uv:

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Or with Homebrew
brew install uv
```

Then set up the project:

```bash
# Create virtual environment and install dependencies
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -e .

# Or in one command
uv sync
```

### Using pip

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

## Running the notebooks

```bash
jupyter lab
```
