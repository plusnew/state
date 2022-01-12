import type { Context } from "@plusnew/core";
import plusnew, { ApplicationElement, Component, Props } from "@plusnew/core";
import type ComponentInstance from "@plusnew/core/src/instances/types/Component/Instance";
import type { entitiesContainerTemplate, entityEmpty } from "../../types";
import type {
  dataActions,
  dataState,
  repositoryState,
} from "../../types/dataContext";
import { mapObject } from "../../util/forEach";
import { fromEntries } from "../../util/fromEntries";
import idSerializer from "../../util/idSerializer";

type changes<T extends entitiesContainerTemplate> = {
  [U in keyof T]?: (
    | {
        id: T[U]["item"]["id"];
        model: U;
        isDeleted: true;
      }
    | {
        id: T[U]["item"]["id"];
        model: U;
        isDeleted: false;
        attributes: T[U]["item"]["attributes"];
        relationships: T[U]["item"]["relationships"];
        changedAttributes: T[U]["item"]["attributes"];
        changedRelationships: T[U]["item"]["relationships"];
      }
  )[];
};

type appliedChanges<T extends entitiesContainerTemplate> = {
  [U in keyof T]: (
    | {
        id: T[U]["item"]["id"];
        model?: U;
        isDeleted: true;
      }
    | {
        id: T[U]["item"]["id"];
        model?: U;
        isDeleted?: false;
        attributes: T[U]["item"]["attributes"];
        relationships: T[U]["item"]["relationships"];
      }
  )[];
};

type merge<T extends entitiesContainerTemplate> = (
  changes: Partial<appliedChanges<T>>
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

type relationships = (singleRelationship | null) | manyRelationships;

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
    if (a === null || b === null) {
      return a === b;
    }

    return isSameSingleRelationship(
      a as singleRelationship,
      b as singleRelationship
    );
  }
  return false;
}

export default <T extends entitiesContainerTemplate>(
  dataContext: Context<dataState<T> & repositoryState<T>, dataActions<T>>
) =>
  class Merge extends Component<props<T>> {
    static displayName = "StateMerge";
    render(
      Props: Props<props<T>>,
      componentInstance: ComponentInstance<any, any, any>
    ) {
      const { dispatch: dataDispatch } =
        dataContext.findProvider(componentInstance);

      const merge: merge<T> = (changes) => {
        dataDispatch({
          type: "ITEMS_INSERT",
          payload: {
            items: mapObject(
              changes as appliedChanges<T>,
              (changeNamespace, changeNamespaceName) =>
                fromEntries(changeNamespace, (item) => [
                  idSerializer(item.id),
                  item.isDeleted
                    ? { isDeleted: true }
                    : {
                        isDeleted: false,
                        item: { model: changeNamespaceName as any, ...item },
                      },
                ])
            ),
            invalidateInvolvedListCaches: true,
          },
        });

        dataDispatch({
          type: "RESET_CHANGELOG",
          payload: mapObject(changes, (change) =>
            Object.keys(change as any)
          ) as any,
        });
      };
      return (
        <dataContext.Consumer>
          {(dataState) => (
            <Props>
              {(props) => {
                const changes: any = {};
                for (let i = 0; i < dataState.changeLog.length; i++) {
                  const change = dataState.changeLog[i];
                  if (
                    change.type === "ATTRIBUTES_CHANGE" ||
                    change.type === "RELATIONSHIPS_CHANGE"
                  ) {
                    const original = (dataState.entities[change.model] as any)[
                      change.id
                    ].payload as T[keyof T]["item"];

                    if (change.model in changes === false) {
                      changes[change.model] = {};
                    }
                    if (
                      (change.id as string) in changes[change.model] ===
                      false
                    ) {
                      changes[change.model][change.id] = {
                        id: original.id,
                        model: change.model,
                        isDeleted: false, // Deletionhandling should be improved, as sonn as dataes are capable of deleting
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

                          changes[change.model][change.id].changedAttributes[
                            attributeName
                          ] = change.payload[attributeName];
                        }
                      }
                    } else if (change.type === "RELATIONSHIPS_CHANGE") {
                      for (const relationshipName in change.payload) {
                        if (
                          isSameRelationship(
                            original.relationships[
                              relationshipName
                            ] as relationships,
                            change.payload[relationshipName] as relationships
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

                          changes[change.model][change.id].changedRelationships[
                            relationshipName
                          ] = change.payload[relationshipName];
                        }
                      }
                    }

                    if (deleted) {
                      if (
                        Object.keys(
                          changes[change.model][change.id].changedAttributes
                        ).length === 0 &&
                        Object.keys(
                          changes[change.model][change.id].changedRelationships
                        ).length === 0
                      ) {
                        delete changes[change.model][change.id];

                        if (Object.keys(changes[change.model]).length === 0) {
                          delete changes[change.model];
                        }
                      }
                    }
                  }
                }

                return ((props.children as any)[0] as mergeRenderprops<T>)({
                  changes: mapObject(changes, (namespace) =>
                    Object.values(namespace)
                  ) as changes<T>,
                  merge,
                });
              }}
            </Props>
          )}
        </dataContext.Consumer>
      );
    }
  };
