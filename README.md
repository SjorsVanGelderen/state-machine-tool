# state-machine-tool
Type-safe engine-agnostic state machine generator

## About
This tool generates logic for state machines based on a restricted definition. The types defined in `state-machine.ts` help to avoid duplicate and invalid transitions. It's also possible to specify the conditions for any transition.

In the file `specification.ts` is an example of how to define state machines.
Better documentation will follow when the tool matures.

Currently the tool generates C++ sources and headers, including C bindings to allow interop.

## Instructions
Run `tsc` in the base folder to compile the program, then run `node ./dist/generator.js`. In the `./out/` folder you will now find C++ sources and headers for the machines that you have specified in `specification.ts`.

I recommend using the `indent.sh` script to nicely format the output source code.

To create a library from the sources, you need to use something like the following commands:
`g++ -c -std=c++14 -o SwitchMachine.o SwitchMachine.cpp`
`g++ -std=c++14 -dynamiclib -fPIC -o statemachine.bundle SwitchMachine.o`

## Demo
The `Unity project` folder contains a demo project with a `statemachine.bundle` file that contains the compiled C++ code. In the file `MasterController.cs` you will see that all necessary functions are imported using the `DllImport` attribute.

![Alt text](cartdemo.png?raw=true "Screenshot of the cart demo")