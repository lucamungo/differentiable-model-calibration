# %%
import jax
import jax.numpy as jnp


# %%
def simple_function(x: jnp.ndarray, y: jnp.ndarray) -> jnp.ndarray:
    return x**2 + y


x = jnp.array(1.0, dtype=jnp.float32)
y = jnp.array(4.0, dtype=jnp.float32)

z = simple_function(x, y)

# %%
# Show z's computation graph
jax.make_jaxpr(simple_function)(x, y)

# %%
# Show how the gradient is computed
print("\nGradient computation (w.r.t. x):")
print(jax.make_jaxpr(jax.grad(simple_function, argnums=(0, 1)))(x, y))
# %%
