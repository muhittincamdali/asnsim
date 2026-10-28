/** A scenario step the simulation cannot play, such as a renewal before any subscription. */
export class SimulationError extends Error {
  override name = 'SimulationError';
}
