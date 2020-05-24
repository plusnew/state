import plusnew, { Try } from "@plusnew/core";
import enzymeAdapterPlusnew, { mount } from "@plusnew/enzyme-adapter";
import { configure } from "enzyme";
import stateFactory from "./index";

configure({ adapter: new enzymeAdapterPlusnew() });

type blogPostType = {
  id: string;
  model: "blogPost";
  attributes: {
    name: string;
  };
  relationships: any;
};

function promiseHandler<T, U>(cb: (data: T) => U) {
  const cbs: any = [];
  const datas: U[] = [];
  const promises: Promise<U>[] = [];
  return {
    fn: jest.fn((data: T) => {
      datas.push(cb(data));
      promises.push(
        new Promise<U>((resolve) => cbs.push(resolve))
      );
      return promises[promises.length - 1];
    }),
    resolve: () =>
      Promise.all(
        promises.map((promise, index) => {
          cbs[index](datas[index]);
          return promise;
        })
      ),
  };
}

async function tick(count: number) {
  for (let i = 0; i < count; i += 1) {
    await new Promise((resolve) => resolve());
  }
}

describe("test statefactory", () => {
  it("basic", async () => {
    const { Repository, Branch, Item, List } = stateFactory<{
      blogPost: {
        listParameter: {
          sort: "asc" | "desc";
        };
        item: blogPostType;
      };
    }>();

    const list = promiseHandler(
      (req: {
        model: "blogPost";
        parameter: {
          sort: "asc" | "desc";
        };
      }) => ({
        items: [
          {
            id: "1",
            model: req.model,
          },
          {
            id: "2",
            model: req.model,
          },
        ],
        totalCount: 5,
      })
    );

    const item = promiseHandler((req: { model: "blogPost"; id: string }) => ({
      id: req.id,
      model: req.model,
      attributes: {
        name: `foo-${req.id}`,
      },
      relationships: {},
    }));

    const wrapper = mount(
      <Repository
        requests={{
          read: {
            list: list.fn,
            item: item.fn,
          },
        }}
      >
        <Branch>
          <List model="blogPost" parameter={{ sort: "asc" }}>
            {(listState) => (
              <>
                {listState.isLoading && <div>list-loading</div>}
                {listState.items.map((item) => (
                  <Item model="blogPost" id={item.id}>
                    {(view) =>
                      view.isLoading ? (
                        <span>item-loading</span>
                      ) : (
                        <span>{view.item.attributes.name}</span>
                      )
                    }
                  </Item>
                ))}
              </>
            )}
          </List>
        </Branch>
      </Repository>
    );

    expect(wrapper.contains(<div>list-loading</div>)).toBe(true);
    expect(wrapper.contains(<span>item-loading</span>)).toBe(false);

    await list.resolve();

    expect(wrapper.contains(<div>list-loading</div>)).toBe(false);
    expect(wrapper.contains(<span>item-loading</span>)).toBe(true);

    await item.resolve();

    expect(wrapper.contains(<div>list-loading</div>)).toBe(false);
    expect(wrapper.contains(<span>item-loading</span>)).toBe(false);
    expect(wrapper.contains(<span>foo-1</span>)).toBe(true);
    expect(wrapper.contains(<span>foo-2</span>)).toBe(true);
  });

  it("list fails", async () => {
    const { Repository, Branch, List } = stateFactory<{
      blogPost: {
        listParameter: {
          sort: "asc" | "desc";
        };
        item: blogPostType;
      };
    }>();

    const wrapper = mount(
      <Repository
        requests={{
          read: {
            list: () => Promise.reject("nope"),
            item: (req: { model: "blogPost"; id: string }) =>
              Promise.resolve({
                id: req.id,
                model: req.model,
                attributes: {
                  name: `foo-${req.id}`,
                },
                relationships: {},
              }),
          },
        }}
      >
        <Branch>
          <Try catch={(error) => <span>{error}</span>}>
            {() => (
              <List model="blogPost" parameter={{ sort: "asc" }}>
                {(listState) => listState.isLoading && <div>list-loading</div>}
              </List>
            )}
          </Try>
        </Branch>
      </Repository>
    );

    expect(wrapper.contains(<div>list-loading</div>)).toBe(true);

    await tick(1);

    expect(wrapper.contains(<span>nope</span>)).toBe(true);
  });
});
