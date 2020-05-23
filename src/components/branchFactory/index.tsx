import plusnew, {
  Component,
  ApplicationElement,
  Props,
  Context,
} from "@plusnew/core";
import type { entitiesContainerTemplate } from "../../types";
import type { repositoryState, repositoryActions } from "../repositoryFactory";

export type branchState<T extends entitiesContainerTemplate> = {};
export type branchActions<T extends entitiesContainerTemplate> = {};

type props<> = {
  children: ApplicationElement;
};

export default <T extends entitiesContainerTemplate>(
  _repositoryContext: Context<repositoryState<T>, repositoryActions<T>>,
  _branchContext: Context<branchState<T>, branchActions<T>>
) =>
  class Item extends Component<props> {
    static displayName = __dirname;
    render(Props: Props<props>) {
      return <Props>{(props) => props.children}</Props>;
    }
  };
