// Instanced golden sky beacons over the five 1 Enoch stone tablets (2 draw calls total, fog-free for horizon legibility).
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, CylinderGeometry, DoubleSide, DynamicDrawUsage, InstancedMesh, Matrix4, MeshBasicMaterial, OctahedronGeometry, Quaternion, Vector3 } from 'three';
import { TERMINALS } from '@/game/navigation';
import { useGame } from '@/game/store';

const COUNT = TERMINALS.length;
const UNFOUND = new Color('#f2b84b');
const FOUND = new Color('#9e8eb8');
const BEAM_UNFOUND = new Color('#f2b84b');
const BEAM_FOUND = new Color('#9e8eb8');
const UP = new Vector3(0, 1, 0);
const m4 = new Matrix4(), q = new Quaternion(), pos = new Vector3(), scale = new Vector3(1, 1, 1);

/** Pillar top elevation and beam height for each tablet sanctuary (near summit tablet stays low and gentle; distant outer sanctuaries rise into view across the valley). */
function beaconLayout(id: string, y: number): { base: number; height: number; radiusScale: number } {
  if (id === 'hermon-oath-01') return { base: y + 3.45, height: 5.5, radiusScale: 0.48 };
  return { base: 16.5, height: 22, radiusScale: 1 };
}

export default function TabletBeacons() {
  const clock = useRef(0);
  const parts = useMemo(() => {
    const beamGeo = new CylinderGeometry(0.06, 0.22, 1, 12, 1, true);
    const beamMat = new MeshBasicMaterial({
      color: '#ffffff', transparent: true, opacity: 0.22,
      depthWrite: false, fog: false, toneMapped: false, side: DoubleSide,
    });
    const beams = new InstancedMesh(beamGeo, beamMat, COUNT);
    beams.frustumCulled = false;
    beams.instanceMatrix.setUsage(DynamicDrawUsage);

    const crownGeo = new OctahedronGeometry(0.36, 0);
    const crownMat = new MeshBasicMaterial({
      color: '#ffffff', transparent: true, opacity: 0.9,
      depthWrite: false, fog: false, toneMapped: false,
    });
    const crowns = new InstancedMesh(crownGeo, crownMat, COUNT);
    crowns.frustumCulled = false;
    crowns.instanceMatrix.setUsage(DynamicDrawUsage);

    for (let i = 0; i < COUNT; i++) {
      const t = TERMINALS[i], { base, height, radiusScale } = beaconLayout(t.id, t.position.y);
      pos.set(t.position.x, base + height * 0.5, t.position.z);
      q.identity();
      beams.setMatrixAt(i, m4.compose(pos, q, scale.set(radiusScale, height, radiusScale)));
      beams.setColorAt(i, BEAM_UNFOUND);

      pos.set(t.position.x, base + 0.95, t.position.z);
      crowns.setMatrixAt(i, m4.compose(pos, q, scale.set(1, 1.4, 1)));
      crowns.setColorAt(i, UNFOUND);
    }
    beams.instanceMatrix.needsUpdate = true;
    beams.instanceColor!.needsUpdate = true;
    crowns.instanceMatrix.needsUpdate = true;
    crowns.instanceColor!.needsUpdate = true;
    return { beams, crowns, beamGeo, beamMat, crownGeo, crownMat };
  }, []);

  useEffect(() => () => {
    parts.beamGeo.dispose(); parts.beamMat.dispose(); parts.beams.dispose();
    parts.crownGeo.dispose(); parts.crownMat.dispose(); parts.crowns.dispose();
  }, [parts]);

  useFrame((_, delta) => {
    const state = useGame.getState();
    const dt = state.paused ? 0 : Math.min(delta, 0.05);
    if (!state.reduced) clock.current += dt;
    const tClock = clock.current;
    const found = state.discoveredTablets;
    for (let i = 0; i < COUNT; i++) {
      const t = TERMINALS[i], isFound = found.includes(t.id);
      const { base, height, radiusScale } = beaconLayout(t.id, t.position.y);
      const bob = state.reduced || isFound ? 0 : Math.sin(tClock * 1.5 + i * 1.2) * 0.25;
      const beamH = isFound ? height * 0.35 : height;
      pos.set(t.position.x, base + beamH * 0.5, t.position.z);
      q.identity();
      parts.beams.setMatrixAt(i, m4.compose(pos, q, scale.set(radiusScale, beamH, radiusScale)));
      parts.beams.setColorAt(i, isFound ? BEAM_FOUND : BEAM_UNFOUND);

      pos.set(t.position.x, base + 0.95 + bob, t.position.z);
      q.setFromAxisAngle(UP, state.reduced || isFound ? i * 0.5 : tClock * 0.85 + i);
      const s = isFound ? 0.65 : t.id === 'hermon-oath-01' ? 0.82 : 1.15;
      parts.crowns.setMatrixAt(i, m4.compose(pos, q, scale.set(s, s * 1.4, s)));
      parts.crowns.setColorAt(i, isFound ? FOUND : UNFOUND);
    }
    parts.beams.instanceMatrix.needsUpdate = true;
    parts.beams.instanceColor!.needsUpdate = true;
    parts.crowns.instanceMatrix.needsUpdate = true;
    parts.crowns.instanceColor!.needsUpdate = true;
  }, -15);

  return <><primitive object={parts.beams} dispose={null} /><primitive object={parts.crowns} dispose={null} /></>;
}
