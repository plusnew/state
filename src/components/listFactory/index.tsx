import plusnew, {
  Component,
  ApplicationElement,
  Props,
  Context,
} from "@plusnew/core";
import type { entitiesContainerTemplate, entityEmpty } from "../../types";
import type { branchState, branchActions } from "../branchFactory";

type listRenderProps<T extends entitiesContainerTemplate> = (value: {
  isLoading: boolean;
  items: entityEmpty<keyof T>[];
}) => ApplicationElement;

type props<T extends entitiesContainerTemplate, U extends keyof T> = {
  type: U;
  parameter: T[U]["listParameter"];
  children: listRenderProps<T>;
};

export default <T extends entitiesContainerTemplate>(
  _branchContext: Context<branchState<T>, branchActions<T>>
) =>
  class List<U extends keyof T> extends Component<props<T, U>> {
    static displayName = __dirname;
    render(Props: Props<props<T, U>>) {
      return <Props>{(_props) => null}</Props>;
    }
  };
