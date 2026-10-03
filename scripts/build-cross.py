"""
Build the Spatial version's wireframe geometry — an Armenian flared (pattée)
cross — in Blender, headless, and export its vertices + edges as JSON.

Pipeline (Blender -> web), CSP-safe: the output is plain JSON consumed by the
existing zero-dependency canvas renderer; no 3D library ships to the browser.

Run:
  /Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/build-cross.py

Output:
  src/app/_components/versions/cross-geometry.json
"""

# pyright: reportMissingImports=false
# (bmesh/bpy resolve only inside Blender's bundled Python, not the repo env.)
import bmesh
import bpy
import json
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "src/app/_components/versions/cross-geometry.json"

# Pattée cross profile (XY): arms narrow at the centre, flare wider at the tips.
C = 0.30   # half-width where an arm meets the centre
T = 0.60   # half-width at the flared tip
L = 1.00   # centre -> tip length
DEPTH = 0.26  # extrusion depth (Z)

# Outline, clockwise from the top arm's inner-left corner. 12 unique points
# (shared inner corners, no duplicates) -> a clean, readable flared cross.
OUTLINE = [
    (-C,  C), (-T,  L), ( T,  L),   # top arm (left base, two flared tips)
    ( C,  C), ( L,  T), ( L, -T),   # right arm
    ( C, -C), ( T, -L), (-T, -L),   # bottom arm
    (-C, -C), (-L, -T), (-L,  T),   # left arm
]


def main() -> None:
    # Empty scene.
    bpy.ops.wm.read_factory_settings(use_empty=True)

    mesh = bpy.data.meshes.new("cross")
    obj = bpy.data.objects.new("cross", mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()
    verts = [bm.verts.new((x, y, 0.0)) for (x, y) in OUTLINE]
    face = bm.faces.new(verts)

    # Extrude the front face back along Z to give the cross depth.
    geom = bmesh.ops.extrude_face_region(bm, geom=[face])
    moved = [e for e in geom["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=moved, vec=(0.0, 0.0, DEPTH))

    # Centre on Z so it rotates about its middle.
    for v in bm.verts:
        v.co.z -= DEPTH / 2.0

    bm.to_mesh(mesh)
    bm.free()

    raw_verts = [[round(v.co.x, 4), round(v.co.y, 4), round(v.co.z, 4)] for v in mesh.vertices]
    # Dedup edges (front n-gon, back n-gon, and the side connectors).
    edge_set = set()
    for e in mesh.edges:
        a, b = e.vertices[0], e.vertices[1]
        edge_set.add((min(a, b), max(a, b)))
    edges = sorted(edge_set)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {
                "name": "armenian-pattee-cross",
                "source": "scripts/build-cross.py (Blender)",
                "vertices": raw_verts,
                "edges": [[a, b] for (a, b) in edges],
            },
            indent=0,
        )
    )
    print(f"[build-cross] wrote {len(raw_verts)} verts, {len(edges)} edges -> {OUT}")


if __name__ == "__main__":
    main()
