/*
  Contains all internal type definitions for state machines

  Note: If a terminal state exists, the state machine is terminal and subject
  to additional tests, such as testing for valid paths to terminal states
  A terminal state is a state that has further transitions
*/

import { MachineIdAndKeysPair, SingleConditionKinds } from "./specification";

export type Unit = {};

export const unit: Unit = {};

export interface SingleCondition<Pair extends MachineIdAndKeysPair> {
  readonly machineId: Pair["id"];
  readonly hasState: Pair["keys"];
}

export type LogicalOperation = "AND" | "OR" | "XOR";

export type LogicalConditionCombination = {
  readonly kind: LogicalOperation;
  readonly left: Condition;
  readonly right: Condition;
};

export type Condition = SingleConditionKinds | LogicalConditionCombination;

export interface Transition<
  PossibleStates extends MachineIdAndKeysPair["keys"]
> {
  readonly toState: PossibleStates;
  readonly condition?: Condition;
}

export interface StateMachine<Pair extends MachineIdAndKeysPair> {
  readonly id: Pair["id"];
  readonly states: {
    [Key in Pair["keys"]]: { [Key in Pair["keys"]]?: Unit | Condition }
  };
  readonly initialState: Pair["keys"];
}
