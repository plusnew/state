import plusnew, {
  Component,
  ApplicationElement,
  Props,
  Context,
} from "@plusnew/core";
import type { entitiesContainerTemplate } from "../../types";
import type { branchState, branchActions } from "../branchFactory";

type itemRenderProps<T extends entitiesContainerTemplate, U extends keyof T> = (
  value:
    | { isLoading: false; item: T[U]["item"] }
    | { isLoading: true; item: T[U]["item"] | null }
) => ApplicationElement;

type props<T extends entitiesContainerTemplate, U extends keyof T> = {
  type: U;
  id: string;
  children: itemRenderProps<T, U>;
};

export default <T extends entitiesContainerTemplate>(
  _branchContext: Context<branchState<T>, branchActions<T>>
) =>
  class Item<U extends keyof T> extends Component<props<T, U>> {
    static displayName = __dirname;
    render(Props: Props<props<T, U>>) {
      return <Props>{(_props) => null}</Props>;
    }
  };
