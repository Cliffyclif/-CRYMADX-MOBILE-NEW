/**
 * AIVoiceOrb — multi-layer animated orb. Pure CSS animations, no audio bindings.
 * State controls color tint; the parent passes 'idle' | 'listening' | 'thinking' | 'speaking'.
 */

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking'

export function AIVoiceOrb({ state }: { state: OrbState }) {
  return (
    <div className={`orb-wrap ${state}`}>
      <div className="orb-ring" />
      <div className="orb-ring r2" />
      <div className="orb-ring r3" />
      <div className="orb-glow" />
      <div className="orb-core">
        <div className="orb-spec" />
        <div className="orb-spec s2" />
      </div>
    </div>
  )
}
