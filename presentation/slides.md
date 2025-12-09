---
title: Differentiable Programming for Model Calibration
layout: cover
transition: none
css: unocss
colorSchema: light
fonts:
  sans: Newsreader
  serif: Newsreader
---

<RestartOnEnter><LorenzBackground :speed="50" :trailLength="11000" /></RestartOnEnter>

<div class="inline-block bg-white/10 backdrop-blur-sm border border-black/10 rounded-lg p-6">

# Differentiable Programming for Model Calibration

<div class="text-xl mt-2 opacity-50">
Backpropagating Through Dynamical Systems with JAX & NumPyro
</div>

</div>

---

# Introduction

<div grid="~ cols-2 gap-10" items-start>

<ContentCard color="blue" icon="i-carbon:user-avatar" title="Luca Mungo">

- **Researcher** at Macrocosm
- Trained as a **Physicist** (Complex Systems)
- **PhD** at Oxford — Network Theory in Economics
- Current focus: **Agent-Based Models** and their **Calibration**

</ContentCard>

<ContentCard color="teal">

<img src="/MACROCOSM_NAME_BLCK.png" class="h-6 mb-4" />

Novel economic models leveraging advancements in **data** and **computing**. The company's motto is "A better economics for a better world".

<div class="mt-5 flex items-center gap-5">
<img src="/making-sense-of-chaos.jpg" class="h-32 rounded shadow" />
<div class="text-sm opacity-80">
... and this book gives an overview of the company's work.
</div>
</div>

</ContentCard>

</div>

<div class="mt-8 flex items-center justify-center gap-2 text-base opacity-60">
<div class="i-carbon:link text-blue-500"></div>
<a href="https://lmungo.xyz" class="text-blue-500 hover:underline">lmungo.xyz</a>
</div>
---

# Outline

<RestartOnEnter><SpirographBackground /></RestartOnEnter>

<div class="flex flex-col gap-3 mt-6">

<div class="px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">
<span class="font-bold mr-2">1.</span> Dynamical Systems, Neural Networks, and Differentiable Programming
</div>

<div class="px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">
<span class="font-bold mr-2">2.</span> JAX
</div>

<div class="px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">
<span class="font-bold mr-2">3.</span> Live Coding I
</div>

<div class="px-4 py-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-900">
<span class="font-bold mr-2">4.</span> Uncertainty, Variational Inference, NumPyro
</div>

<div class="px-4 py-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-900">
<span class="font-bold mr-2">5.</span> Live Coding II
</div>

</div>

---
layout: center
class: text-center
---

<RestartOnEnter><LorenzBackground /></RestartOnEnter>

<div class="inline-block bg-white/40 backdrop-blur-sm border border-black/10 rounded-lg px-8 py-6">

# Part I: Dynamical Systems, Neural Networks, and Differentiable Programming

</div>

---

# What is a Neural Network?

<div grid="~ cols-2 gap-8" items-center>

<div>

<ContentCard color="blue" icon="i-carbon:machine-learning-model" title="A Parametrized Differentiable Function">

A neural network is a flexible, parameterized function $y = f(x; \theta)$ composed of layers.

- **Structure:** Input $\to$ Hidden Layers $\to$ Output
- **Parameters ($\theta$):** Weights and biases
- **Learning:** Adjust $\theta$ to minimize prediction error

</ContentCard>

<div class="mt-4 text-center">

<div class="inline-block bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">

$y = f_L(\dots f_2(f_1(x)))$

<div class="mt-2 opacity-70 text-sm">
Maps <strong>inputs</strong> to <strong>outputs</strong> via transformations.
</div>

</div>

</div>

</div>

<div class="flex justify-center">
<NeuralNetworkDiagram :inputNodes="4" :hiddenLayers="[5, 5]" :outputNodes="4" :nodeRadius="16" :layerSpacing="85" :nodeSpacing="42" />
</div>

</div>

---

# What is a Dynamical System?

<div grid="~ cols-2 gap-8" items-center>

<div>

<ContentCard color="teal" icon="i-carbon:time" title="Parametrised Time-Evolution">

A dynamical system describes how a state $x(t)$ evolves over time based on a rule.

- **State ($x$):** Variables at time $t$
- **Dynamics:** Differential equation $\dot{x} = F(x, \theta)$
- **Simulation:** Integrating the dynamics over time

</ContentCard>

<div class="mt-4 text-center">

<div class="inline-block bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">

$x_N = \Phi(x_{N-1}, \theta) = \Phi^N(x_0, \theta)$

<div class="mt-2 opacity-70 text-sm">
Maps a <strong>state</strong> to a <strong>future state</strong> via time evolution.
</div>

</div>

</div>

</div>

<div class="flex justify-center">
<DynamicalSystemDiagram :width="340" :height="280" />
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
layout: center
class: text-center
---

<SpinnerBackground />

# Part II: JAX

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

<WireframeShapesBackground />

<div class="inline-block bg-black/5 backdrop-blur-[1px] border border-black/10 rounded-lg px-8 py-6">

# Part III: Live Coding Block
## Gradient Descent on Lotka–Volterra

</div>

---

# Gradient Descent on Lotka-Volterra

<div class="h-[400px] w-full overflow-hidden bg-white rounded-xl border border-black/10">
<AutoReloadIframe src="/figures/trajectory_animation.html" class="w-full h-full" />
</div>

---
layout: center
class: text-center
---

<RestartOnEnter><GameOfLifeBackground /></RestartOnEnter>

<div class="inline-block bg-white/40 backdrop-blur-md border border-black/10 rounded-lg px-8 py-6">

<h1 class="!text-4xl !mb-2">Part IV: From Deterministic to Probabilistic</h1>
<h2 class="!text-xl !font-normal !opacity-70">Introducing Uncertainty + Variational Inference</h2>

</div>

---

# Why Point Estimates Are Not Enough

<div grid="~ cols-2 gap-12" items-center>

<ContentCard color="orange" icon="i-carbon:warning-alt" title="Real data is messy">

- Observations contain **noise**
- Models are always **approximations**
- Different parameter sets can explain data **equally well**

</ContentCard>

<ContentCard color="blue" icon="i-carbon:chart-error-bar" title="We Need More Than a Single Best Fit">

To reason scientifically we need:

- **Uncertainty estimates**
- **Credible intervals**
- **Posterior distributions**
- Ability to ask:  
  *“How confident are we in these parameters?”*

</ContentCard>

</div>

---

# Bayesian Inference

<div grid="~ cols-2 gap-10" items-center>

<div>

Given parameters $\theta$ and observed data $\bar{x}$, Bayes' rule tells us:

<div class="bg-orange-50/80 border-2 border-orange-200 rounded-xl py-5 px-4 text-center">

$$
\underbrace{p(\theta | \bar{x})}_{\text{posterior}} = \frac{\overbrace{p(\bar{x} | \theta)}^{\text{likelihood}} \cdot \overbrace{p(\theta)}^{\text{prior}}}{\underbrace{p(\bar{x})}_{\text{evidence}}}
$$

</div>

But for complex models, the posterior is <strong>infeasible to compute</strong> — we need <strong>approximate</strong> inference.

</div>

<div class="flex flex-col gap-2">

<ContentCard color="blue" icon="i-carbon:result" title="Posterior" :fullHeight="false">

$p(\theta | \bar{x})$ — What we want: beliefs after seeing data

</ContentCard>

<ContentCard color="teal" icon="i-carbon:chart-line-data" title="Likelihood" :fullHeight="false">

$p(\bar{x} | \theta)$ — How well parameters explain the data

</ContentCard>

<ContentCard color="purple" icon="i-carbon:idea" title="Prior" :fullHeight="false">

$p(\theta)$ — Our beliefs before seeing data

</ContentCard>

</div>

</div>

---

# Variational Inference
##

Instead of computing the posterior exactly, assume it comes from a family $\mathcal{Q}$ of approximate densities:

$$
\mathcal{Q} = \{ q(\theta; \phi) \mid \phi \in \mathbb{R}^p \}
$$

Then **optimize** the parameters $\phi$ so that:

$$
q(\theta; \phi) \approx p(\theta \,|\, \bar{x})
$$

<div grid="~ cols-2 gap-8 mt-4">

<div>

<div v-click="1">

- Turn inference into an **optimization problem**

</div>

<div v-click="2">

- For optimization, we can use **gradient descent**

</div>

<div v-click="3">

- Perfect match for **JAX autodiff**!

</div>

</div>

<div v-click="4">

<ContentCard color="teal" icon="i-carbon:function" title="Example: Gaussian Family">

A common choice is a multivariate Gaussian:

$$
\mathcal{Q} = \left\{ \mathcal{N}(\mu, \Sigma) \mid \mu \in \mathbb{R}^d, \Sigma \succ 0 \right\}
$$

We optimize $\mu$ and $\Sigma$ to approximate the posterior.

</ContentCard>

</div>

</div>

---

# The Evidence Lower Bound (ELBO)
## 

Concretely, our goal is to find the $q \in \mathcal{Q}$ that **minimizes the KL divergence** to the exact posterior,
$$
q^*(\theta) = \arg\min_{q \in \mathcal{Q}} \operatorname{KL}\left(q \,\|\, p(\theta|\bar{x})\right)
$$

 A bit of algebra shows this is equivalent to **maximizing the Evidence Lower Bound**:

$$
 \operatorname{ELBO}(q) = \arg\max_{q \in \mathcal{Q}} \underbrace{\mathbb{E}_q[\log p(\bar{x}| \theta)]}_{\text{expected log-likelihood}} - \underbrace{\operatorname{KL}(q\|p(\theta))}_{\text{prior regularization}}
$$

<div grid="~ cols-2 gap-6" class="mt-6">

<ContentCard color="blue" icon="i-carbon:chart-line-data" title="Loss Function">

Maximize $\mathbb{E}_q[\log p(\bar{x}| \theta)]$ — encourage parameters that explain observations well.

</ContentCard>

<ContentCard color="purple" icon="i-carbon:shield-check" title="Regularization term">

Minimize $\operatorname{KL}(q \| p)$ — keeps the posterior close to the prior.

</ContentCard>

</div>

---

# What We Get from VI

<div grid="~ cols-2 gap-12" items-center>

<ContentCard color="blue" icon="i-carbon:analytics" title="Posterior Insights">

- Means and variances of each parameter  
- Joint correlations  
- Posterior samples  
- Predictive distributions  

</ContentCard>

<ContentCard color="teal" icon="i-carbon:chart-multitype" title="Uncertainty in Dynamics">

- Uncertainty bands on trajectories  
- Robust estimates under noisy data  
- Sensitivity analysis  
- Full probabilistic calibration  

</ContentCard>

</div>

---

# NumPyro: Probabilistic Programming on JAX

<div grid="~ cols-2 gap-10" items-start>

<ContentCard color="blue" icon="i-carbon:cube" title="What is Probabilistic Programming?">

Write statistical models as **ordinary programs**:

- Describe **uncertain quantities** with distributions
- Describe **how data is generated**
- The system automatically performs **inference**

Separates *modeling* from *inference*.

</ContentCard>

<ContentCard color="teal" icon="i-carbon:machine-learning-model" title="What is NumPyro?">

A **probabilistic programming library built on JAX**.

- **Variational Inference** — scalable, gradient-based
- **MCMC** (NUTS, HMC) — for exact posteriors
- **GPU/TPU acceleration** out of the box
- Code that looks **very close to the math**

Perfect for **differentiable simulators** like our ODE models.

</ContentCard>

</div>

---

# How It Works in Practice

<div grid="~ cols-2 gap-6">

<div class="text-sm">

```python
import numpyro
import numpyro.distributions as dist
from numpyro.infer import SVI, Trace_ELBO
from numpyro.infer.autoguide import AutoNormal

# 1. Define the model
def model(observations=None):
    # Prior
    theta = numpyro.sample("theta",
        dist.Normal(0, 1))

    # Likelihood
    numpyro.sample("obs",
        dist.Normal(theta, 0.1),
        obs=observations)

# 2. Run variational inference
guide = AutoNormal(model)
svi = SVI(model, guide,
          optim.Adam(0.01), Trace_ELBO())

svi_result = svi.run(rng_key, 1000,
                     observations=data)
```

</div>

<div class="flex flex-col gap-3">

<ContentCard color="blue" icon="i-carbon:code" title="1. Define Model" :fullHeight="false">

Use `numpyro.sample()` to declare priors and likelihoods — just like writing the math.

</ContentCard>

<ContentCard color="teal" icon="i-carbon:function" title="2. Choose a Guide" :fullHeight="false">

`AutoNormal` automatically creates a Gaussian variational family $\mathcal{Q}$.

</ContentCard>

<ContentCard color="purple" icon="i-carbon:play" title="3. Run SVI" :fullHeight="false">

`svi.run()` optimizes the ELBO using gradient descent — all autodiffed by JAX.

</ContentCard>

</div>

</div>

---
layout: center
class: text-center
---

<!-- <BouncingBallsBackground :ballCount="80" :ballRadius="10"/> -->
  <MokaPotBackground :pots="[
    { posX: 0.5, posY: 0.5, scale: 200, rotationSpeedZ: 0.01, rotationSpeedY: 0.02, initialAngleY: 0, lidAnimationSpeed: 0.02 }
  ]" />

<div class="inline-block bg-white/40 backdrop-blur-sm border border-black/10 rounded-lg px-8 py-6">

# Part V: Live Coding Block
## Variational Inference on Lotka-Volterra

</div>

---

# Variational Inference on Lotka-Volterra

<div class="h-[420px] w-full overflow-hidden bg-white rounded-xl border border-black/10">
<AutoReloadIframe src="/figures/numpyro_svi_animation.html" class="w-full h-full" />
</div>

---
layout: center
---

<RestartOnEnter><GOLMcmBackground seedText="Thank you!" /></RestartOnEnter>

#

  <!-- <PlanetarySystemBackground
    :orbits="[90, 150, 220, 300, 390, 490]"
    :sunRadius="28"
    :planetRadii="[5, 8, 12, 7, 15, 9]"
    :moons="[0, 1, 1, 2, 3, 1]"
    :moonRadius="2.5"
    :eccentricities="[0.1, 0.1, 0.1, 0.1, 0.1, 0.1]"
    :orbitRotations="[0, 0, 25, -15, 10, -30]"
    :rotateX="70"
    :rotateY="5"
    :timeScale="0.8"
  /> -->