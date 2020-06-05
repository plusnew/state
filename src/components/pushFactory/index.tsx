import plusnew, {
  ApplicationElement,
  Component,
  Context,
  Props,
} from "@plusnew/core";
import type ComponentInstance from "@plusnew/core/src/instances/types/Component/Instance";
import type { entitiesContainerTemplate } from "../../types";
import { mapObject } from "../../util/forEach";
import type { branchActions, branchState } from "../branchFactory";
import type { repositoryActions, repositoryState } from "../repositoryFactory";

type changes<T extends entitiesContainerTemplate> = {
  [U in keyof T]?: {
    [key: string]: {
      id: T[U]["item"]["id"];
      model: U;
      attributes: T[U]["item"]["attributes"];
      relationships: T[U]["item"]["relationships"];
      changedAttributes: T[U]["item"]["attributes"];
      changedRelationships: T[U]["item"]["relationships"];
    };
  };
};

type push<T extends entitiesContainerTemplate> = (
  changes: {
    [U in keyof T]?: {
      [key: string]: T[U]["item"];
    };
  }
) => void;
type pushRenderprops<T extends entitiesContainerTemplate> = (value: {
  changes: changes<T>;
  push: push<T>;
}) => ApplicationElement;

type props<T extends entitiesContainerTemplate> = {
  children: pushRenderprops<T>;
};

export default <T extends entitiesContainerTemplate>(
  repositoryContext: Context<repositoryState<T>, repositoryActions<T>>,
  branchContext: Context<branchState<T>, branchActions<T>>
) =>
  class List extends Component<props<T>> {
    static displayName = __dirname;
    render(
      Props: Props<props<T>>,
      componentInstance: ComponentInstance<any, any, any>
    ) {
      const { dispatch: repositoryDispatch } = repositoryContext.findProvider(
        componentInstance
      );

      const { dispatch: branchDispatch } = branchContext.findProvider(
        componentInstance
      );

      const push: push<T> = (changes) => {
        repositoryDispatch({
          type: "ITEMS_INSERT",
          payload: changes,
        });

        branchDispatch({
          type: "RESET_CHANGELOG",
          payload: mapObject(changes, (change) =>
            Object.keys(change as any)
          ) as any,
        });
      };
      return (
        <repositoryContext.Consumer>
          {(repositoryState) => (
            <branchContext.Consumer>
              {(branchState) => (
                <Props>
                  {(props) => {
                    const changes: any = {};
                    for (let i = 0; i < branchState.changeLog.length; i++) {
                      const change = branchState.changeLog[i];
                      if (change.type === "ATTRIBUTES_CHANGE") {
                        const original = (repositoryState.entities[
                          change.model
                        ] as any)[change.id].payload as T[keyof T]["item"];

                        if (change.model in changes === false) {
                          changes[change.model] = {};
                        }
                        if (change.id in changes[change.model] === false) {
                          changes[change.model][change.id] = {
                            id: change.id,
                            model: change.model,
                            attributes: {
                              ...original.attributes,
                            },
                            changedAttributes: {},
                            relationships: {
                              ...original.relationships,
                            },
                            changedRelationships: {},
                          };
                        }

                        let deleted = false;
                        for (const attributeName in change.payload) {
                          if (
                            change.payload[attributeName] ===
                            original.attributes[attributeName]
                          ) {
                            delete changes[change.model][change.id]
                              .changedAttributes[attributeName];
                            changes[change.model][change.id].attributes[
                              attributeName
                            ] = change.payload[attributeName];

                            deleted = true;
                          } else {
                            changes[change.model][change.id].attributes[
                              attributeName
                            ] = change.payload[attributeName];
                            changes[change.model][change.id].changedAttributes[
                              attributeName
                            ] = change.payload[attributeName];
                          }
                        }

                        if (deleted) {
                          if (
                            Object.keys(
                              changes[change.model][change.id].changedAttributes
                            ).length === 0 &&
                            Object.keys(
                              changes[change.model][change.id]
                                .changedRelationships
                            ).length === 0
                          ) {
                            delete changes[change.model][change.id];

                            if (
                              Object.keys(changes[change.model]).length === 0
                            ) {
                              delete changes[change.model];
                            }
                          }
                        }
                      }
                    }

                    return ((props.children as any)[0] as pushRenderprops<T>)({
                      changes: changes,
                      push,
                    });
                  }}
                </Props>
              )}
            </branchContext.Consumer>
          )}
        </repositoryContext.Consumer>
      );
    }
  };
