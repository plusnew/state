import plusnew, { Component, store } from "@plusnew/core";
import type { ApplicationElement, Context, Props } from "@plusnew/core";
import type {
  entitiesContainerTemplate,
  entityEmpty,
  idTemplate,
} from "../../types";
import { mapObject } from "../../util/forEach";
import { fromEntries } from "../../util/fromEntries";
import idSerializer from "../../util/idSerializer";

type listRequestParameter<
  T extends entitiesContainerTemplate,
  U extends keyof T
> = {
  model: U;
  parameter: T[U]["listParameter"];
};

type itemRequestParameter<
  T extends entitiesContainerTemplate,
  U extends keyof T
> = {
  model: U;
  id: T[U]["item"]["id"];
};

type listResponse<T extends entitiesContainerTemplate, U extends keyof T> = {
  items: T[U]["item"][] | entityEmpty<U, T[U]["item"]["id"]>[];
  totalCount: number;
};

type asyncReadListRequest<
  T extends entitiesContainerTemplate,
  U extends keyof T
> = (parameter: T[U]["listParameter"]) => Promise<listResponse<T, U>>;

type asyncReadItemRequest<
  T extends entitiesContainerTemplate,
  U extends keyof T
> = (id: T[U]["item"]["id"]) => Promise<T[U]["item"]>;

type props<T extends entitiesContainerTemplate> = {
  children: ApplicationElement;
  requests: {
    [K in keyof T]: {
      readList: asyncReadListRequest<T, K>;
      readItem: asyncReadItemRequest<T, K>;
    };
  };
};

export type storeEntity<
  T extends entitiesContainerTemplate,
  U extends keyof T
> =
  | {
      hasError: false;
      isDeleted: false;
      payload: T[U]["item"];
    }
  | {
      hasError: true;
      error: any;
      isDeleted: false;
    }
  | {
      hasError: false;
      isDeleted: true;
    };

type storeList = {
  [query: string]:
    | {
        hasError: false;
        ids: string[];
        totalCount: number;
        hasInvalidCache: boolean;
      }
    | {
        hasError: true;
        error: any;
      };
};

type syncReadListRequest<
  T extends entitiesContainerTemplate,
  U extends keyof T
> = (request: listRequestParameter<T, U>) =>
  | {
      hasError: true;
      error: any;
    }
  | {
      hasCache: true;
      hasError: false;
      hasInvalidCache: boolean;
      isLoading: boolean;
      items: entityEmpty<U, T[U]["item"]["id"]>[];
      totalCount: number;
    }
  | {
      hasCache: false;
      hasError: false;
      isLoading: boolean;
    };

type syncReadItemRequest<
  T extends entitiesContainerTemplate,
  U extends keyof T
> = (request: itemRequestParameter<T, U>) =>
  | {
      isDeleted: true;
      hasError: false;
    }
  | {
      hasError: true;
      isDeleted: false;
      error: any;
    }
  | {
      isDeleted: false;
      hasError: false;
      hasCache: true;
      isLoading: boolean;
      item: T[U]["item"];
    }
  | { hasError: false; hasCache: false; isDeleted: false; isLoading: boolean };

export type repositoryState<T extends entitiesContainerTemplate> = {
  entities: {
    [model in keyof T]?: {
      [id: string]: storeEntity<T, model>;
    };
  };
  lists: {
    [model in keyof T]?: storeList;
  };
  getListCache: syncReadListRequest<T, keyof T>;
  getItemCache: syncReadItemRequest<T, keyof T>;
  fetchList: (request: listRequestParameter<T, keyof T>) => void;
  fetchItem: (request: itemRequestParameter<T, keyof T>) => void;
};

type itemsInsertAction<T extends entitiesContainerTemplate> = {
  type: "ITEMS_INSERT";
  payload: {
    items: {
      [U in keyof T]?: {
        [id: string]:
          | { isDeleted: false; item: T[U]["item"] }
          | { isDeleted: true };
      };
    };
    invalidateInvolvedListCahes: boolean;
  };
};

type itemsInsertErrorAction<T extends entitiesContainerTemplate> = {
  type: "ITEMS_INSERT_ERROR";
  payload: {
    [U in keyof T]?: {
      [id: string]: any;
    };
  };
};

type listInsertAction<T extends entitiesContainerTemplate, U extends keyof T> =
  {
    type: "LIST_INSERT";
    model: U;
    query: string;
    payload: {
      items: T[U]["item"][] | entityEmpty<U, T[U]["item"]["id"]>[];
      totalCount: number;
    };
  };

type listErrorAction<T extends entitiesContainerTemplate, U extends keyof T> = {
  type: "LIST_ERROR";
  model: U;
  query: string;
  payload: any;
};

export type repositoryActions<T extends entitiesContainerTemplate> =
  | itemsInsertAction<T>
  | itemsInsertErrorAction<T>
  | listInsertAction<T, keyof T>
  | listErrorAction<T, keyof T>;

function getQueryAsString(parameter: Record<string, unknown>) {
  return JSON.stringify(parameter);
}

export default <T extends entitiesContainerTemplate>(
  context: Context<repositoryState<T>, repositoryActions<T>>
) => {
  function getEntities(
    processingGroupedEnties: itemsInsertAction<T>["payload"]["items"],
    groupedEntities: repositoryState<T>["entities"]
  ) {
    Object.entries(processingGroupedEnties).forEach(
      ([model, processingEntities]: [
        keyof T,
        {
          [index: string]:
            | { isDeleted: false; item: T[keyof T]["item"] }
            | { isDeleted: true };
        }
      ]) => {
        if (model in groupedEntities) {
          // Breaking reference
          groupedEntities[model] = { ...groupedEntities[model] };
        } else {
          groupedEntities[model] = {};
        }

        return Object.entries(processingEntities).forEach(
          ([id, processingEntity]) => {
            (groupedEntities as any)[model][id] = {
              hasError: false,
              isDeleted: processingEntity.isDeleted,
              hasInvalidCache: false,
              payload: processingEntity.isDeleted
                ? undefined
                : {
                    id: processingEntity.item.id,
                    model: processingEntity.item.model,
                    attributes: processingEntity.item.attributes,
                    relationships: mapObject(
                      processingEntity.item.relationships,
                      (relationhip) => {
                        let result;
                        const newGroupedEntities: any = {};

                        if (Array.isArray(relationhip)) {
                          result = relationhip.map((relationshipEntity) => {
                            if ("attributes" in relationshipEntity) {
                              if (
                                relationshipEntity.model in
                                  newGroupedEntities ===
                                false
                              ) {
                                newGroupedEntities[relationshipEntity.model] =
                                  {};
                              }

                              (newGroupedEntities as any)[
                                relationshipEntity.model
                              ][idSerializer(relationshipEntity.id)] = {
                                isDeleted: false,
                                item: {
                                  id: relationshipEntity.id,
                                  model: relationshipEntity.model,
                                  attributes: relationshipEntity.attributes,
                                  relationships:
                                    relationshipEntity.relationships,
                                },
                              };
                            }

                            return {
                              id: relationshipEntity.id,
                              model: relationshipEntity.model,
                            };
                          });
                        } else if (relationhip === null) {
                          result = null;
                        } else {
                          if ("attributes" in relationhip) {
                            if (
                              relationhip.model in newGroupedEntities ===
                              false
                            ) {
                              newGroupedEntities[relationhip.model] = {};
                            }
                            newGroupedEntities[relationhip.model][
                              idSerializer(relationhip.id)
                            ] = {
                              isDeleted: false,
                              item: {
                                id: relationhip.id as any,
                                model: relationhip.model,
                                attributes: relationhip.attributes,
                                relationships: relationhip.relationships,
                              },
                            } as any;
                          }

                          result = {
                            id: relationhip.id,
                            model: relationhip.model,
                          };
                        }

                        getEntities(newGroupedEntities, groupedEntities);
                        return result;
                      }
                    ),
                  },
            } as const;
          }
        );
      }
    );
  }
  return class Repository extends Component<props<T>> {
    static displayName = __dirname;
    render(Props: Props<props<T>>) {
      let loadingLists: [keyof T, string][] = [];
      let loadingItems: [keyof T, number | string][] = [];

      class Debouncer {
        constructor() {
          requestAnimationFrame(() => {
            debouncer = new Debouncer();

            if (Object.keys(this.insertedItems).length > 0) {
              repository.dispatch({
                type: "ITEMS_INSERT",
                payload: {
                  items: this.insertedItems,
                  invalidateInvolvedListCahes: false,
                },
              } as itemsInsertAction<T>);
            }
          });
        }

        insertedItems: itemsInsertAction<T>["payload"]["items"] = {};

        add(item: T[keyof T]["item"]) {
          if (item.model in this.insertedItems === false) {
            (this.insertedItems as any)[item.model] = {};
          }
          const requestId = idSerializer(item.id);

          (this.insertedItems[item.model] as any)[requestId] = {
            isDeleted: false,
            item,
          };
        }
      }

      let debouncer = new Debouncer();

      // Returns ids, in case cache is present
      const getListCache: syncReadListRequest<T, keyof T> = (request) => {
        const queryString = getQueryAsString(request.parameter);

        const repositoryState = repository.getState();
        const isLoading =
          loadingLists.find(
            ([model, query]) => model === request.model && query === queryString
          ) !== undefined;

        if (
          repositoryState.lists[request.model] !== undefined &&
          queryString in repositoryState.lists[request.model]
        ) {
          const result = (repositoryState.lists[request.model] as storeList)[
            queryString
          ];

          if (result.hasError) {
            return {
              hasError: true,
              error: result.error,
            };
          }

          return {
            hasError: false,
            hasCache: true,
            hasInvalidCache: result.hasInvalidCache,
            isLoading,
            items: result.ids.map((id) => ({
              id: id,
              model: request.model,
            })),
            totalCount: result.totalCount,
          };
        }
        return {
          hasError: false,
          hasCache: false,
          isLoading: isLoading,
        };
      };

      // Returns item in case cache is present
      const getItemCache: syncReadItemRequest<T, keyof T> = (request) => {
        const requestId = idSerializer(request.id);
        const isLoading =
          loadingItems.find(
            ([model, id]) => model === request.model && id === requestId
          ) !== undefined;

        const repositoryState = repository.getState();

        if (
          repositoryState.entities[request.model] !== undefined &&
          requestId in repositoryState.entities[request.model]
        ) {
          const result: storeEntity<T, keyof T> = (
            repositoryState.entities[request.model] as any
          )[requestId];

          if (result.hasError) {
            return {
              hasError: true,
              error: result.error,
              isDeleted: false,
            };
          }

          if (result.isDeleted) {
            return {
              isDeleted: true,
              hasError: false,
            };
          }

          return {
            hasError: false,
            isDeleted: false,
            hasCache: true,
            isLoading,
            item: result.payload,
          };
        }
        return {
          hasError: false,
          isDeleted: false,
          hasCache: false,
          isLoading: isLoading,
        };
      };

      // Enforces to request new list
      async function fetchList<U extends keyof T>(
        request: listRequestParameter<T, U>
      ) {
        const queryString = getQueryAsString(request.parameter);
        loadingLists.push([request.model, queryString]);

        let error;
        let result: listResponse<T, keyof T> | null = null;

        try {
          result = await Props.getState().requests[request.model].readList(
            request.parameter
          );
        } catch (catchedError) {
          error = catchedError;
        }
        loadingLists = loadingLists.filter(
          ([model, query]) =>
            (model === request.model && query === queryString) === false
        );

        if (result) {
          repository.dispatch({
            type: "LIST_INSERT",
            model: request.model,
            query: queryString,
            payload: result,
          });
        } else {
          repository.dispatch({
            type: "LIST_ERROR",
            model: request.model,
            query: queryString,
            payload: error,
          });
        }
      }

      // Enforces to request new item
      async function fetchItem<U extends keyof T>(
        request: itemRequestParameter<T, U>
      ) {
        const requestId = idSerializer(request.id);
        loadingItems.push([request.model, requestId]);

        let error;
        let result: T[U]["item"] | null = null;
        try {
          result = await Props.getState().requests[request.model].readItem(
            request.id
          );
        } catch (catchedError) {
          error = catchedError;
        }

        loadingItems = loadingItems.filter(
          ([model, id]) =>
            (model === request.model && id === requestId) === false
        );

        if (result) {
          debouncer.add(result);
        } else {
          repository.dispatch({
            type: "ITEMS_INSERT_ERROR",
            payload: {
              [request.model]: {
                [requestId]: error,
              },
            },
          } as itemsInsertErrorAction<T>);
        }

        return result;
      }

      const repository = store<repositoryState<T>, repositoryActions<T>>(
        {
          entities: {},
          lists: {},
          getListCache,
          getItemCache,
          fetchList,
          fetchItem,
        },
        (previouState, action) => {
          switch (action.type) {
            case "LIST_INSERT": {
              const newEntities =
                action.payload.items.length > 0 &&
                "attributes" in action.payload.items[0]
                  ? {
                      ...previouState.entities,
                      [action.model]: {
                        ...previouState.entities[action.model],
                        ...fromEntries(
                          action.payload.items as T[keyof T]["item"][],
                          (item) => [
                            `${idSerializer(item.id)}`,
                            {
                              hasError: false,
                              isDeleted: false,
                              payload: item,
                            },
                          ]
                        ),
                      },
                    }
                  : previouState.entities;

              return {
                entities: newEntities,
                getListCache,
                getItemCache,
                fetchList,
                fetchItem,
                lists: {
                  ...previouState.lists,
                  [action.model]: {
                    ...previouState.lists[action.model],
                    [action.query]: {
                      ids: (
                        action.payload.items as entityEmpty<
                          keyof T,
                          idTemplate
                        >[]
                      ).map((item) => item.id),
                      totalCount: action.payload.totalCount,
                      hasError: false,
                    },
                  },
                },
              };
            }

            case "LIST_ERROR": {
              return {
                entities: previouState.entities,
                getListCache,
                getItemCache,
                fetchList,
                fetchItem,
                lists: {
                  ...previouState.lists,
                  [action.model]: {
                    ...previouState.lists[action.model],
                    [action.query]: {
                      hasError: true,
                      error: action.payload,
                    },
                  },
                },
              };
            }

            case "ITEMS_INSERT": {
              const newEntities = { ...previouState.entities };
              getEntities(action.payload.items, newEntities); // This function mutates through reference the newEntities

              return {
                lists: action.payload.invalidateInvolvedListCahes
                  ? mapObject(
                      previouState.lists,
                      (listContainer, model) =>
                        (model in action.payload.items
                          ? mapObject(listContainer, (list) => ({
                              ...list,
                              hasInvalidCache: true,
                            }))
                          : listContainer) as storeList
                    )
                  : previouState.lists,
                getListCache,
                getItemCache,
                fetchList,
                fetchItem,
                entities: newEntities,
              };
            }

            case "ITEMS_INSERT_ERROR": {
              const newEntities = { ...previouState.entities };
              Object.entries(action.payload).forEach(([model, items]) => {
                newEntities[model as keyof T] = {
                  ...previouState.entities[model],
                  ...mapObject(
                    items,
                    (error) =>
                      ({
                        hasError: true,
                        isDeleted: false,
                        error: error,
                      } as const)
                  ),
                };
              });
              return {
                lists: previouState.lists,
                getListCache,
                getItemCache,
                fetchList,
                fetchItem,
                entities: newEntities,
              };
            }
          }
        }
      );

      return (
        <repository.Observer>
          {(repositoryState) => (
            <context.Provider
              state={repositoryState}
              dispatch={repository.dispatch}
            >
              <Props>{(props) => props.children}</Props>
            </context.Provider>
          )}
        </repository.Observer>
      );
    }
  };
};
