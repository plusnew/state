import plusnew, {
  Component,
  context,
  Props,
  store,
  ApplicationElement,
  ComponentContainer,
  component,
} from "@plusnew/core";
import { mapObject } from "./util/functional";

type entity = {
  id: string;
  attribitues: {};
  relationships: {
    [key: string]: entityEmpty | entityEmpty[];
  };
};

type entityEmpty = {
  id: string;
};

type entitiesContainer = {
  [key: string]: entity;
};

type settingsTemplate<T extends entitiesContainer> = {
  entities: {
    [namespace in keyof T]: {
      list: {
        read: () => Promise<T[namespace][]>;
      };
      item: {
        create: (value: T[namespace]) => Promise<T[namespace]>;
        read: () => Promise<T[namespace]>;
        update: (value: {
          changedAttributes: Partial<T[namespace]["attribitues"]>;
        }) => Promise<any>;
        delete: (value: T[namespace]) => Promise<any>;
      };
    };
  };
};

type listRenderProps = (value: {
  loading: boolean;
  itemIds: string[];
}) => ApplicationElement;
type itemRenderProps<T> =
  | ((value: { loading: true; item: T | null }) => ApplicationElement)
  | ((value: { loading: false; item: T }) => ApplicationElement);

type result<T extends entitiesContainer> = {
  Root: ComponentContainer<{}, any, any>;
  stash: {
    Provider: ComponentContainer<{}, any, any>;
  };
  entities: {
    [namespace in keyof T]: {
      List: ComponentContainer<{ children: listRenderProps }, any, any>;
      Item: ComponentContainer<
        { children: itemRenderProps<T[namespace]> },
        any,
        any
      >;
    };
  };
};

export default function factory<
  T extends entitiesContainer,
  U extends settingsTemplate<T>
>(settings: U) {
  const state = context<{}, {}>();

  const result: result<T> = {
    Root: class Provider extends Component<{}> {
      static displayName = "StateProvider";
      render(_Props: Props<{}>) {
        return null;
      }
    },
    stash: {
      Provider: component("", () => null),
    },
    entities: mapObject(settings, () => ({
      List: component("foo", (_Props) => null),
      Item: component("foo", (_Props) => null),
    })),
  };

  return result;
}
