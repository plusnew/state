import type { ApplicationElement, Context, Props } from "@plusnew/core";
import plusnew, { Component, store } from "@plusnew/core";
import type ComponentInstance from "@plusnew/core/src/instances/types/Component/Instance";
import type Instance from "@plusnew/core/src/instances/types/Instance";
import type { entitiesContainerTemplate } from "../../types";
import type {
  dataActions,
  dataState,
  repositoryState,
} from "../../types/dataContext";
import idSerializer from "../../util/idSerializer";

type props = {
  children: ApplicationElement;
};

export default <T extends entitiesContainerTemplate>(
  dataContext: Context<dataState<T> & repositoryState<T>, dataActions<T>>
) =>
  class Branch extends Component<props> {
    static displayName = "StateBranch";
    render(
      Props: Props<props>,
      componentInstance: ComponentInstance<props, any, any>
    ) {
      const dataContextInstance = dataContext.findProvider(
        componentInstance as Instance<any, any>
      );

      const getListCache = dataContextInstance.getState().getListCache;

      const getItemCache: dataState<T>["getItemCache"] = (request) => {
        const dataState = dataContextInstance.getState();
        const result = dataState.getItemCache(request);
        const requestId = idSerializer(request.id);

        if (result.hasError) {
          return result;
        }

        if (result.item === null) {
          return result;
        } else {
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
      };

      const branchStore = store<dataState<T>, dataActions<T>>(
        {
          changeLog: [],
          getListCache,
          getItemCache,
        },
        (previousState, action) => {
          switch (action.type) {
            case "ATTRIBUTES_CHANGE":
            case "RELATIONSHIPS_CHANGE":
              return {
                changeLog: [...previousState.changeLog, action],
                getListCache,
                getItemCache,
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
                getListCache,
                getItemCache,
              };
            }
            default:
              dataContextInstance.dispatch(action);
              return previousState;
          }
        }
      );

      return (
        <branchStore.Observer>
          {(branchState) => (
            <dataContext.Consumer>
              {(parentDataState) => (
                <dataContext.Provider
                  state={{ ...parentDataState, ...branchState }}
                  dispatch={branchStore.dispatch}
                >
                  <Props>{(props) => props.children}</Props>
                </dataContext.Provider>
              )}
            </dataContext.Consumer>
          )}
        </branchStore.Observer>
      );
    }
  };
