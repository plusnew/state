import type { Context } from "@plusnew/core";
import plusnew, { ApplicationElement, Component, Props } from "@plusnew/core";
import type ComponentInstance from "@plusnew/core/src/instances/types/Component/Instance";
import type { entitiesContainerTemplate } from "../../types";
import type {
  dataActions,
  dataState,
  repositoryState,
} from "../../types/dataContext";
import idSerializer from "../../util/idSerializer";

type interact<T extends entitiesContainerTemplate, U extends keyof T> = {
  commitAttributes: (attributes: Partial<T[U]["item"]["attributes"]>) => void;
  commitRelationships: (
    relationships: Partial<T[U]["item"]["relationships"]>
  ) => void;
};

type filledRenderProps<
  T extends entitiesContainerTemplate,
  U extends keyof T
> =
  | { isLoading: false; item: T[U]["item"]; isEmpty: false }
  | { isLoading: true; item: T[U]["item"] | null; isEmpty: false };

type itemRenderProps<
  T extends entitiesContainerTemplate,
  U extends keyof T,
  Id extends T[U]["item"]["id"] | null
> = (
  value: Id extends null
    ? { isLoading: false; item: null; isEmpty: true }
    : filledRenderProps<T, U>,

  interact: interact<T, U>
) => ApplicationElement;

type props<
  T extends entitiesContainerTemplate,
  U extends keyof T,
  Id extends T[U]["item"]["id"] | null
> = {
  model: U;
  id: Id;
  children: itemRenderProps<T, U, Id>;
};

export default <T extends entitiesContainerTemplate>(
  dataContext: Context<dataState<T> & repositoryState<T>, dataActions<T>>
) =>
  class Item<
    U extends keyof T,
    Id extends T[U]["item"]["id"] | null
  > extends Component<props<T, U, Id>> {
    static displayName = "StateItem";
    render(
      Props: Props<props<T, U, Id>>,
      componentInstance: ComponentInstance<any, any, any>
    ) {
      const { dispatch: dataDispatch } =
        dataContext.findProvider(componentInstance);

      const interact: interact<T, U> = {
        commitAttributes: (attributes) => {
          const id = Props.getState().id;

          if (id === null) {
            throw new Error("Can not commitAttributes with no current item");
          } else {
            dataDispatch({
              type: "ATTRIBUTES_CHANGE",
              model: Props.getState().model,
              id: idSerializer(id as T[U]["item"]["id"]),
              payload: attributes,
            });
          }
        },
        commitRelationships: (relationships) => {
          const id = Props.getState().id;

          if (id === null) {
            throw new Error("Can not commitRelationships with no current item");
          }

          dataDispatch({
            type: "RELATIONSHIPS_CHANGE",
            model: Props.getState().model,
            id: idSerializer(id as T[U]["item"]["id"]),
            payload: relationships,
          });
        },
      };

      return (
        <dataContext.Consumer>
          {(dataState) => {
            return (
              <Props>
                {(props) => {
                  if (props.id === null) {
                    return (
                      (props.children as any)[0] as itemRenderProps<T, U, Id>
                    )(
                      { isLoading: false, isEmpty: true, item: null } as any,
                      interact
                    );
                  } else {
                    const view = dataState.getItemCache({
                      model: props.model,
                      id: props.id as T[U]["item"]["id"],
                    });

                    if (view.hasError) {
                      throw view.error;
                    }

                    return (
                      (props.children as any)[0] as itemRenderProps<T, U, Id>
                    )({ isEmpty: false, ...view } as any, interact);
                  }
                }}
              </Props>
            );
          }}
        </dataContext.Consumer>
      );
    }
  };
