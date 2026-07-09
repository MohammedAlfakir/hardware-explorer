import type { HardwareDefinition, HardwareId } from './types';

/**
 * Hardware Library registry. Purely declarative — geometry lives in
 * src/hardware/models/*, systems consume only this metadata. Adding future
 * hardware (PSU, HDD, NVMe, coolers, NICs, capture cards, …) means adding a
 * definition here plus a model component.
 */

export const HARDWARE: Record<HardwareId, HardwareDefinition> = {
  cpu: {
    id: 'cpu',
    name: 'Central Processing Unit',
    shortName: 'CPU',
    category: 'Processing',
    tagline: '16-core desktop processor · LGA package',
    description:
      'The CPU executes program instructions — fetching, decoding and executing billions of operations per second across multiple cores, fed by a hierarchy of on-die caches.',
    bounds: [3.8, 1.4, 3.8],
    parts: [
      {
        id: 'ihs',
        name: 'Integrated Heat Spreader',
        description:
          'A nickel-plated copper lid that spreads heat from the die to the cooler and physically protects the silicon.',
        explodeDir: [0, 1, 0],
        explodeDist: 2.2,
        labelOffset: [1.6, 0.9, -1.2],
        specs: [
          { label: 'Material', value: 'Nickel-plated copper' },
          { label: 'Thickness', value: '2.0 mm' },
        ],
        education:
          'Heat from the tiny die must be spread over a larger area before a cooler can remove it efficiently. Soldered IHS designs transfer heat far better than thermal paste between die and lid.',
      },
      {
        id: 'thermal-paste',
        name: 'Thermal Interface (Solder TIM)',
        description:
          'Indium solder bonding the die to the heat spreader for maximum thermal conductivity.',
        explodeDir: [0, 1, 0],
        explodeDist: 1.55,
        labelOffset: [-1.8, 0.7, 0.6],
        internal: true,
        specs: [{ label: 'Conductivity', value: '~86 W/m·K' }],
      },
      {
        id: 'die',
        name: 'Silicon Die',
        description:
          'The processor itself — billions of transistors patterned into a sliver of monocrystalline silicon.',
        explodeDir: [0, 1, 0],
        explodeDist: 1.1,
        labelOffset: [1.9, 0.5, 1.0],
        internal: true,
        specs: [
          { label: 'Process node', value: '5 nm FinFET' },
          { label: 'Transistors', value: '≈ 13.5 billion' },
          { label: 'Die size', value: '~145 mm²' },
        ],
        education:
          'Dies are cut from 300 mm silicon wafers. Each die contains the cores, cache, memory controllers and I/O fabric.',
      },
      {
        id: 'core-layer',
        name: 'Core Complex',
        description:
          '16 execution cores, each with private L1/L2 caches, arranged in two clusters.',
        explodeDir: [0, 1, 0],
        explodeDist: 0.78,
        labelOffset: [-1.9, 0.35, -1.0],
        internal: true,
        specs: [
          { label: 'Cores / Threads', value: '16 / 32' },
          { label: 'Boost clock', value: '5.7 GHz' },
        ],
        education:
          'Each core is an independent pipeline that fetches, decodes, reorders and executes instructions out of order to hide memory latency.',
      },
      {
        id: 'cache-layer',
        name: 'L3 Cache Array',
        description:
          'A shared 64 MB SRAM last-level cache sitting between the cores and main memory.',
        explodeDir: [0, 1, 0],
        explodeDist: 0.48,
        labelOffset: [1.7, 0.25, -1.5],
        internal: true,
        specs: [
          { label: 'Capacity', value: '64 MB shared L3' },
          { label: 'Latency', value: '~46 cycles' },
        ],
        education:
          'Cache exploits locality: recently used data is kept close to the cores. An L3 hit is ~10× faster than a trip to DRAM.',
      },
      {
        id: 'substrate',
        name: 'Package Substrate',
        description:
          'A multi-layer fiberglass PCB that fans the die’s microscopic bumps out to the socket contacts.',
        explodeDir: [0, -1, 0],
        explodeDist: 0.7,
        labelOffset: [-1.9, 0.1, 1.4],
        specs: [
          { label: 'Layers', value: '12-layer organic' },
          { label: 'Size', value: '40 × 40 mm' },
        ],
      },
      {
        id: 'contact-pads',
        name: 'LGA Contact Pads',
        description:
          '1,718 gold-plated lands that mate with spring pins in the motherboard socket.',
        explodeDir: [0, -1, 0],
        explodeDist: 1.5,
        labelOffset: [1.6, -0.7, 1.5],
        specs: [
          { label: 'Contacts', value: '1,718 lands' },
          { label: 'Plating', value: 'Gold over nickel' },
        ],
        education:
          'LGA (Land Grid Array) moves the fragile pins off the CPU and into the socket, making the chip itself far more robust.',
      },
      {
        id: 'smd-caps',
        name: 'Package Capacitors',
        description:
          'Decoupling capacitors that smooth the power supply during nanosecond-scale current spikes.',
        explodeDir: [0, 1, 0],
        explodeDist: 0.35,
        labelOffset: [-1.4, -0.35, -1.7],
        specs: [{ label: 'Function', value: 'Power decoupling' }],
      },
    ],
    animations: [
      {
        id: 'data-flow',
        name: 'Data Flow',
        description: 'Data streaming from the socket, through cache, into the cores.',
        duration: 6,
      },
      {
        id: 'instruction-pipeline',
        name: 'Instruction Pipeline',
        description: 'Fetch → decode → execute → writeback stages marching in order.',
        duration: 8,
      },
      {
        id: 'core-activity',
        name: 'Core Activity',
        description: 'Per-core load lighting up under a multi-threaded workload.',
        duration: 5,
      },
      {
        id: 'cache-access',
        name: 'Cache Access',
        description: 'Hits served from L3; misses escalating to main memory.',
        duration: 7,
      },
      {
        id: 'clock-pulse',
        name: 'Clock Pulse',
        description: 'The global clock signal synchronizing every core.',
        duration: 3,
      },
      {
        id: 'thermal-flow',
        name: 'Thermal Flow',
        description: 'Heat rising from the die, through solder, into the heat spreader.',
        duration: 6,
      },
    ],
    specs: [
      { label: 'Cores / Threads', value: '16 / 32' },
      { label: 'Base / Boost', value: '4.5 / 5.7 GHz' },
      { label: 'L3 Cache', value: '64 MB' },
      { label: 'TDP', value: '170 W' },
      { label: 'Socket', value: 'LGA-1718' },
      { label: 'Process', value: '5 nm' },
    ],
    highlights: [
      { icon: 'cpu', label: 'Type', value: 'Processor' },
      { icon: 'chip', label: 'Cores / Threads', value: '16 / 32' },
      { icon: 'gauge', label: 'Boost Clock', value: '5.7 GHz' },
      { icon: 'target', label: 'Use Case', value: 'Desktop & Creator' },
    ],
    facts: [
      'A modern CPU can execute over 100 billion instructions per second.',
      'The die is thinner than a human fingernail — about 0.8 mm.',
      'Signals inside the CPU travel a few millimeters in one clock cycle.',
    ],
  },

  gpu: {
    id: 'gpu',
    name: 'Graphics Processing Unit',
    shortName: 'GPU',
    category: 'Processing',
    tagline: 'Dual-axial flagship graphics card · PCIe 5.0 ×16',
    description:
      'The GPU is a massively parallel processor: thousands of small cores execute the same program across millions of pixels and vertices simultaneously, fed by ultra-wide GDDR memory.',
    bounds: [6.6, 2.4, 3.0],
    parts: [
      {
        id: 'fan-1',
        name: 'Axial Fan A',
        description: 'Front axial fan pushing air through the fin stack.',
        explodeDir: [0, 1, 0],
        explodeDist: 2.6,
        labelOffset: [-2.6, 1.6, -1.2],
        specs: [
          { label: 'Diameter', value: '100 mm' },
          { label: 'Max speed', value: '2,450 RPM' },
        ],
      },
      {
        id: 'fan-2',
        name: 'Axial Fan B',
        description: 'Rear flow-through fan exhausting past the short PCB.',
        explodeDir: [0, 1, 0],
        explodeDist: 2.6,
        labelOffset: [2.7, 1.6, -1.2],
      },
      {
        id: 'shroud',
        name: 'Cooler Shroud',
        description: 'Die-cast aluminum housing that ducts airflow across the heatsink.',
        explodeDir: [0, 1, 0],
        explodeDist: 2.0,
        labelOffset: [0.4, 1.7, 1.4],
        specs: [{ label: 'Material', value: 'Die-cast aluminum' }],
      },
      {
        id: 'heatsink',
        name: 'Fin-Stack Heatsink',
        description: 'Hundreds of thin aluminum fins that hand heat to the airflow.',
        explodeDir: [0, 1, 0],
        explodeDist: 1.35,
        labelOffset: [-2.9, 1.0, 1.2],
        specs: [
          { label: 'Fin count', value: '~110 fins' },
          { label: 'Material', value: 'Aluminum' },
        ],
      },
      {
        id: 'heatpipes',
        name: 'Heat Pipes',
        description:
          'Copper pipes with wicking interiors that move heat by evaporating and condensing a working fluid.',
        explodeDir: [0, 1, 0],
        explodeDist: 0.95,
        labelOffset: [2.9, 0.6, 1.3],
        internal: true,
        specs: [{ label: 'Count', value: '6 × 8 mm copper' }],
        education:
          'A heat pipe can move hundreds of times more heat than a solid copper rod of the same size, with almost no temperature gradient.',
      },
      {
        id: 'vapor-chamber',
        name: 'Vapor Chamber',
        description:
          'A flat sealed chamber spreading die heat evenly before it enters the heat pipes.',
        explodeDir: [0, 1, 0],
        explodeDist: 0.62,
        labelOffset: [-2.8, 0.35, -1.3],
        internal: true,
        education:
          'Vapor chambers are two-dimensional heat pipes: liquid evaporates over the die hotspot and condenses across the whole plate.',
      },
      {
        id: 'gpu-die',
        name: 'GPU Die',
        description:
          'The graphics processor — 76 billion transistors of shader cores, RT units and memory controllers.',
        explodeDir: [0, 1, 0],
        explodeDist: 0.4,
        labelOffset: [0.3, 0.55, -1.6],
        internal: true,
        specs: [
          { label: 'CUDA cores', value: '7,168' },
          { label: 'Transistors', value: '45.9 billion' },
          { label: 'Die size', value: '379 mm²' },
        ],
      },
      {
        id: 'vram',
        name: 'GDDR6 Memory',
        description:
          '16 GB of graphics memory in 8 packages ringing the die for the shortest possible traces.',
        explodeDir: [0, 1, 0],
        explodeDist: 0.32,
        labelOffset: [-1.6, 0.5, 1.5],
        internal: true,
        specs: [
          { label: 'Capacity', value: '16 GB GDDR6' },
          { label: 'Bandwidth', value: '672 GB/s' },
          { label: 'Bus width', value: '256-bit' },
        ],
      },
      {
        id: 'mosfets',
        name: 'VRM Power Stages',
        description:
          '24-phase MOSFET power stages converting 12 V down to the ~1 V the die needs, at up to 450 A.',
        explodeDir: [0, 1, 0],
        explodeDist: 0.28,
        labelOffset: [2.2, 0.45, 1.5],
        internal: true,
        specs: [{ label: 'Phases', value: '24 × 70 A stages' }],
      },
      {
        id: 'capacitors',
        name: 'Filter Capacitors',
        description: 'Polymer capacitors smoothing the VRM output rails.',
        explodeDir: [0, 1, 0],
        explodeDist: 0.24,
        labelOffset: [1.4, 0.4, -1.6],
        internal: true,
      },
      {
        id: 'pcb',
        name: 'Printed Circuit Board',
        description:
          'A 14-layer PCB routing thousands of signal and power traces between die, memory and connectors.',
        explodeDir: [0, -1, 0],
        explodeDist: 0.55,
        labelOffset: [-2.9, -0.2, 1.4],
        specs: [{ label: 'Layers', value: '14-layer, 2 oz copper' }],
      },
      {
        id: 'power-connector',
        name: '16-pin Power Connector',
        description: '12VHPWR connector delivering up to 600 W from the PSU.',
        explodeDir: [0.6, 1, 0],
        explodeDist: 0.9,
        labelOffset: [2.9, 0.9, 0.2],
        specs: [{ label: 'Rating', value: '600 W (12VHPWR)' }],
      },
      {
        id: 'pcie-connector',
        name: 'PCIe ×16 Edge Connector',
        description:
          'Gold-plated edge fingers carrying 16 lanes of PCIe 5.0 — 64 GB/s each way.',
        explodeDir: [0, -0.35, 1],
        explodeDist: 1.1,
        labelOffset: [-1.8, -1.0, 0.9],
        specs: [
          { label: 'Interface', value: 'PCIe 5.0 ×16' },
          { label: 'Bandwidth', value: '64 GB/s per direction' },
        ],
      },
      {
        id: 'backplate',
        name: 'Backplate',
        description:
          'A rigid aluminum plate that stiffens the card and passively sinks heat from the PCB rear.',
        explodeDir: [0, -1, 0],
        explodeDist: 1.0,
        labelOffset: [2.4, -0.8, -1.3],
        specs: [{ label: 'Material', value: 'Anodized aluminum' }],
      },
    ],
    animations: [
      {
        id: 'rendering-pipeline',
        name: 'Rendering Pipeline',
        description: 'Vertices → rasterizer → shaders → framebuffer, flowing across the die.',
        duration: 8,
      },
      {
        id: 'memory-transfer',
        name: 'Memory Transfer',
        description: 'Texture data streaming between GDDR packages and the die.',
        duration: 6,
      },
      {
        id: 'shader-execution',
        name: 'Shader Execution',
        description: 'Waves of threads lighting up shader clusters in parallel.',
        duration: 5,
      },
    ],
    specs: [
      { label: 'CUDA cores', value: '7,168' },
      { label: 'Memory', value: '16 GB GDDR6' },
      { label: 'Bandwidth', value: '672 GB/s' },
      { label: 'Board power', value: '285 W' },
      { label: 'Interface', value: 'PCIe 5.0 ×16' },
      { label: 'Outputs', value: '3× DP 2.1 · HDMI 2.1' },
    ],
    highlights: [
      { icon: 'gpu', label: 'Type', value: 'Graphics Card' },
      { icon: 'chip', label: 'CUDA Cores', value: '7,168' },
      { icon: 'ram', label: 'Memory', value: '16 GB GDDR6' },
      { icon: 'target', label: 'Use Case', value: 'Gaming & AI' },
    ],
    facts: [
      'A flagship GPU has more transistors than 5 desktop CPUs combined.',
      'GDDR6 moves data at up to 20 Gb/s on every single pin.',
      'The vapor chamber spreads a 285 W hotspot across the entire card.',
    ],
  },

  ram: {
    id: 'ram',
    name: 'DDR5 Memory Module',
    shortName: 'RAM',
    category: 'Memory',
    tagline: '32 GB DDR5-6400 UDIMM · CL32',
    description:
      'System memory holds the working data of every running program. DDR5 modules transfer data on both clock edges across two independent 32-bit channels per stick.',
    bounds: [4.6, 1.6, 0.6],
    parts: [
      {
        id: 'heat-spreader-front',
        name: 'Heat Spreader (Front)',
        description:
          'Extruded aluminum spreader wicking heat off the DRAM packages.',
        explodeDir: [0, 0, 1],
        explodeDist: 1.3,
        labelOffset: [1.7, 1.1, 0.6],
        specs: [{ label: 'Material', value: 'Anodized aluminum' }],
      },
      {
        id: 'heat-spreader-back',
        name: 'Heat Spreader (Back)',
        description: 'Rear half of the thermal shell, clipped to the front.',
        explodeDir: [0, 0, -1],
        explodeDist: 1.3,
        labelOffset: [-1.9, 1.0, -0.6],
      },
      {
        id: 'memory-chips',
        name: 'DRAM Packages',
        description:
          'Eight 4 GB DDR5 dies. Each stores bits as charge in billions of microscopic capacitors.',
        explodeDir: [0, 1, 0],
        explodeDist: 0.9,
        labelOffset: [2.1, 0.6, 0.35],
        internal: true,
        specs: [
          { label: 'Organization', value: '8 × 4 GB (x8)' },
          { label: 'Speed', value: 'DDR5-6400' },
        ],
        education:
          'DRAM cells leak — every row must be refreshed thousands of times per second or the data literally fades away.',
      },
      {
        id: 'pmic',
        name: 'Power Management IC',
        description:
          'DDR5 moves voltage regulation onto the module itself for cleaner power.',
        explodeDir: [0, 1, 0],
        explodeDist: 0.65,
        labelOffset: [-2.2, 0.5, 0.4],
        internal: true,
        specs: [{ label: 'Rails', value: '1.1 V VDD / VDDQ' }],
      },
      {
        id: 'pcb',
        name: 'Module PCB',
        description: '10-layer PCB with length-matched traces to every DRAM package.',
        explodeDir: [0, 0, 0],
        explodeDist: 0,
        labelOffset: [-2.3, -0.1, 0.5],
        specs: [{ label: 'Layers', value: '10-layer' }],
      },
      {
        id: 'gold-contacts',
        name: 'Gold Edge Contacts',
        description:
          '288 gold-plated fingers carrying command, address and data to the DIMM slot.',
        explodeDir: [0, -1, 0],
        explodeDist: 0.9,
        labelOffset: [1.9, -0.8, 0.4],
        specs: [
          { label: 'Pins', value: '288-pin UDIMM' },
          { label: 'Plating', value: '30 µin gold' },
        ],
      },
    ],
    animations: [
      {
        id: 'read-cycle',
        name: 'Read Cycle',
        description: 'Row activate → column read → data burst back to the controller.',
        duration: 6,
      },
      {
        id: 'write-cycle',
        name: 'Write Cycle',
        description: 'Data driven from the bus into open DRAM rows.',
        duration: 6,
      },
      {
        id: 'data-transfer',
        name: 'Data Transfer',
        description: 'Both 32-bit sub-channels bursting on rising and falling clock edges.',
        duration: 5,
      },
    ],
    specs: [
      { label: 'Capacity', value: '32 GB (1 × 32 GB)' },
      { label: 'Speed', value: 'DDR5-6400' },
      { label: 'Timings', value: 'CL32-39-39-102' },
      { label: 'Voltage', value: '1.35 V' },
      { label: 'Form factor', value: '288-pin UDIMM' },
    ],
    highlights: [
      { icon: 'ram', label: 'Type', value: 'Memory Module' },
      { icon: 'chip', label: 'Capacity', value: '32 GB' },
      { icon: 'gauge', label: 'Speed', value: 'DDR5-6400' },
      { icon: 'target', label: 'Use Case', value: 'Multitasking' },
    ],
    facts: [
      'DDR5 splits each DIMM into two independent 32-bit channels.',
      'A DRAM capacitor holds roughly 40,000 electrons per stored bit.',
      'Memory is refreshed ~7,800 times per second to keep data alive.',
    ],
  },

  ssd: {
    id: 'ssd',
    name: 'NVMe Solid-State Drive',
    shortName: 'SSD',
    category: 'Storage',
    tagline: '2 TB M.2 2280 · PCIe 4.0 ×4 NVMe',
    description:
      'An SSD stores data by trapping electrons in NAND flash cells. A multi-core controller juggles wear leveling, error correction and parallel access across many flash dies.',
    bounds: [3.4, 0.4, 1.0],
    parts: [
      {
        id: 'controller',
        name: 'NVMe Controller',
        description:
          'An 8-channel SoC translating NVMe commands into parallel NAND operations.',
        explodeDir: [0, 1, 0],
        explodeDist: 0.85,
        labelOffset: [-1.4, 0.6, -0.55],
        specs: [
          { label: 'Channels', value: '8-channel' },
          { label: 'Interface', value: 'PCIe 4.0 ×4' },
        ],
        education:
          'The controller is a small computer: multiple ARM cores run firmware that maps logical blocks to physical flash pages and constantly shuffles data to level wear.',
      },
      {
        id: 'nand-flash',
        name: 'NAND Flash Packages',
        description:
          'Two stacked-die TLC packages storing 1 TB each across 176 vertical layers.',
        explodeDir: [0, 1, 0],
        explodeDist: 0.7,
        labelOffset: [1.1, 0.55, 0.55],
        specs: [
          { label: 'Type', value: '176-layer TLC' },
          { label: 'Dies', value: '2 × 8-die stacks' },
        ],
        education:
          '3D NAND stacks storage cells vertically like a skyscraper — 176 floors of cells in a chip thinner than a coin.',
      },
      {
        id: 'dram-cache',
        name: 'DRAM Cache',
        description:
          '2 GB LPDDR4 holding the logical-to-physical mapping table for instant lookups.',
        explodeDir: [0, 1, 0],
        explodeDist: 0.55,
        labelOffset: [-0.1, 0.55, 0.6],
        internal: true,
        specs: [{ label: 'Capacity', value: '2 GB LPDDR4' }],
      },
      {
        id: 'pcb',
        name: 'M.2 PCB',
        description: 'The 22 × 80 mm board carrying controller, cache and flash.',
        explodeDir: [0, -1, 0],
        explodeDist: 0.45,
        labelOffset: [1.5, -0.35, -0.55],
        specs: [{ label: 'Form factor', value: 'M.2 2280' }],
      },
      {
        id: 'connector',
        name: 'M.2 Edge Connector',
        description: 'M-keyed edge fingers carrying four PCIe lanes plus power.',
        explodeDir: [-1, 0, 0],
        explodeDist: 0.8,
        labelOffset: [-1.9, 0.3, 0.5],
        specs: [{ label: 'Key', value: 'M-key · PCIe ×4' }],
      },
    ],
    animations: [
      {
        id: 'nand-access',
        name: 'NAND Access',
        description: 'The controller striping a read across every flash channel at once.',
        duration: 6,
      },
      {
        id: 'controller-flow',
        name: 'Controller Flow',
        description: 'Host commands arriving over PCIe, mapped through DRAM, dispatched to NAND.',
        duration: 7,
      },
    ],
    specs: [
      { label: 'Capacity', value: '2 TB' },
      { label: 'Seq. read', value: '7,300 MB/s' },
      { label: 'Seq. write', value: '6,600 MB/s' },
      { label: 'Random read', value: '1.2 M IOPS' },
      { label: 'Interface', value: 'PCIe 4.0 ×4 NVMe 1.4' },
      { label: 'Endurance', value: '1,200 TBW' },
    ],
    highlights: [
      { icon: 'ssd', label: 'Type', value: 'NVMe SSD' },
      { icon: 'chip', label: 'Capacity', value: '2 TB' },
      { icon: 'gauge', label: 'Seq. Read', value: '7,300 MB/s' },
      { icon: 'target', label: 'Use Case', value: 'Fast Storage' },
    ],
    facts: [
      'An SSD has no moving parts — access time is ~0.02 ms vs ~10 ms for a hard drive.',
      'Writing actually erases whole blocks first; the controller hides this behind spare area.',
      'TLC NAND stores 3 bits per cell using 8 distinct charge levels.',
    ],
  },

  motherboard: {
    id: 'motherboard',
    name: 'ATX Motherboard',
    shortName: 'Motherboard',
    category: 'Platform',
    tagline: 'ATX platform · 20-phase VRM · PCIe 5.0',
    description:
      'The motherboard is the nervous system of the PC — it distributes power and routes every signal between CPU, memory, storage and expansion cards.',
    bounds: [5.2, 1.0, 6.2],
    parts: [
      {
        id: 'cpu-socket',
        name: 'CPU Socket',
        description:
          'An LGA-1718 socket: 1,718 spring-loaded pins pressed against the CPU’s lands by a retention frame.',
        explodeDir: [0, 1, 0],
        explodeDist: 1.15,
        labelOffset: [-0.4, 1.0, -2.2],
        specs: [{ label: 'Type', value: 'LGA-1718' }],
      },
      {
        id: 'vrm',
        name: 'VRM & Chokes',
        description:
          '20 power phases converting 12 V to the CPU core voltage under heatsink banks.',
        explodeDir: [0, 1, 0],
        explodeDist: 0.95,
        labelOffset: [-2.4, 0.9, -2.4],
        specs: [
          { label: 'Phases', value: '20 + 1 + 2' },
          { label: 'Stage rating', value: '90 A each' },
        ],
        education:
          'VRMs switch at ~1 MHz, chopping 12 V into pulses that inductors and capacitors smooth into a rock-steady ~1.2 V at hundreds of amps.',
      },
      {
        id: 'dimm-slots',
        name: 'DIMM Slots',
        description: 'Four DDR5 slots wired in two channels, closest pair to the CPU first.',
        explodeDir: [0, 1, 0],
        explodeDist: 0.8,
        labelOffset: [2.5, 0.9, -2.0],
        specs: [
          { label: 'Slots', value: '4 × DDR5, dual channel' },
          { label: 'Max', value: '192 GB, 8000+ MT/s OC' },
        ],
      },
      {
        id: 'pcie-slots',
        name: 'PCIe Slots',
        description:
          'One reinforced ×16 Gen5 slot for graphics plus ×4 and ×1 expansion slots.',
        explodeDir: [0, 1, 0],
        explodeDist: 0.7,
        labelOffset: [-2.6, 0.8, 1.6],
        specs: [{ label: 'Primary', value: '×16 PCIe 5.0, steel-reinforced' }],
      },
      {
        id: 'chipset',
        name: 'Chipset',
        description:
          'The platform hub: fans out extra PCIe lanes, SATA, USB and networking from one link to the CPU.',
        explodeDir: [0, 1, 0],
        explodeDist: 0.85,
        labelOffset: [1.9, 0.75, 1.2],
        specs: [
          { label: 'Downstream', value: '12 × PCIe 4.0 lanes' },
          { label: 'Link', value: '×8 to CPU' },
        ],
      },
      {
        id: 'm2-slots',
        name: 'M.2 Slots',
        description: 'Two NVMe sockets under thermal shields, one CPU-attached at Gen5.',
        explodeDir: [0, 1, 0],
        explodeDist: 0.6,
        labelOffset: [0.6, 0.7, 0.2],
        specs: [{ label: 'Slots', value: '1 × Gen5, 1 × Gen4' }],
      },
      {
        id: 'capacitors',
        name: 'Filter Capacitors',
        description: 'Solid polymer capacitors filtering every power rail on the board.',
        explodeDir: [0, 1, 0],
        explodeDist: 0.5,
        labelOffset: [2.6, 0.6, 2.6],
      },
      {
        id: 'cmos-battery',
        name: 'CMOS Battery',
        description:
          'A CR2032 coin cell keeping the real-time clock and firmware settings alive when unplugged.',
        explodeDir: [0, 1, 0],
        explodeDist: 0.55,
        labelOffset: [-1.6, 0.6, 2.7],
        specs: [{ label: 'Type', value: 'CR2032 · 3 V lithium' }],
      },
      {
        id: 'atx-connector',
        name: '24-pin ATX Connector',
        description: 'The main power umbilical from the PSU: +12 V, +5 V, +3.3 V and standby rails.',
        explodeDir: [1, 0.6, 0],
        explodeDist: 0.8,
        labelOffset: [2.8, 0.7, -0.6],
        specs: [{ label: 'Pins', value: '24-pin Molex Mini-Fit' }],
      },
      {
        id: 'usb-headers',
        name: 'USB & Front-Panel Headers',
        description: 'Internal headers feeding the case’s USB ports, audio jacks and switches.',
        explodeDir: [0, 1, 0],
        explodeDist: 0.5,
        labelOffset: [0.8, 0.6, 2.9],
        specs: [{ label: 'USB-C header', value: '20 Gb/s Gen 2×2' }],
      },
      {
        id: 'io-cover',
        name: 'I/O Shroud',
        description: 'Brushed cover over the rear-port stack and audio circuitry.',
        explodeDir: [0, 1, 0],
        explodeDist: 0.9,
        labelOffset: [-2.7, 1.0, -0.4],
      },
      {
        id: 'pcb',
        name: 'Motherboard PCB',
        description:
          'An 8-layer board with dedicated ground planes and length-tuned memory traces.',
        explodeDir: [0, -1, 0],
        explodeDist: 0.5,
        labelOffset: [-2.8, 0.15, 2.8],
        specs: [{ label: 'Layers', value: '8-layer, 2 oz copper' }],
      },
    ],
    animations: [
      {
        id: 'power-distribution',
        name: 'Power Distribution',
        description: '12 V entering the ATX connector, fanning out through the VRM to CPU and slots.',
        duration: 8,
      },
      {
        id: 'pcie-communication',
        name: 'PCIe Communication',
        description: 'Packets streaming between CPU, ×16 slot and chipset lanes.',
        duration: 6,
      },
      {
        id: 'memory-routing',
        name: 'Memory Routing',
        description: 'Command/address and data bursts travelling the tuned traces to each DIMM.',
        duration: 6,
      },
    ],
    specs: [
      { label: 'Form factor', value: 'ATX · 305 × 244 mm' },
      { label: 'Socket', value: 'LGA-1718' },
      { label: 'Memory', value: '4 × DDR5, 192 GB max' },
      { label: 'Expansion', value: 'PCIe 5.0 ×16 + ×4 + ×1' },
      { label: 'Storage', value: '2 × M.2, 4 × SATA' },
      { label: 'VRM', value: '20+1+2 phases' },
    ],
    highlights: [
      { icon: 'motherboard', label: 'Type', value: 'ATX Mainboard' },
      { icon: 'cpu', label: 'Socket', value: 'LGA-1718' },
      { icon: 'bolt', label: 'Expansion', value: 'PCIe 5.0 ×16' },
      { icon: 'target', label: 'Use Case', value: 'System Platform' },
    ],
    facts: [
      'DDR5 traces are length-matched to within fractions of a millimeter so bits arrive in sync.',
      'An 8-layer board hides most wiring inside — you only see the top and bottom.',
      'The chipset link carries every USB, SATA and network byte in the system.',
    ],
  },

  'cooling-fan': {
    id: 'cooling-fan',
    name: '120 mm Cooling Fan',
    shortName: 'Cooling Fan',
    category: 'Cooling',
    tagline: '120 mm PWM fan · fluid-dynamic bearing · ARGB',
    description:
      'Case fans move heat out of the system. Blade geometry, bearing type and PWM control balance airflow, static pressure and noise.',
    bounds: [3.2, 3.2, 1.1],
    parts: [
      {
        id: 'blades',
        name: 'Fan Blades',
        description:
          'Nine swept blades optimized for static pressure across radiator fins.',
        explodeDir: [0, 0, 1],
        explodeDist: 1.5,
        labelOffset: [1.6, 1.3, 0.8],
        specs: [
          { label: 'Blades', value: '9, swept profile' },
          { label: 'Airflow', value: '72 CFM max' },
        ],
        education:
          'Blade sweep and tip clearance are tuned like a tiny jet engine — a 0.5 mm gap change measurably shifts noise and pressure.',
      },
      {
        id: 'motor-hub',
        name: 'Motor & Hub',
        description:
          'A brushless DC motor: the hub magnet ring spins around a fixed coil stator.',
        explodeDir: [0, 0, 2],
        explodeDist: 1.05,
        labelOffset: [-1.7, 0.9, 0.9],
        internal: true,
        specs: [
          { label: 'Type', value: '4-pole BLDC' },
          { label: 'Speed', value: '550–2,000 RPM PWM' },
        ],
      },
      {
        id: 'bearing',
        name: 'Fluid-Dynamic Bearing',
        description:
          'The shaft rides on a pressurized oil film — near-silent and rated for 300,000 hours.',
        explodeDir: [0, 0, 3.2],
        explodeDist: 0.8,
        labelOffset: [1.5, -1.1, 1.0],
        internal: true,
        specs: [{ label: 'MTTF', value: '300,000 h' }],
        education:
          'While spinning, the shaft never touches the sleeve: grooves pump oil into a wedge that centers it, eliminating wear.',
      },
      {
        id: 'housing',
        name: 'Fan Frame',
        description:
          'Glass-fiber reinforced frame with anti-vibration corner pads.',
        explodeDir: [0, 0, -1],
        explodeDist: 1.1,
        labelOffset: [-1.7, -1.3, -0.7],
        specs: [{ label: 'Size', value: '120 × 120 × 25 mm' }],
      },
      {
        id: 'rgb-ring',
        name: 'ARGB Diffuser Ring',
        description:
          'An addressable LED ring with 16 independently controlled RGB LEDs.',
        explodeDir: [0, 0, 1.6],
        explodeDist: 0.9,
        labelOffset: [0.2, 1.9, 0.5],
        specs: [{ label: 'LEDs', value: '16 × addressable' }],
      },
      {
        id: 'mounting-points',
        name: 'Mounting Points',
        description: 'Four rubber-damped screw channels isolating vibration from the case.',
        explodeDir: [0, 0, -1.8],
        explodeDist: 0.7,
        labelOffset: [-1.9, 1.6, -0.6],
      },
    ],
    animations: [
      {
        id: 'airflow',
        name: 'Airflow',
        description: 'Air being pulled through the intake side and driven out in a swirl.',
        duration: 5,
      },
      {
        id: 'pwm-curve',
        name: 'PWM Response',
        description: 'The fan ramping through its duty-cycle curve from idle to full speed.',
        duration: 8,
      },
    ],
    specs: [
      { label: 'Size', value: '120 × 120 × 25 mm' },
      { label: 'Speed', value: '550–2,000 RPM' },
      { label: 'Airflow', value: '72 CFM' },
      { label: 'Pressure', value: '3.0 mm H₂O' },
      { label: 'Noise', value: '10–27 dBA' },
      { label: 'Bearing', value: 'Fluid-dynamic' },
    ],
    highlights: [
      { icon: 'fan', label: 'Type', value: 'Case Fan' },
      { icon: 'chip', label: 'Size', value: '120 mm' },
      { icon: 'gauge', label: 'Airflow', value: '72 CFM' },
      { icon: 'target', label: 'Use Case', value: 'Airflow & Cooling' },
    ],
    facts: [
      'Doubling fan speed roughly cubes the noise energy but only doubles airflow.',
      'Fluid bearings never touch while spinning — the rotor floats on oil.',
      'PWM control pulses power thousands of times per second instead of lowering voltage.',
    ],
  },
};

export const HARDWARE_LIST = Object.values(HARDWARE);

export const CATEGORY_ORDER: Array<HardwareDefinition['category']> = [
  'Processing',
  'Memory',
  'Storage',
  'Platform',
  'Cooling',
];

export function getHardware(id: HardwareId): HardwareDefinition {
  return HARDWARE[id];
}

export function getPart(hardwareId: HardwareId, partId: string) {
  return HARDWARE[hardwareId].parts.find((p) => p.id === partId) ?? null;
}
