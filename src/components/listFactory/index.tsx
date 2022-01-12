import type { ApplicationElement, Context, Props } from "@plusnew/core";
import plusnew, { Component } from "@plusnew/core";
import type { entitiesContainerTemplate, entityEmpty } from "../../types";
import type {
  dataActions,
  dataState,
  repositoryState,
} from "../../types/dataContext";

type listRenderProps<
  T extends entitiesContainerTemplate,
  U extends keyof T
> = (value: {
  isLoading: boolean;
  items: entityEmpty<U, T[U]["item"]["id"]>[];
  totalCount: number;
  isEmpty: boolean;
}) => ApplicationElement;

type props<T extends entitiesContainerTemplate, U extends keyof T> = {
  model: U;
  parameter: T[U]["listParameter"] | null;
  children: listRenderProps<T, U>;
};

export default <T extends entitiesContainerTemplate>(
  dataContext: Context<dataState<T> & repositoryState<T>, dataActions<T>>
) =>
  class List<U extends keyof T> extends Component<props<T, U>> {
    static displayName = "StateList";
    render(Props: Props<props<T, U>>) {
      return (
        <dataContext.Consumer>
          {(dataState) => (
            <Props>
              {(props) => {
                if (props.parameter === null) {
                  return (
                    (props.children as any)[0] as listRenderProps<T, keyof T>
                  )({
                    isEmpty: true,
                    items: [],
                    totalCount: 0,
                    isLoading: false,
                  });
                }
                const view = dataState.getListCache({
                  model: props.model,
                  parameter: props.parameter,
                });

                if (view.hasError) {
                  throw view.error;
                }

                return (
                  (props.children as any)[0] as listRenderProps<T, keyof T>
                )({
                  isEmpty: false,
                  ...view,
                });
              }}
            </Props>
          )}
        </dataContext.Consumer>
      );
    }
  };
