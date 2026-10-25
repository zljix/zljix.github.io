import {CPU_EXAMPLES} from '../public/orbit/models.js';
import {recordCpuProof,recordMemoryProof,checkMemoryTranslation,MEMORY_LAB_SEQUENCE} from '../public/orbit/lab-evidence.js';
export function completeCpuLab(learning){
  learning.cpu={jobs:structuredClone(CPU_EXAMPLES.basic),algorithm:'fcfs',quantum:2,steps:400};recordCpuProof(learning);
  for(const quantum of [2,1,6]){learning.cpu.algorithm='rr';learning.cpu.quantum=quantum;recordCpuProof(learning);if(quantum===2)recordCpuProof(learning,true);}
}
export function completeRemainingSimulationLabs(learning){
  learning.cpu={jobs:structuredClone(CPU_EXAMPLES.io),algorithm:'fcfs',quantum:2,steps:2};recordCpuProof(learning);
  learning.cpu.steps=400;recordCpuProof(learning);learning.cpu.algorithm='sjf';recordCpuProof(learning);
  learning.memory={algorithm:'fifo',frames:3,sequence:MEMORY_LAB_SEQUENCE,steps:30};recordMemoryProof(learning);
  learning.memory.algorithm='lru';recordMemoryProof(learning);recordMemoryProof(learning,true);
  checkMemoryTranslation(learning,1024,{page:1,offset:0,physical:null});
}
