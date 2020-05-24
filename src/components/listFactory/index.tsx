import plusnew, {
  Component,
  ApplicationElement,
  Props,
  Context,
} from "@plusnew/core";
import type { entitiesContainerTemplate, entityEmpty } from "../../types";
import type { branchState, branchActions } from "../branchFactory";
import type { repositoryState, repositoryActions } from "../repositoryFactory";

type listRenderProps<T extends entitiesContainerTemplate> = (value: {
  isLoading: boolean;
  items: entityEmpty<keyof T>[];
  totalCount: number;
}) => ApplicationElement;

type props<T extends entitiesContainerTemplate, U extends keyof T> = {
  model: U;
  parameter: T[U]["listParameter"];
  children: listRenderProps<T>;
};

export default <T extends entitiesContainerTemplate>(
  repositoryContext: Context<repositoryState<T>, repositoryActions<T>>,
  branchContext: Context<branchState<T>, branchActions<T>>
) =>
  class List<U extends keyof T> extends Component<props<T, U>> {
    static displayName = __dirname;
    render(Props: Props<props<T, U>>) {
      return (
        <repositoryContext.Consumer>
          {(_repositoryContext) => (
            <branchContext.Consumer>
              {(branchState) => (
                <Props>
                  {(props) => {
                    const view = branchState.getList({
                      model: props.model,
                      parameter: props.parameter,
                    });

                    return ((props.children as any)[0] as listRenderProps<T>)(
                      view
                    );
                  }}
                </Props>
              )}
            </branchContext.Consumer>
          )}
        </repositoryContext.Consumer>
      );
    }
  };
