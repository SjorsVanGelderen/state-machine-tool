import * as FS from "fs";
import * as Path from "path";

import { OrderedSet, Map, List } from "immutable";

import { LogicalOperation } from "./state-machine";
import { Machine, customMachines } from "./specification";

const mapLogicalOperation: (operation: LogicalOperation) => string = o =>
  o == "AND" ? "&&" : o == "OR" ? "||" : "!=";

const collectCondition: (
  conditionObject: any
) => [OrderedSet<[string, string]>, string] = co => {
  if (co.kind) {
    const l = collectCondition(co.left);
    const r = collectCondition(co.right);

    return [
      l[0].merge(r[0]),
      `(${l[1]} ${mapLogicalOperation(co.kind)} ${r[1]})`
    ];
  } else {
    const machineId = capitalize(co.machineId);
    const hasState = capitalize(co.hasState);

    return [
      OrderedSet<[string, string]>([
        [`${machineId}State`, `current${machineId}State`]
      ]),
      `(current${machineId}State == ${machineId}State::${machineId}${hasState})`
    ];
  }
};

const capitalize: (s: string) => string = s => s[0].toUpperCase() + s.slice(1);

const collectStates: (
  machines: Machine[]
) => Map<string, OrderedSet<string>> = machines =>
  machines.reduce(
    (acc, machine) =>
      acc.set(
        machine.id,
        OrderedSet<string>(Object.keys(machine.states).map(capitalize))
      ),
    Map<string, OrderedSet<string>>()
  );

const generateEnums: (
  states: Map<string, OrderedSet<string>>
) => Map<string, string> = states =>
  states.reduce((acc, v, k) => {
    const states = v
      .valueSeq()
      .map((s, i) => `${capitalize(k)}${s}${i == 0 ? " = 0" : ""}`)
      .join(",\n");

    const source = `enum ${capitalize(k)}State {\n${states}\n};\n\n`;

    return acc.set(k, source);
  }, Map<string, string>());

const generateHeader: (machine: Machine) => string = machine => {
  const machineId = capitalize(machine.id);

  const fromStates = List(Object.keys(machine.states));

  const signatures = fromStates
    .flatMap<List<string>, string[][]>(fromState => {
      const toStates = Object.keys(machine.states[fromState]);

      const signatures = toStates.map(toState => {
        const transition = machine.states[fromState][toState];

        let conditionParams = "";

        if (transition && Object.keys(transition).length > 0) {
          conditionParams =
            ",\n" +
            collectCondition(transition)[0]
              .map(x => x[0] + " " + x[1])
              .join(",\n");
        }

        const signature = `static ${machineId}State From${capitalize(
          fromState
        )}To${capitalize(toState)}(
  ${machineId}State current${machineId}State${conditionParams}
);`;

        const externSignature = `extern "C" ${machineId}State ${machineId}From${capitalize(
          fromState
        )}To${capitalize(toState)}(
  ${machineId}State current${machineId}State${conditionParams}
);`;

        return [signature, externSignature];
      });

      return signatures;
    })
    .toList();

  const source = `#ifndef ${machineId}_H
#define ${machineId}_H

#include "StateEnums.h"\n\nclass ${machineId}
{
  public:
    static const ${machineId}State initialState;
    ${signatures.map(x => x[0]).join("\n\n")}
  private:
};

${signatures.map(x => x[1]).join("\n\n")}

extern "C" ${machineId}State ${machineId}InitialState();

#endif`;

  return source;
};

const generateDefinitions: (machine: Machine) => string = machine => {
  const machineId = capitalize(machine.id);

  const fromStates = List<string>(Object.keys(machine.states));

  const definitions = fromStates.flatMap<List<string>, string[][]>(
    fromState => {
      const toStates = Object.keys(machine.states[fromState]);

      const definitions = toStates.map(toState => {
        const transition = machine.states[fromState][toState];

        let conditionInfo = undefined;
        let condition = "";

        if (transition && Object.keys(transition).length > 0) {
          conditionInfo = collectCondition(transition);
          condition = conditionInfo[1];
        }

        const definition = `${machineId}State ${machineId}::From${capitalize(
          fromState
        )}To${capitalize(toState)}(
  ${machineId}State current${machineId}State\n${
          conditionInfo
            ? ",\n" + conditionInfo[0].map(x => x[0] + " " + x[1]).join(",\n")
            : ""
        }
)
{
  if(current${machineId}State != ${machineId}State::${machineId}${capitalize(
          fromState
        )}${(transition && Object.keys(transition).length > 0) ? ` || !${condition}` : ""})
  {
    return current${machineId}State;
  }

  return ${machineId}State::${machineId}${capitalize(toState)};
}`;

        const externDefinition = `${machineId}State ${machineId}From${capitalize(
          fromState
        )}To${capitalize(toState)}(
  ${machineId}State current${machineId}State\n${
          conditionInfo
            ? ",\n" + conditionInfo[0].map(x => x[0] + " " + x[1]).join(",\n")
            : ""
        }
)
{
  return ${machineId}::From${capitalize(fromState)}To${capitalize(
          toState
        )}(current${machineId}State${
          conditionInfo
            ? ",\n" + conditionInfo[0].map(x => x[1]).join(",\n")
            : ""
        });
}`;

        return [definition, externDefinition];
      });

      return definitions;
    }
  );

  const source = `#include "${machineId}.h"

const ${machineId}State ${machineId}::initialState = ${machineId}State::${machineId}${capitalize(
    machine.initialState
  )};

${definitions.map(x => x[0]).join("\n\n")}

${machineId}State ${machineId}InitialState()
{
  return ${machineId}::initialState;
}

${definitions.map(x => x[1]).join("\n\n")}
`;

  return source;
};

const generateSourceFiles: (
  machines: Machine[]
) => Map<string, string> = machines => {
  const states = collectStates(machines);

  const stateEnums = generateEnums(states);

  const headers = machines.reduce(
    (acc, elem) => acc.set(`${capitalize(elem.id)}.h`, generateHeader(elem)),
    Map<string, string>()
  );

  const definitions = machines.reduce(
    (acc, elem) =>
      acc.set(`${capitalize(elem.id)}.cpp`, generateDefinitions(elem)),
    Map<string, string>()
  );

  const result: Map<string, string> = Map<string, string>()
    .set(
      "StateEnums.h",
      "#ifndef STATE_ENUMS_H\n#define STATE_ENUMS_H\n\n" +
        stateEnums.valueSeq().join("\n\n") +
        "#endif"
    )
    .merge(headers)
    .merge(definitions);

  return result;
};

const generate: (machines: Machine[]) => void = machines => {
  const sourceFiles: Map<string, string> = generateSourceFiles(machines);

  sourceFiles.forEach((v, k) => {
    const data = new Uint8Array(Buffer.from(v));

    const path = `../out/${k}`;

    console.log(`Writing to ${path}`);

    FS.writeFile(Path.join(__dirname, path), data, (e: any) =>
      e ? console.log(e) : console.log(`Finished writing file ${path}!`)
    );
  });
};

generate(customMachines);
