import plusnew, { Component, store } from "@plusnew/core";
import type { entitiesContainerTemplate, entityEmpty } from "../../types";
import type { Context, ApplicationElement, Props } from "@plusnew/core";

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
  items: T[U]["item"][] | entityEmpty<U>[];
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

type storeEntity<T extends entitiesContainerTemplate, U extends keyof T> =
  | {
      hasError: false;
      isDeleted: false;
      payload: T[U]["item"];
    }
  | {
      hasError: true;
      error: any;
    };

type storeList = {
  [query: string]:
    | {
        hasError: false;
        ids: string[];
        totalCount: number;
      }
    | {
        hasError: true;
        error: any;
      };
};

type syncReadListRequest<
  T extends entitiesContainerTemplate,
  U extends keyof T
> = (
  request: listRequestParameter<T, U>
) =>
  | {
      hasError: true;
      error: any;
    }
  | {
      hasCache: true;
      hasError: false;
      isLoading: boolean;
      items: entityEmpty<U>[];
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
> = (
  request: itemRequestParameter<T, U>
) =>
  | {
      hasError: true;
      error: any;
    }
  | {
      hasError: false;
      hasCache: true;
      isLoading: boolean;
      item: T[U]["item"];
    }
  | { hasError: false; hasCache: false; isLoading: boolean };

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
    [model in keyof T]?: {
      [id: string]: storeEntity<T, model>;
    };
  };
};

type listInsertAction<
  T extends entitiesContainerTemplate,
  U extends keyof T
> = {
  type: "LIST_INSERT";
  model: U;
  query: string;
  payload: {
    items: T[U]["item"][] | entityEmpty<U>[];
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
  | listInsertAction<T, keyof T>
  | listErrorAction<T, keyof T>;

function getQueryAsString(parameter: Record<string, unknown>) {
  return JSON.stringify(parameter);
}

export default <T extends entitiesContainerTemplate>(
  context: Context<repositoryState<T>, repositoryActions<T>>
) =>
  class Repository extends Component<props<T>> {
    static displayName = __dirname;
    render(Props: Props<props<T>>) {
      let loadingLists: [keyof T, string][] = [];
      let loadingItems: [keyof T, number | string][] = [];

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
        const isLoading =
          loadingItems.find(
            ([model, id]) => model === request.model && id === request.id
          ) !== undefined;

        const repositoryState = repository.getState();

        if (
          repositoryState.entities[request.model] !== undefined &&
          request.id in repositoryState.entities[request.model]
        ) {
          const result: storeEntity<T, keyof T> = (repositoryState.entities[
            request.model
          ] as any)[request.id];

          if (result.hasError) {
            return {
              hasError: true,
              error: result.error,
            };
          }

          return {
            hasError: false,
            hasCache: true,
            isLoading,
            item: result.payload,
          };
        }
        return {
          hasError: false,
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
        loadingItems.push([request.model, request.id]);

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
            (model === request.model && id === request.id) === false
        );

        if (result) {
          repository.dispatch({
            type: "ITEMS_INSERT",
            payload: {
              [request.model]: {
                [request.id]: {
                  isDeleted: false,
                  payload: result,
                  hasError: false,
                },
              },
            },
          } as itemsInsertAction<T>);
        } else {
          repository.dispatch({
            type: "ITEMS_INSERT",
            payload: {
              [request.model]: {
                [request.id]: {
                  hasError: true,
                  error: error,
                },
              },
            },
          } as itemsInsertAction<T>);
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
                        ...Object.fromEntries(
                          (action.payload.items as T[keyof T]["item"][]).map(
                            (item) => [
                              item.id,
                              {
                                hasError: false,
                                isDeleted: false,
                                payload: item,
                              },
                            ]
                          )
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
                      ids: (action.payload.items as entityEmpty<keyof T>[]).map(
                        (item) => item.id
                      ),
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
              Object.entries(action.payload).forEach(([model, items]) => {
                newEntities[model as keyof T] = {
                  ...previouState.entities[model],
                  ...items,
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

          /* istanbul ignore next */
          throw new Error("No such action");
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
