import type { BVHOptions, MeshBVH } from 'three-mesh-bvh';

declare module 'three' {
  interface BufferGeometry {
    boundsTree?: MeshBVH;
    computeBoundsTree(options?: BVHOptions): MeshBVH;
    disposeBoundsTree(): void;
  }
}
