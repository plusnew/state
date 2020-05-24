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
> = (request: { type: U; id: string }) => Promise<T[U]["item"]>;

type props<T extends entitiesContainerTemplate> = {
  children: ApplicationElement;
  requests: {
    read: {
      list: asyncReadListRequest<T, keyof T>;
      item: asyncReadItemRequest<T, keyof T>;
    };
  };
};

type entity<T extends entitiesContainerTemplate, U extends keyof T> = {
  isDeleted: false;
  payload: T[U]["item"];
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
      items: T[U]["item"][] | entityEmpty<U>[];
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
  | { hasCache: true; isLoading: boolean; item: T[U]["item"] }
  | { hasCache: false; isLoading: boolean };

export type repositoryState<T extends entitiesContainerTemplate> = {
  entities: Partial<
    {
      [model in keyof T]: {
        [id: string]: entity<T, model>;
      };
    }
  >;
  lists: Partial<
    {
      [model in keyof T]: {
        [parameter: string]:
          | {
              ids: string[];
              totalCount: number;
            }
          | {
              error: any;
            };
      };
    }
  >;
  getListCache: syncReadListRequest<T, keyof T>;
  getItemCache: syncReadItemRequest<T, keyof T>;
  fetchList: () => null;
  fetchItem: () => null;
};

type insertAction<T extends entitiesContainerTemplate> = {
  type: "INSERT_ITEMS";
  payload: [entity<T, keyof T>];
};

export type repositoryActions<
  T extends entitiesContainerTemplate
> = insertAction<T>;

export default <T extends entitiesContainerTemplate>(
  context: Context<repositoryState<T>, repositoryActions<T>>
) =>
  class Repository extends Component<props<T>> {
    static displayName = __dirname;
    render(Props: Props<props<T>>) {
      // Returns ids, in case cache is present
      const getListCache: syncReadListRequest<T, keyof T> = () => {
        return {
          hasCache: false,
          isLoading: false,
        };
      };
      // Returns item in case cache is present
      const getItemCache: syncReadItemRequest<T, keyof T> = () => {
        return {
          hasCache: false,
          isLoading: false,
        };
      };

      // Enforces to request new list
      const fetchList = () => {
        return null;
      };

      // Enforces to request new item
      const fetchItem = () => {
        return null;
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
        (previouState) => previouState
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
