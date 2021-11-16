import plusnew, { Component, Props } from "@plusnew/core";
import type { Context, ApplicationElement } from "@plusnew/core";
import type ComponentInstance from "@plusnew/core/src/instances/types/Component/Instance";
import type { entitiesContainerTemplate } from "../../types";
import type { branchActions, branchState } from "../branchFactory";
import type { repositoryActions, repositoryState } from "../repositoryFactory";
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
  repositoryContext: Context<repositoryState<T>, repositoryActions<T>>,
  branchContext: Context<branchState<T>, branchActions<T>>
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
      const { dispatch: branchDispatch } =
        branchContext.findProvider(componentInstance);

      const interact: interact<T, U> = {
        commitAttributes: (attributes) => {
          const id = Props.getState().id;

          if (id === null) {
            throw new Error("Can not commitAttributes with no current item");
          } else {
            branchDispatch({
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

          branchDispatch({
            type: "RELATIONSHIPS_CHANGE",
            model: Props.getState().model,
            id: idSerializer(id as T[U]["item"]["id"]),
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
                    if (props.id === null) {
                      return (
                        (props.children as any)[0] as itemRenderProps<T, U, Id>
                      )(
                        { isLoading: false, isEmpty: true, item: null } as any,
                        interact
                      );
                    } else {
                      const view = branchState.getItem({
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
              )}
            </branchContext.Consumer>
          )}
        </repositoryContext.Consumer>
      );
    }
  };
