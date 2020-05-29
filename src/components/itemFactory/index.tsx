import plusnew, {
  ApplicationElement,
  Component,
  Context,
  Props,
} from "@plusnew/core";
import type ComponentInstance from "@plusnew/core/src/instances/types/Component/Instance";
import type { entitiesContainerTemplate } from "../../types";
import type { branchActions, branchState } from "../branchFactory";
import type { repositoryActions, repositoryState } from "../repositoryFactory";

type interact<T extends entitiesContainerTemplate, U extends keyof T> = {
  commitAttributes: (attributes: Partial<T[U]["item"]["attributes"]>) => void;
  commitRelationships: (
    relationships: Partial<T[U]["item"]["relationships"]>
  ) => void;
};

type itemRenderProps<T extends entitiesContainerTemplate, U extends keyof T> = (
  value:
    | { isLoading: false; item: T[U]["item"] }
    | { isLoading: true; item: T[U]["item"] | null },
  interact: interact<T, U>
) => ApplicationElement;

type props<T extends entitiesContainerTemplate, U extends keyof T> = {
  model: U;
  id: T[U]["item"]["id"];
  children: itemRenderProps<T, U>;
};

export default <T extends entitiesContainerTemplate>(
  repositoryContext: Context<repositoryState<T>, repositoryActions<T>>,
  branchContext: Context<branchState<T>, branchActions<T>>
) =>
  class Item<U extends keyof T> extends Component<props<T, U>> {
    static displayName = __dirname;
    render(
      Props: Props<props<T, U>>,
      componentInstance: ComponentInstance<any, any, any>
    ) {
      const { dispatch: branchDispatch } = branchContext.findProvider(
        componentInstance
      );

      const interact: interact<T, U> = {
        commitAttributes: (attributes) => {
          branchDispatch({
            type: "ATTRIBUTES_CHANGE",
            model: Props.getState().model,
            id: Props.getState().id,
            payload: attributes,
          });
        },
        commitRelationships: (relationships) => {
          branchDispatch({
            type: "RELATIONSHIPS_CHANGE",
            model: Props.getState().model,
            id: Props.getState().id,
            payload: relationships,
          });
        },
      };

      return (
        <repositoryContext.Consumer>
          {(_repositoryState) => (
            <branchContext.Consumer>
              {(branchState) => (
                <Props>
                  {(props) => {
                    const view = branchState.getItem({
                      model: props.model,
                      id: props.id,
                    });

                    if (view.hasError) {
                      throw view.error;
                    }

                    return ((props.children as any)[0] as itemRenderProps<
                      T,
                      U
                    >)(view, interact);
                  }}
                </Props>
              )}
            </branchContext.Consumer>
          )}
        </repositoryContext.Consumer>
      );
    }
  };
