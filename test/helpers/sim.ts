import { buildParts, type NotificationParts } from '../../src/sim/payloads.js';
import { type SimulatedEvent, Simulation } from '../../src/sim/simulation.js';
import { standaloneSteps } from '../../src/sim/standalone.js';
import type { StepInput } from '../../src/sim/step.js';
import { DEFAULT_APP } from '../../src/workspace.js';

export const START = new Date('2026-10-01T09:00:00Z');

/** A simulation with a fixed start and seed, so its output can be compared with snapshots. */
export function simulation(options: Partial<ConstructorParameters<typeof Simulation>[0]> = {}) {
  return new Simulation({ app: DEFAULT_APP, start: START, seed: 'asnsim-tests', ...options });
}

/** Plays `steps` and returns each event with its decoded payloads. */
export function play(
  steps: StepInput[],
  sim = simulation(),
): { sim: Simulation; events: SimulatedEvent[]; parts: NotificationParts[] } {
  const events = steps.map((step) => sim.apply(step));
  return { sim, events, parts: events.map((event) => buildParts(sim, event)) };
}

/** The decoded payloads of the one notification `asnsim send <type> [subtype]` would send. */
export function standalone(type: string, subtype?: string | null, sim = simulation()) {
  const { steps } = standaloneSteps(type, subtype);
  const result = play(steps, sim);
  const last = result.parts.at(-1);
  if (!last) throw new Error('no event');
  return { ...result, last };
}
