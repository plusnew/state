import plusnew, { Component, store } from "@plusnew/core";
import type { entitiesContainerTemplate, entityEmpty } from "../../types";
import type { Context, ApplicationElement, Props } from "@plusnew/core";

type asyncReadListRequest<
  T extends entitiesContainerTemplate,
  U extends keyof T
> = (request: {
  model: U;
  parameter: T[U]["listParameter"];
}) => Promise<{
  items: T[U]["item"][] | entityEmpty<U>[];
  totalCount: number;
}>;

type asyncReadItemRequest<
  T extends entitiesContainerTemplate,
  U extends keyof T
> = (request: { model: U; id: string }) => Promise<T[U]["item"]>;

type props<T extends entitiesContainerTemplate> = {
  children: ApplicationElement;
  requests: {
    read: {
      list: asyncReadListRequest<T, keyof T>;
      item: asyncReadItemRequest<T, keyof T>;
    };
  };
};

type storeEntity<T extends entitiesContainerTemplate, U extends keyof T> = {
  isDeleted: false;
  payload: T[U]["item"];
};

type storeList = {
  [query: string]: {
    ids: string[];
    totalCount: number;
  };
};

type syncReadListRequest<
  T extends entitiesContainerTemplate,
  U extends keyof T
> = (request: {
  model: U;
  parameter: T[U]["listParameter"];
}) =>
  | {
      hasCache: true;
      isLoading: boolean;
      items: entityEmpty<U>[];
      totalCount: number;
    }
  | {
      hasCache: false;
      isLoading: boolean;
    };

type syncReadItemRequest<
  T extends entitiesContainerTemplate,
  U extends keyof T
> = (request: {
  model: U;
  id: string;
}) =>
  | { hasCache: true; isLoading: boolean; item: storeEntity<T, U> }
  | { hasCache: false; isLoading: boolean };

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
  fetchList: asyncReadListRequest<T, keyof T>;
  fetchItem: asyncReadItemRequest<T, keyof T>;
};

type insertItemsAction<T extends entitiesContainerTemplate> = {
  type: "INSERT_ITEMS";
  payload: {
    [model in keyof T]?: {
      [id: string]: storeEntity<T, model>;
    };
  };
};

type insertListAction<
  T extends entitiesContainerTemplate,
  U extends keyof T
> = {
  type: "INSERT_LIST";
  model: U;
  query: string;
  payload: {
    items: (T[U]["item"] | entityEmpty<U>)[];
    totalCount: number;
  };
};

export type repositoryActions<T extends entitiesContainerTemplate> =
  | insertItemsAction<T>
  | insertListAction<T, keyof T>;

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
      let loadingItems: [keyof T, string][] = [];

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

          return {
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
          return {
            hasCache: true,
            isLoading,
            item: (repositoryState.entities[request.model] as any)[request.id],
          };
        }
        return {
          hasCache: false,
          isLoading: isLoading,
        };
      };

      // Enforces to request new list
      const fetchList: asyncReadListRequest<T, keyof T> = async (request) => {
        const queryString = getQueryAsString(request.parameter);
        loadingLists.push([request.model, queryString]);
        const result = await Props.getState().requests.read.list(request);

        loadingLists = loadingLists.filter(
          ([model, query]) =>
            (model === request.model && query === queryString) === false
        );

        repository.dispatch({
          type: "INSERT_LIST",
          model: request.model,
          query: queryString,
          payload: result,
        });

        return result;
      };

      // Enforces to request new item
      const fetchItem: asyncReadItemRequest<T, keyof T> = async (request) => {
        loadingItems.push([request.model, request.id]);

        const result = await Props.getState().requests.read.item(request);

        loadingItems = loadingItems.filter(
          ([model, id]) =>
            (model === request.model && id === request.id) === false
        );

        repository.dispatch({
          type: "INSERT_ITEMS",
          payload: {
            [request.model]: {
              [result.id]: {
                isDeleted: false,
                payload: result,
              },
            },
          },
        } as insertItemsAction<T>);

        return result;
      };

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
          if (action.type === "INSERT_LIST") {
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
                    ids: action.payload.items.map((item) => item.id),
                    totalCount: action.payload.totalCount,
                  },
                },
              },
            };
          }

          if (action.type === "INSERT_ITEMS") {
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
