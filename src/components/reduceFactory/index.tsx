import type { ApplicationElement, Context, Props } from "@plusnew/core";
import plusnew, { Component } from "@plusnew/core";
import type { entitiesContainerTemplate } from "../../types";
import type {
  dataActions,
  dataState,
  repositoryState,
} from "../../types/dataContext";

type listRenderProps<A> = (value: {
  isEmpty: boolean;
  isLoading: boolean;
  accumulator: A;
}) => ApplicationElement;

type props<T extends entitiesContainerTemplate, U extends keyof T, A> = {
  model: U;
  initialValue: A;
  parameter: T[U]["listParameter"] | null;
  callback: (opt: {
    accumulator: A;
    currentValue: T[U]["item"];
    index: number;
  }) => A;
  children: listRenderProps<A>;
};

export default <T extends entitiesContainerTemplate>(
  dataContext: Context<dataState<T> & repositoryState<T>, dataActions<T>>
) =>
  class Reduce<U extends keyof T, A> extends Component<props<T, U, A>> {
    static displayName = "StateReduce";
    render(Props: Props<props<T, U, A>>) {
      return (
        <dataContext.Consumer>
          {(dataState) => (
            <Props>
              {(props) => {
                if (props.parameter === null) {
                  return ((props.children as any)[0] as listRenderProps<A>)({
                    isEmpty: true,
                    isLoading: false,
                    accumulator: props.initialValue,
                  });
                }

                const listView = dataState.getListCache({
                  model: props.model,
                  parameter: props.parameter,
                });

                if (listView.hasError) {
                  throw listView.error;
                }

                let isLoading = listView.isLoading;
                let accumulator = props.initialValue;

                for (let i = 0; i < listView.items.length; i++) {
                  const itemView = dataState.getItemCache(listView.items[i]);
                  if (itemView.hasError) {
                    throw itemView.error;
                  }
                  if (itemView.isLoading) {
                    isLoading = true;
                  }

                  if (itemView.item !== null) {
                    accumulator = props.callback({
                      accumulator,
                      currentValue: itemView.item,
                      index: i,
                    });
                  }
                }

                return ((props.children as any)[0] as listRenderProps<A>)({
                  isLoading,
                  isEmpty: false,
                  accumulator,
                });
              }}
            </Props>
          )}
        </dataContext.Consumer>
      );
    }
  };
