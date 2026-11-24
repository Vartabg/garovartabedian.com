/**
 * Exact analytic exponential velocity integration & deterministic dt-driven input buffering
 * shared across 2D playable stories.
 */

export interface VelocityStep {
  v: number;
  dx: number;
}

/**
 * Integrates `dv/dt = accelRate * (target - v)` analytically over `dt`.
 * - Mathematically exact under arbitrary frame-rate subdivision (30 Hz vs 120 Hz agrees within < 1e-12) for constant `target`.
 * - Cancels opposing momentum immediately on direction reversal (`v * target < 0`) for crisp, zero-slide turnaround feel.
 */
export function integrateVelocity(v: number, target: number, accelRate: number, dt: number): VelocityStep {
  if (!Number.isFinite(dt) || dt <= 0) return { v, dx: 0 };
  const startV = v * target < 0 ? 0 : v;
  if (!Number.isFinite(accelRate) || accelRate <= 0) {
    return { v: target, dx: target * dt };
  }
  const e = Math.exp(-accelRate * dt);
  const nextV = target + (startV - target) * e;
  const dx = target * dt + ((startV - target) * (1 - e)) / accelRate;
  return {
    v: Math.abs(nextV) < 1e-9 && target === 0 ? 0 : nextV,
    dx,
  };
}

export interface ActionBuffer {
  arm: () => void;
  clear: () => void;
  isArmed: () => boolean;
  tick: (dt: number, tryImmediate: () => boolean, onExpire?: () => void) => boolean;
}

/**
 * Deterministic simulation-dt action input buffer (default 140 ms).
 * Pauses cleanly when simulation pauses and clears cleanly on reset/phase change.
 */
export function createActionBuffer(windowSec = 0.14): ActionBuffer {
  let remaining = 0;

  return {
    arm() {
      remaining = Math.max(0, windowSec);
    },
    clear() {
      remaining = 0;
    },
    isArmed() {
      return remaining > 0;
    },
    tick(dt, tryImmediate, onExpire) {
      if (remaining <= 0) return false;
      if (tryImmediate()) {
        remaining = 0;
        return true;
      }
      if (Number.isFinite(dt) && dt > 0) {
        remaining -= dt;
      }
      if (remaining <= 0) {
        remaining = 0;
        onExpire?.();
      }
      return false;
    },
  };
}
