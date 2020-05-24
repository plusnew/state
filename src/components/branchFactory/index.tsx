import plusnew, {
  Component,
  ApplicationElement,
  Props,
  Context,
  store,
} from "@plusnew/core";
import type { entitiesContainerTemplate, entityEmpty } from "../../types";
import type { repositoryState, repositoryActions } from "../repositoryFactory";
import type ComponentInstance from "@plusnew/core/src/instances/types/Component/Instance";
import type Instance from "@plusnew/core/src/instances/types/Instance";

type changedAttributes<
  T extends entitiesContainerTemplate,
  U extends keyof T
> = {
  changeType: "ATTRIBUTES_CHANGE";
  entityType: U;
  id: string;
  payload: Partial<T[U]["item"]["attributes"]>;
};

type syncReadListRequest<
  T extends entitiesContainerTemplate,
  U extends keyof T
> = (request: {
  model: U;
  parameter: T[U]["listParameter"];
}) =>
  | {
      hasError: false;
      isLoading: boolean;
      items: T[U]["item"][] | entityEmpty<U>[];
      totalCount: number;
    }
  | {
      hasError: true;
      error: any;
    };

type syncReadItemRequest<
  T extends entitiesContainerTemplate,
  U extends keyof T
> = (request: {
  model: U;
  id: string;
}) =>
  | { hasError: true; error: any }
  | { hasError: false; isLoading: false; item: T[U]["item"] }
  | { hasError: false; isLoading: true; item: T[U]["item"] | null };

export type branchState<T extends entitiesContainerTemplate> = {
  changeLog: changedAttributes<T, keyof T>[];
  currentChangePosition: number | null;
  getList: syncReadListRequest<T, keyof T>;
  getItem: syncReadItemRequest<T, keyof T>;
};

export type branchActions<
  T extends entitiesContainerTemplate
> = changedAttributes<T, keyof T>;

type props<> = {
  children: ApplicationElement;
};

export default <T extends entitiesContainerTemplate>(
  repositoryContext: Context<repositoryState<T>, repositoryActions<T>>,
  branchContext: Context<branchState<T>, branchActions<T>>
) =>
  class Item extends Component<props> {
    static displayName = __dirname;
    render(
      Props: Props<props>,
      componentInstance: ComponentInstance<props, any, any>
    ) {
      const repository = repositoryContext.findProvider(
        componentInstance as Instance<any, any>
      );

      const getList: syncReadListRequest<T, keyof T> = (request) => {
        const repositoryState = repository.getState();

        const result = repositoryState.getListCache(request);

        if (result.hasError) {
          return result;
        }
        if (result.hasCache) {
          return {
            hasError: false,
            isLoading: result.isLoading,
            items: result.items,
            totalCount: result.totalCount,
          };
        }

        if (result.isLoading === false) {
          repositoryState.fetchList(request);
        }

        return {
          hasError: false,
          isLoading: true,
          items: [],
          totalCount: 0,
        };
      };

      const getItem: syncReadItemRequest<T, keyof T> = (request) => {
        const repositoryState = repository.getState();
        const result = repositoryState.getItemCache(request);

        if (result.hasError) {
          return result;
        }
        if (result.hasCache) {
          return {
            hasError: false,
            isLoading: result.isLoading,
            item: result.item,
          };
        }

        if (result.isLoading === false) {
          repositoryState.fetchItem(request);
        }

        return {
          hasError: false,
          isLoading: true,
          item: null,
        };
      };

      const branchStore = store<branchState<T>, branchActions<T>>(
        {
          changeLog: [],
          currentChangePosition: null,
          getList,
          getItem,
        },
        (previousState) => previousState
      );

      return (
        <branchStore.Observer>
          {(branchState) => (
            <branchContext.Provider
              state={branchState}
              dispatch={branchStore.dispatch}
            >
              <Props>{(props) => props.children}</Props>
            </branchContext.Provider>
          )}
        </branchStore.Observer>
      );
    }
  };