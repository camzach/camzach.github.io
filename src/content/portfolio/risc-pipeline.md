---
title: RISC CPU Architecture
description: VHDL Description of a 5-stage pipelined CPU
banner: /portfolio/risc-pipeline/diagram.png
showcase: /portfolio/risc-pipeline/diagram.png
repo: https://github.com/camzach/risc-pipeline
---

I created this project as part of my M.S. in the spring of 2021. The intent was to learn about the low-level architecture of a computer processor by designing one myself with VHDL. In addition to the description of the processor architecture, I created an instruction set and a simple assembler that would compile a program to machine code, to be loaded into the processor's memory and executed.

## The Processor

This processor has a 4-stage pipeline. The stages are:

1. Instruction Fetch -- read the current instruction from memory
2. Instruction Decode -- Determine which microinstructions are necessary to complete the instruction
3. Execution -- Performs the caculations required by the current instruction
4. MEM -- Handles memory accesses, moving data between memory and registers
5. Writeback -- Write the result of the calculation to the required register

Since my experience with VHDL (and Hardware Description Languages in general) is entirely limited to this project, I chose to implement as few instructions as possible while still having enough instructions to write any program I want. The instruction set consists of NOOP, JMP, STORE, JNZ, JEZ, LOAD, LOADI, ADD, SUB, MUL, DIV, AND, and OR.

## The Assembler

The assembler for this processor, written in python, supports several convenience features such as aliasing values for code readability and labelling lines for easier branching. A basic example of a program looks like this:

```asm
#alias
$DEAD 0xdead
$DADR 0x0
$BEEF 0xbeef
$BADR 0x1

#data
$DADR $DEAD
$BADR $BEEF
0x2 0x1234

#start
LOADI %0 $DADR
LOAD %0 %0
ADD %0 %0 %0
LOADI %1 $BADR
LOAD %1 %1
```

Perhaps the most exciting part, however, is its ability to reorder instructions to prevent the pipeline from stalling while loading values from memory. Since a memory load takes longer than other instructions, the assembler needs to insert two NOOP instructions before it can continue to the next line. Instead, the program can be more efficient by beginning the load instruction before it is needed, and running two other instructions instead of the NOOPs.

## Takeaways

This project was a lot of fun to work on! I really enjoyed getting hands-on with CPU microarchitecture, and learning how to describe it in VHDL. I also really liked writing my simple compiler and seeing the code actually running on the hardware (via a waveform simulator) was very rewarding.

Some of my choices in the design of the processor were quite limiting, such as only having 4 general-purpose registers and having such a limited instruction set. I also made some questionable choices regarding how my code is laid out due to my inexperience with VHDL.

The project was originally written with a student edition of ModelSim, but I never uploaded the code to GitHub until I wanted to post about it here. As a result, I had to rewrite some portions of the code to work with GHDL, an open-source VHDL simulator. If you want more details, the source is now up on GitHub along with the final report I submitted with the project.
