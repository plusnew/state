import plusnew, {
  ApplicationElement,
  Component,
  Props,
  store,
} from "@plusnew/core";
import type { Context } from "@plusnew/core";
import type ComponentInstance from "@plusnew/core/src/instances/types/Component/Instance";
import type Instance from "@plusnew/core/src/instances/types/Instance";
import type { entitiesContainerTemplate, entityEmpty } from "../../types";
import type { repositoryActions, repositoryState } from "../repositoryFactory";
import idSerializer from "../../util/idSerializer";

type changedAttributes<
  T extends entitiesContainerTemplate,
  U extends keyof T
> = {
  type: "ATTRIBUTES_CHANGE";
  model: U;
  id: string;
  payload: Partial<T[U]["item"]["attributes"]>;
};

type changedRelationships<
  T extends entitiesContainerTemplate,
  U extends keyof T
> = {
  type: "RELATIONSHIPS_CHANGE";
  model: U;
  id: string;
  payload: Partial<T[U]["item"]["relationships"]>;
};

type syncReadListRequest<
  T extends entitiesContainerTemplate,
  U extends keyof T
> = (request: { model: U; parameter: T[U]["listParameter"] }) =>
  | {
      hasError: false;
      isLoading: boolean;
      items: T[U]["item"][] | entityEmpty<U, T[U]["item"]["id"]>[];
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
  id: T[U]["item"]["id"];
}) =>
  | { hasError: true; error: any }
  | { hasError: false; isLoading: false; item: T[U]["item"] }
  | { hasError: false; isLoading: true; item: T[U]["item"] | null };

type changeLog<T extends entitiesContainerTemplate, U extends keyof T> =
  | changedAttributes<T, U>
  | changedRelationships<T, U>;

export type branchState<T extends entitiesContainerTemplate> = {
  changeLog: changeLog<T, keyof T>[];
  currentChangePosition: number | null;
  getList: syncReadListRequest<T, keyof T>;
  getItem: syncReadItemRequest<T, keyof T>;
};

type resetChangelog<T extends entitiesContainerTemplate> = {
  type: "RESET_CHANGELOG";
  payload: {
    [U in keyof T]: string[];
  };
};

export type branchActions<T extends entitiesContainerTemplate> =
  | changeLog<T, keyof T>
  | resetChangelog<T>;

type props = {
  children: ApplicationElement;
};

export default <T extends entitiesContainerTemplate>(
  repositoryContext: Context<repositoryState<T>, repositoryActions<T>>,
  branchContext: Context<branchState<T>, branchActions<T>>
) =>
  class Branch extends Component<props> {
    static displayName = "StateBranch";
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
          let isLoading = result.isLoading;
          if (result.hasInvalidCache === true && isLoading === false) {
            isLoading = true;
            repositoryState.fetchList(request);
          }

          return {
            hasError: false,
            isLoading: isLoading,
            items: result.items.filter((item) => {
              const itemCache = repositoryState.getItemCache({
                model: item.model,
                id: item.id,
              });

              return !itemCache.isDeleted;
            }),
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
        const requestId = idSerializer(request.id);

        if (result.hasError) {
          return result;
        }

        if (result.isDeleted) {
          return {
            hasError: true,
            error: new Error("The item was deleted"),
          };
        }

        if (result.hasCache) {
          let attributeChanges = {};
          let relationshipChanges = {};

          const changeLog = branchStore.getState().changeLog;
          for (let i = 0; i < changeLog.length; i++) {
            const change = changeLog[i];
            if (change.model === result.item.model && change.id === requestId) {
              switch (change.type) {
                case "ATTRIBUTES_CHANGE": {
                  attributeChanges = {
                    ...attributeChanges,
                    ...change.payload,
                  };
                  break;
                }
                case "RELATIONSHIPS_CHANGE": {
                  relationshipChanges = {
                    ...relationshipChanges,
                    ...change.payload,
                  };
                  break;
                }
              }
            }
          }

          return {
            hasError: false,
            isLoading: result.isLoading,
            item: {
              model: result.item.model,
              id: request.id,
              attributes: {
                ...result.item.attributes,
                ...attributeChanges,
              },
              relationships: {
                ...result.item.relationships,
                ...relationshipChanges,
              },
            },
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
        (previousState, action) => {
          switch (action.type) {
            case "ATTRIBUTES_CHANGE":
            case "RELATIONSHIPS_CHANGE":
              return {
                changeLog: [...previousState.changeLog, action],
                currentChangePosition: previousState.currentChangePosition,
                getList,
                getItem,
              };

            case "RESET_CHANGELOG": {
              return {
                changeLog: previousState.changeLog.filter(
                  (change) =>
                    (change.model in action.payload &&
                      action.payload[change.model].find(
                        (resetChangeId) => change.id === resetChangeId
                      ) !== undefined) === false
                ),
                currentChangePosition: previousState.currentChangePosition,
                getList,
                getItem,
              };
            }
            default:
              throw new Error("No such action");
          }
        }
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
