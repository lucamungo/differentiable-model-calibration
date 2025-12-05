---
title: Differentiable Programming for Model Calibration
layout: cover
transition: none
css: unocss
colorSchema: light
---

<LorenzBackground />

<div class="inline-block bg-white/10 backdrop-blur-sm border border-black/10 rounded-lg p-6">

# Differentiable Programming for Model Calibration

<div class="text-xl mt-2 opacity-50">
Backpropagating Through Dynamical Systems with JAX & NumPyro
</div>

</div>



---

# What You'll Learn Today

<div grid="~ cols-3 gap-8" items-start>

<IconCard icon="i-carbon:pedestrian-family" title="1. Concept" subtitle="Dynamics ↔ Neural nets" variant="feature" color="blue"/>

<IconCard icon="i-carbon:gradient" title="2. Practice" subtitle="JAX autodiff on real ODEs" variant="feature" color="teal"/>

<IconCard icon="i-carbon:chart-error-bar" title="3. Bayesian" subtitle="Uncertainty via VI + NumPyro" variant="feature" color="orange"/>

</div>

---

# What is a Neural Network?

<div grid="~ cols-2 gap-12" items-center>

<ContentCard color="blue" icon="i-carbon:machine-learning-model" title="Universal Function Approximator">

A neural network is a flexible, parameterized function $y = f(x; \theta)$ composed of layers.

- **Structure:** Input $\to$ Hidden Layers $\to$ Output
- **Parameters ($\theta$):** Weights and biases
- **Learning:** Adjust $\theta$ to minimize prediction error

</ContentCard>

<div class="text-center">

$$
y = f_L(\dots f_2(f_1(x)))
$$

<div class="mt-8 opacity-80 text-lg">
It maps <strong>inputs</strong> to <strong>outputs</strong> via a sequence of transformations.
</div>

</div>

</div>

---

# What is a Dynamical System?

<div grid="~ cols-2 gap-12" items-center>

<ContentCard color="teal" icon="i-carbon:time" title="State Evolution">

A dynamical system describes how a state $x(t)$ evolves over time based on a rule.

- **State ($x$):** Variables at time $t$
- **Dynamics:** Differential equation $\dot{x} = F(x, \theta)$
- **Simulation:** Integrating the dynamics over time

</ContentCard>

<div class="text-center">

$$
x(t) \xrightarrow{\text{time step}} x(t+\Delta t)
$$

<div class="mt-8 opacity-80 text-lg">
It maps a <strong>state</strong> to a <strong>future state</strong> via a time-evolution rule.
</div>

</div>

</div>

---

# Dynamical Systems vs Neural Networks

<div grid="~ cols-2 gap-8" items-start>

<ContentCard color="blue" icon="i-carbon:machine-learning-model" title="Neural Network (Feedforward)">

<div class="text-sm leading-relaxed">

$\text{Input: } x_0$ &nbsp;·&nbsp; $\text{Layers: } x_{\ell+1} = f_{\ell}(x_{\ell}; \theta_{\ell})$

$\text{Output: } y = f_L \circ f_{L-1} \circ \dots \circ f_1(x_0)$

</div>

<v-clicks>

- Composition of **differentiable layers** $f_\ell$
- Parameters $\theta = (\theta_1, \dots, \theta_L)$
- Trained by **backpropagation** (reverse-mode autodiff)

</v-clicks>

</ContentCard>

<ContentCard color="teal" icon="i-carbon:function" title="Dynamical System (Time-Stepping)">

<div class="text-sm leading-relaxed">

$\text{State: } x(t)$ &nbsp;·&nbsp; $\text{Dynamics: } x_{t+1} = \Phi(x_t, \theta)$

$\text{Trajectory: } x_T = \underbrace{\Phi \circ \dots \circ \Phi}_{T\ \text{times}}(x_0, \theta)$

</div>

<v-clicks>

- Composition of <b>differentiable time steps</b> $\Phi$
- Parameters $\theta$ (e.g. reaction rates, couplings)
- Can also be trained by <b>backpropagation through time</b>

</v-clicks>

</ContentCard>

</div>

<div class="mt-4 text-center text-lg opacity-85">

<v-click>
From the point of view of autodiff, a <b>deep network</b> and a <b>discrete dynamical system</b> are the same: a long composition of differentiable maps.
</v-click>

</div>

---

# Layer-by-Layer = Time-Step-by-Time-Step

<div grid="~ cols-2 gap-8" items-center>

<ContentCard color="blue" icon="i-carbon:flow" title="Neural Network">

$$x_0 \xrightarrow{f_1} x_1 \xrightarrow{f_2} x_2 \xrightarrow{f_3} \cdots \xrightarrow{f_L} x_L$$

<v-clicks>

- Forward: apply each layer $f_\ell$ in sequence
- Backward: **chain rule in reverse**
- Standard **backpropagation**

</v-clicks>

</ContentCard>

<ContentCard color="teal" icon="i-carbon:time" title="Dynamical System">

$$x_0 \xrightarrow{\Phi} x_1 \xrightarrow{\Phi} x_2 \xrightarrow{\Phi} \cdots \xrightarrow{\Phi} x_T$$

<v-clicks>

- Forward: apply time-step $\Phi$ repeatedly
- Backward: **chain rule in reverse time**
- **Backprop through time** / adjoint method

</v-clicks>

</ContentCard>

</div>

<div class="mt-6 text-center text-xl">

<v-click>

**Same structure, same autodiff algorithm! 😱**

</v-click>

</div>

---

# Introducing JAX

<div grid="~ cols-2 gap-12" items-center>

<ContentCard color="blue" icon="i-logos:jax" title="NumPy on Accelerators">

JAX provides a **NumPy-like API** for differentiable programming.

- Same(ish) syntax as NumPy
- Functional programming paradigm
- Composable function transformations

</ContentCard>

<BlurBox>

<div class="flex flex-col gap-6">
    <div class="flex items-center gap-4">
        <div class="font-mono font-bold text-xl text-blue-400">grad()</div>
        <div>Automatic Differentiation</div>
    </div>
    <div class="flex items-center gap-4">
        <div class="font-mono font-bold text-xl text-teal-400">jit()</div>
        <div>Just-In-Time Compilation</div>
    </div>
    <div class="flex items-center gap-4">
        <div class="font-mono font-bold text-xl text-orange-400">vmap()</div>
        <div>Automatic Vectorization</div>
    </div>
</div>

</BlurBox>

</div>

---

# Introducing JAX

<div grid="~ cols-3 gap-4" items-start>

<ContentCard color="blue" icon="i-carbon:chart-line-smooth" title="grad()">

**Autodiff**

Computes exact gradients via reverse-mode AD.

```python
f = lambda x: x**2
df = grad(f)
print(df(3.0)) # 6.0
```

</ContentCard>

<ContentCard color="teal" icon="i-carbon:flash" title="jit()">

**Compilation**

Compiles functions to XLA kernels for speed.

```python
@jit
def update(x):
    return x - 0.1 * df(x)
```

</ContentCard>

<ContentCard color="orange" icon="i-carbon:layers" title="vmap()">

**Vectorization**

Maps a function over array axes (replaces loops).

<div class="scale-75 origin-top-left w-[133%]">

```python
# Define logic for a SINGLE input
def step(x):
    return x + 0.1 * jnp.sin(x)

# vmap adds a batch dimension!
# Input: (128,) -> Output: (128,)
batch_step = vmap(step)
next_states = batch_step(current_states)
```

</div>

</ContentCard>

</div>

---

# Introducing JAX

<div grid="~ cols-3 gap-6" items-start>

<ContentCard color="blue" icon="i-carbon:gradient" title="grad()">

Get **exact gradients** of any function — no finite differences needed.

```python
grad(loss)(theta)
# returns ∇loss(θ)
```

</ContentCard>

<ContentCard color="teal" icon="i-carbon:flash" title="jit()">

**Compile** your function to optimized machine code (via XLA).

```python
fast_fn = jit(slow_fn)
# 10-100x speedup
```

</ContentCard>

<ContentCard color="orange" icon="i-carbon:replicate" title="vmap()">

**Vectorize** over a batch dimension — no manual loops.

```python
vmap(single_example)
# now works on batches
```

</ContentCard>

</div>

<div class="mt-8 text-center text-lg">

These transforms **compose**: `jit(vmap(grad(loss)))` compiles a batched gradient computation.

</div>

---

# JAX on a Dynamical System

<div grid="~ cols-2 gap-8" items-start>

<div class="text-sm">

```python
import jax.numpy as jnp
from jax import grad, jit

def step(x, theta, dt):
    # Example: x' = F(x, theta)
    dx = F(x, theta)
    return x + dt * dx  # Euler step

def simulate(x0, theta, dt, T):
    x = x0
    for _ in range(T):
        x = step(x, theta, dt)
    return x

@jit
def loss(theta, x0, target):
    xT = simulate(x0, theta, dt=0.01, T=1000)
    return jnp.sum((xT - target)**2)

grad_loss = grad(loss)
```

</div>

<div class="flex flex-col justify-center h-full">

<ContentCard color="blue" icon="i-carbon:flow" title="Key Insight">

- The **entire simulation** is one differentiable function

- `grad(loss)` gives $\nabla_\theta L$ via backprop through the whole trajectory

- With gradients, we can use **gradient descent** to optimize $\theta$ 🚀

- We will show an example for the **Lotka–Volterra calibration**

- A caveat: JAX is *great*, but I would recommend reading [the sharp bits](https://docs.jax.dev/en/latest/notebooks/Common_Gotchas_in_JAX.html) before using it.

</ContentCard>

</div>

</div>

---
layout: default
---

<div class="absolute inset-0 z--1">
  <img src="/mercato-ancona.png" class="w-full h-full object-cover opacity-90" />
</div>

<div class="inline-block bg-black/60 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20 mb-4 text-white">

# Example: Lotka–Volterra Dynamics

</div>

<div grid="~ cols-2 gap-8">

<div class="bg-black/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-white">

<div class="flex items-center gap-3 mb-4">
<div class="i-carbon:function text-2xl text-blue-400"></div>
<span class="text-lg font-bold">The Model</span>
</div>

$$
\begin{aligned}
\dot x &= \underbrace{\alpha x}_{\text{growth}} - \underbrace{\beta xy}_{\text{predation}} \\\\[1em]
\dot y &= \underbrace{-\gamma y}_{\text{death}} + \underbrace{\delta xy}_{\text{feeding}}
\end{aligned}
$$

<div class="mt-4 flex flex-col gap-2">
<div class="flex items-center gap-3">
<div class="i-carbon:circle-filled text-lg text-teal-400"></div>
<div><b>x</b> — Prey (Rabbits)</div>
</div>
<div class="flex items-center gap-3">
<div class="i-carbon:circle-filled text-lg text-orange-400"></div>
<div><b>y</b> — Predators (Foxes)</div>
</div>
</div>

</div>

<div class="bg-black/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-white flex flex-col justify-center gap-4">

<div class="flex items-center gap-4">
<div class="i-carbon:growth text-3xl text-teal-400"></div>
<div><b>Prey grow</b> exponentially in absence of predators</div>
</div>

<div class="flex items-center gap-4">
<div class="i-carbon:subtract-alt text-3xl text-orange-400"></div>
<div><b>Predators eat prey</b>, reducing prey population</div>
</div>

<div class="flex items-center gap-4">
<div class="i-carbon:increase-level text-3xl text-orange-400"></div>
<div><b>Predators grow</b> only when food is available</div>
</div>

<div class="flex items-center gap-4">
<div class="i-carbon:renew text-3xl text-blue-400"></div>
<div><b>Result:</b> Cyclic oscillations</div>
</div>

</div>

</div>

---
layout: center
class: text-center
---

<SpinnerBackground />

<div class="inline-block bg-black/5 backdrop-blur-[1px] border border-black/10 rounded-lg px-8 py-6">

# Part I: Live Coding Block
## Gradient Descent on Lotka–Volterra (Deterministic)

</div>

---
layout: center
class: text-center
---

<GameOfLifeBackground />

<div class="inline-block bg-white/40 backdrop-blur-md border border-black/10 rounded-lg px-8 py-6">

<h1 class="!text-4xl !mb-2">Part II: From Deterministic to Probabilistic</h1>
<h2 class="!text-xl !font-normal !opacity-70">Introducing Uncertainty + Variational Inference</h2>

</div>

---

# Why Point Estimates Are Not Enough

<div grid="~ cols-2 gap-12" items-center>

<ContentCard color="orange" icon="i-carbon:warning-alt" title="Real data is noisy">

- Measurement error
- Model misspecification
- Multiple parameter sets may fit equally well

</ContentCard>

<ContentCard color="blue" icon="i-carbon:chart-error-bar" title="We Need">

**Uncertainty Quantification**

Error bars, credible intervals, posterior distributions

</ContentCard>

</div>

---

# Bayesian Inference

**Goal:** Compute posterior

$$p(\theta \mid \text{data})$$ 

**Difficult because:**
- Nonlinear ODE
- High-dimensional posterior
- Likelihood expensive to compute

---

# Variational Inference (Intuition)

**Idea:** Approximate the posterior

1. Choose a flexible family $q(\theta)$
2. Optimize $q$ to be close to true posterior
3. Use gradients (**JAX autodiff!**) to optimize

**Obtain:**
- Uncertainty estimates
- Credible intervals
- Posterior distributions

---

# The ELBO

**Evidence Lower Bound**

- Balance between fitting data & staying close to prior
- Gives smooth, stable optimization
- **VI = optimization problem**
- Perfect match with differentiable programming

---
layout: center
class: text-center
---

# Part III: NumPyro for Bayesian Inference

---

# Why NumPyro?

<div grid="~ cols-2 gap-12" items-center>

<ContentCard color="blue" icon="i-carbon:machine-learning-model" title="NumPyro">

- Probabilistic programming library
- Built on **JAX**
- High performance VI & MCMC
- Autodiff + JIT-enabled

</ContentCard>

<ContentCard color="teal" icon="i-carbon:code" title="Syntax">

Very concise modeling syntax

Define models declaratively, inference is automatic

</ContentCard>

</div>

---

# NumPyro Model for Lotka–Volterra

```python
def model(data):
    alpha  = numpyro.sample("alpha", dist.LogNormal(0,1))
    beta   = numpyro.sample("beta",  dist.LogNormal(0,1))
    gamma  = numpyro.sample("gamma", dist.LogNormal(0,1))
    delta  = numpyro.sample("delta", dist.LogNormal(0,1))

    x_sim = solve_lv(alpha, beta, gamma, delta)

    numpyro.sample("obs", dist.Normal(x_sim, 0.1), obs=data)
```

Clean. Expressive. Differentiable.

---

# VI in NumPyro (SVI)

```python
from numpyro.infer import SVI, Trace_ELBO, AutoNormal

guide = AutoNormal(model)  # variational family
svi = SVI(model, guide, optim.Adam(1e-2), loss=Trace_ELBO())

results = svi.run(rng_key, num_steps=3000, data=data)
params = results.params
```

That’s it.

---

# Posterior Results

<div grid="~ cols-2 gap-12" items-center>

<ContentCard color="blue" icon="i-carbon:analytics" title="What We Get">

- Parameter posterior distributions
- True parameter markers
- Trajectory uncertainty bands

</ContentCard>

<ContentCard color="teal" icon="i-carbon:trophy" title="Outcome">

We now have **error bars**, **uncertainty**, and **interpretability**.

</ContentCard>

</div>

---
layout: center
class: text-center
---

# Part IV: Big Picture & Extensions

---

# Where This Applies

<div class="text-center mb-6 text-lg opacity-80">Differentiable programming is everywhere</div>

<div grid="~ cols-3 gap-6">

<IconCard variant="feature" icon="i-carbon:ai-results" title="Neural ODEs" color="blue" />
<IconCard variant="feature" icon="i-carbon:function" title="PINNs" color="blue" />
<IconCard variant="feature" icon="i-carbon:earth-filled" title="Climate Models" color="teal" />
<IconCard variant="feature" icon="i-carbon:bot" title="Robotics & Control" color="teal" />
<IconCard variant="feature" icon="i-carbon:chemistry" title="Materials Science" subtitle="JAX-MD" color="orange" />
<IconCard variant="feature" icon="i-carbon:chart-network" title="Economics & ABMs" color="blue" />

</div>

---

# Key Messages

<div grid="~ cols-2 gap-8" mt-4>

<IconCard variant="feature" icon="i-carbon:function" title="Dynamical Systems" subtitle="Are just differentiable functions" color="blue" />
<IconCard variant="feature" icon="i-carbon:growth" title="Autodiff" subtitle="Allows backprop through simulations" color="blue" />
<IconCard variant="feature" icon="i-carbon:chart-line-smooth" title="Gradient Descent" subtitle="Gives point estimates" color="teal" />
<IconCard variant="feature" icon="i-carbon:chart-error-bar" title="Variational Inference" subtitle="Gives uncertainty (via NumPyro)" color="teal" />

</div>

---

# Resources & Next Steps

<div grid="~ cols-2 gap-12" items-center>

<ContentCard color="blue" icon="i-carbon:document" title="Resources">

- JAX tutorials
- NumPyro documentation
- Your blog post
- Jupyter notebook for this lecture

</ContentCard>

<ContentCard color="teal" icon="i-carbon:code" title="Try It Yourself">

Modify the LV model:
- Add noise
- Change priors
- Try different optimizers

</ContentCard>

</div>

---
layout: center
---

# Q&A

<div text-center mt-8>
Questions?
</div>
