import plusnew, {
  Component,
  ApplicationElement,
  Props,
  Context,
} from "@plusnew/core";
import type { entitiesContainerTemplate } from "../../types";
import type { branchState, branchActions } from "../branchFactory";
import type { repositoryState, repositoryActions } from "../repositoryFactory";

type itemRenderProps<T extends entitiesContainerTemplate, U extends keyof T> = (
  value:
    | { isLoading: false; item: T[U]["item"] }
    | { isLoading: true; item: T[U]["item"] | null }
) => ApplicationElement;

type props<T extends entitiesContainerTemplate, U extends keyof T> = {
  model: U;
  id: string;
  children: itemRenderProps<T, U>;
};

export default <T extends entitiesContainerTemplate>(
  repositoryContext: Context<repositoryState<T>, repositoryActions<T>>,
  branchContext: Context<branchState<T>, branchActions<T>>
) =>
  class Item<U extends keyof T> extends Component<props<T, U>> {
    static displayName = __dirname;
    render(Props: Props<props<T, U>>) {
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

                    return ((props.children as any)[0] as itemRenderProps<
                      T,
                      U
                    >)(view);
                  }}
                </Props>
              )}
            </branchContext.Consumer>
          )}
        </repositoryContext.Consumer>
      );
    }
  };
