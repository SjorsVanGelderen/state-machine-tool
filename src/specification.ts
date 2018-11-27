/*
  Contains all concrete state machine specifications
*/

import { SingleCondition, StateMachine, unit } from "./state-machine";

/*
  Custom state keys
*/
type CartMachineStateKeys = "start" | "left" | "right" | "end";

type SwitchMachineStateKeys = "left" | "right";

type CartMachinePair = {
  id: "cartMachine";
  keys: CartMachineStateKeys;
};

type SwitchMachinePair = { id: "switchMachine"; keys: SwitchMachineStateKeys };

export type MachineIdAndKeysPair = CartMachinePair | SwitchMachinePair;

/*
  Custom conditions
*/
export type SingleConditionKinds =
  | SingleCondition<CartMachinePair>
  | SingleCondition<SwitchMachinePair>;

/*
  State machine specifications
*/
const cartMachine: StateMachine<CartMachinePair> = {
  id: "cartMachine",
  states: {
    start: {
      left: {
        machineId: "switchMachine",
        hasState: "left"
      },
      right: {
        machineId: "switchMachine",
        hasState: "right"
      }
    },
    left: {
      start: {
        machineId: "switchMachine",
        hasState: "left"
      },
      end: unit
    },
    right: {
      start: { machineId: "switchMachine", hasState: "right" },
      end: unit
    },
    end: { left: unit, right: unit }
  },
  initialState: "start"
};

const switchMachine: StateMachine<SwitchMachinePair> = {
  id: "switchMachine",
  states: {
    left: { right: unit },
    right: { left: unit }
  },
  initialState: "left"
};

// Probably this can be removed after shuffling a bit with the types
export type Machine =
  | StateMachine<CartMachinePair>
  | StateMachine<SwitchMachinePair>;

export const customMachines: Machine[] = [cartMachine, switchMachine];
