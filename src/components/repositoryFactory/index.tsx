import plusnew, { Component, store } from "@plusnew/core";
import type { entitiesContainerTemplate } from "../../types";
import type { Context, ApplicationElement, Props } from "@plusnew/core";
type props<> = {
  children: ApplicationElement;
};

type entity<T extends entitiesContainerTemplate, U extends keyof T> = {
  isDeleted: false;
  payload: T[U];
};

export type repositoryState<T extends entitiesContainerTemplate> = {
  entities: Partial<
    {
      [type in keyof T]: {
        [id: string]: entity<T, type>;
      };
    }
  >;
};

type insertAction<T extends entitiesContainerTemplate> = {
  type: "INSERT_ITEMS";
  payload: [entity<T, keyof T>];
};

export type repositoryActions<
  T extends entitiesContainerTemplate
> = insertAction<T>;

export default <T extends entitiesContainerTemplate>(
  context: Context<repositoryState<T>, repositoryActions<T>>
) =>
  class Repository extends Component<props> {
    static displayName = __dirname;
    render(Props: Props<props>) {
      const repository = store<repositoryState<T>, repositoryActions<T>>(
        { entities: {} },
        (previouState) => previouState
      );
      return (
        <repository.Observer>
          {(repositoryState) => (
            <context.Provider
              state={repositoryState}
              dispatch={repository.dispatch}
            >
              <Props>{(props) => props.children}</Props>
            </context.Provider>
          )}
        </repository.Observer>
      );
    }
  };
