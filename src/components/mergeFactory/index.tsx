import plusnew, {
  ApplicationElement,
  Component,
  Context,
  Props,
} from "@plusnew/core";
import type ComponentInstance from "@plusnew/core/src/instances/types/Component/Instance";
import type { entitiesContainerTemplate, entityEmpty } from "../../types";
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

type merge<T extends entitiesContainerTemplate> = (
  changes: {
    [U in keyof T]?: {
      [key: string]: T[U]["item"];
    };
  }
) => void;
type mergeRenderprops<T extends entitiesContainerTemplate> = (value: {
  changes: changes<T>;
  merge: merge<T>;
}) => ApplicationElement;

type props<T extends entitiesContainerTemplate> = {
  children: mergeRenderprops<T>;
};

type singleRelationship = entityEmpty<string, string | number>;
type manyRelationships = entityEmpty<string, string | number>[];

type relationships = singleRelationship | manyRelationships;

function isSameSingleRelationship(
  a: singleRelationship,
  b: singleRelationship
) {
  return a.model === b.model && a.id === b.id;
}

function isSameRelationship(a: relationships, b: relationships) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length &&
      b.every((value, index) => isSameSingleRelationship(a[index], value))
    );
  } else if (Array.isArray(a) === false && Array.isArray(b) === false) {
    return isSameSingleRelationship(
      a as singleRelationship,
      b as singleRelationship
    );
  }
  return false;
}

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

      const merge: merge<T> = (changes) => {
        repositoryDispatch({
          type: "ITEMS_INSERT",
          payload: {
            items: changes,
            invalidateInvolvedListCahes: true,
          },
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
                      if (
                        change.type === "ATTRIBUTES_CHANGE" ||
                        change.type === "RELATIONSHIPS_CHANGE"
                      ) {
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

                        if (change.type === "ATTRIBUTES_CHANGE") {
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

                              changes[change.model][
                                change.id
                              ].changedAttributes[attributeName] =
                                change.payload[attributeName];
                            }
                          }
                        } else if (change.type === "RELATIONSHIPS_CHANGE") {
                          for (const relationshipName in change.payload) {
                            if (
                              isSameRelationship(
                                original.relationships[
                                  relationshipName
                                ] as relationships,
                                change.payload[
                                  relationshipName
                                ] as relationships
                              )
                            ) {
                              delete changes[change.model][change.id]
                                .changedRelationships[relationshipName];
                              changes[change.model][change.id].relationships[
                                relationshipName
                              ] = change.payload[relationshipName];

                              deleted = true;
                            } else {
                              changes[change.model][change.id].relationships[
                                relationshipName
                              ] = change.payload[relationshipName];

                              changes[change.model][
                                change.id
                              ].changedRelationships[relationshipName] =
                                change.payload[relationshipName];
                            }
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

                    return ((props.children as any)[0] as mergeRenderprops<T>)({
                      changes: changes,
                      merge,
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