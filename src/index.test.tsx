import plusnew, { Try } from "@plusnew/core";
import enzymeAdapterPlusnew, { mount } from "@plusnew/enzyme-adapter";
import { configure } from "enzyme";
import stateFactory from "./index";
import { promiseHandler, registerRequestIdleCallback, tick } from "testHelper";

configure({ adapter: new enzymeAdapterPlusnew() });

type blogPostType = {
  id: string;
  model: "blogPost";
  attributes: {
    name: string;
  };
  relationships: {};
};

describe("test statefactory", () => {
  it("basic", async () => {
    const callIdleCallbacks = registerRequestIdleCallback();

    const { Repository, Branch, Item, List } =
      stateFactory<{
        blogPost: {
          listParameter: {
            sort: "asc" | "desc";
          };
          item: blogPostType;
        };
      }>();

    const list = promiseHandler((_parameter: { sort: "asc" | "desc" }) => ({
      items: [
        {
          id: "1",
          model: "blogPost" as const,
        },
        {
          id: "2",
          model: "blogPost" as const,
        },
      ],
      totalCount: 5,
    }));

    const item = promiseHandler((id: string) => ({
      id: id,
      model: "blogPost" as const,
      attributes: {
        name: `foo-${id}`,
      },
      relationships: {},
    }));

    const wrapper = mount(
      <Repository
        requests={{
          blogPost: {
            readList: list.fn,
            readItem: item.fn,
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
    callIdleCallbacks();

    expect(wrapper.contains(<div>list-loading</div>)).toBe(false);
    expect(wrapper.contains(<span>item-loading</span>)).toBe(false);
    expect(wrapper.contains(<span>foo-1</span>)).toBe(true);
    expect(wrapper.contains(<span>foo-2</span>)).toBe(true);
  });

  it("list fails", async () => {
    const { Repository, Branch, List } =
      stateFactory<{
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
          blogPost: {
            readList: () => Promise.reject("nope"),
            readItem: (id: string) =>
              Promise.resolve({
                id: id,
                model: "blogPost" as const,
                attributes: {
                  name: `foo-${id}`,
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

  it("item fails", async () => {
    const { Repository, Branch, List, Item } =
      stateFactory<{
        blogPost: {
          listParameter: {
            sort: "asc" | "desc";
          };
          item: blogPostType;
        };
      }>();

    const list = promiseHandler((_parameter: { sort: "asc" | "desc" }) => ({
      items: [
        {
          id: "1",
          model: "blogPost" as const,
        },
        {
          id: "2",
          model: "blogPost" as const,
        },
      ],
      totalCount: 5,
    }));

    const wrapper = mount(
      <Repository
        requests={{
          blogPost: {
            readList: list.fn,
            readItem: (id: string) => Promise.reject(`nope-${id}`),
          },
        }}
      >
        <Branch>
          <Try catch={(error) => <span>{error}</span>}>
            {() => (
              <List model="blogPost" parameter={{ sort: "asc" }}>
                {(listState) => (
                  <>
                    {listState.isLoading && <div>list-loading</div>}
                    {listState.items.map((item) => (
                      <Try catch={(error) => <span>{error}</span>}>
                        {() => (
                          <Item model="blogPost" id={item.id}>
                            {(view) =>
                              view.isLoading ? (
                                <span>item-loading</span>
                              ) : (
                                <span>{view.item.attributes.name}</span>
                              )
                            }
                          </Item>
                        )}
                      </Try>
                    ))}
                  </>
                )}
              </List>
            )}
          </Try>
        </Branch>
      </Repository>
    );

    expect(wrapper.contains(<div>list-loading</div>)).toBe(true);

    await list.resolve();

    expect(wrapper.contains(<div>list-loading</div>)).toBe(false);

    expect(wrapper.contains(<span>nope-1</span>)).toBe(true);
    expect(wrapper.contains(<span>nope-2</span>)).toBe(true);
  });

  it("list request with loaded entities", async () => {
    const { Repository, Branch, Item, List } =
      stateFactory<{
        blogPost: {
          listParameter: {
            sort: "asc" | "desc";
          };
          item: blogPostType;
        };
      }>();

    const list = promiseHandler((_parameter: { sort: "asc" | "desc" }) => ({
      items: [
        {
          id: "1",
          model: "blogPost" as const,
          attributes: {
            name: "bar-1",
          },
          relationships: {},
        },
        {
          id: "2",
          model: "blogPost" as const,
          attributes: {
            name: "bar-2",
          },
          relationships: {},
        },
      ],
      totalCount: 5,
    }));

    const item = promiseHandler((id: string) => ({
      id: id,
      model: "blogPost" as const,
      attributes: {
        name: `foo-${id}`,
      },
      relationships: {},
    }));

    const wrapper = mount(
      <Repository
        requests={{
          blogPost: {
            readList: list.fn,
            readItem: item.fn,
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
    expect(wrapper.contains(<span>item-loading</span>)).toBe(false);
    expect(wrapper.contains(<span>bar-1</span>)).toBe(true);
    expect(wrapper.contains(<span>bar-2</span>)).toBe(true);
    expect(item.fn).not.toHaveBeenCalled();
  });

  it("Merge Deletions should remove entities of lists immidiatley, and invalidate their cache", async () => {
    const callIdleCallbacks = registerRequestIdleCallback();

    const { Repository, Branch, Item, List, Merge } =
      stateFactory<{
        blogPost: {
          listParameter: {
            sort: "asc" | "desc";
          };
          item: blogPostType;
        };
      }>();

    let listItems = [
      {
        id: "1",
        model: "blogPost" as const,
      },
      {
        id: "2",
        model: "blogPost" as const,
      },
    ];

    const list = promiseHandler((_parameter: { sort: "asc" | "desc" }) => ({
      items: listItems,
      totalCount: listItems.length,
    }));

    const item = promiseHandler((id: string) => ({
      id: id,
      model: "blogPost" as const,
      attributes: {
        name: `foo-${id}`,
      },
      relationships: {},
    }));

    const wrapper = mount(
      <Repository
        requests={{
          blogPost: {
            readList: list.fn,
            readItem: item.fn,
          },
        }}
      >
        <Branch>
          <List model="blogPost" parameter={{ sort: "asc" }}>
            {(listState) => (
              <>
                {listState.isLoading && <div>list-loading</div>}
                <div>amount:{listState.items.length}</div>
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
                <Merge>
                  {({ merge }) => (
                    <button
                      onclick={() =>
                        merge({
                          blogPost: [
                            {
                              id: "1",
                              isDeleted: true,
                            },
                          ],
                        })
                      }
                    />
                  )}
                </Merge>
              </>
            )}
          </List>
        </Branch>
      </Repository>
    );

    expect(wrapper.contains(<div>list-loading</div>)).toBe(true);
    expect(wrapper.contains(<div>amount:0</div>)).toBe(true);
    expect(wrapper.contains(<span>item-loading</span>)).toBe(false);

    await list.resolve();

    expect(wrapper.contains(<div>list-loading</div>)).toBe(false);
    expect(wrapper.contains(<div>amount:2</div>)).toBe(true);
    expect(wrapper.contains(<span>item-loading</span>)).toBe(true);

    await item.resolve();
    callIdleCallbacks();

    expect(wrapper.contains(<div>list-loading</div>)).toBe(false);
    expect(wrapper.contains(<div>amount:2</div>)).toBe(true);
    expect(wrapper.contains(<span>item-loading</span>)).toBe(false);
    expect(wrapper.contains(<span>foo-1</span>)).toBe(true);
    expect(wrapper.contains(<span>foo-2</span>)).toBe(true);

    // Changing response of api
    listItems = [
      {
        id: "3",
        model: "blogPost" as const,
      },
    ];

    wrapper.find("button").simulate("click");

    // after deletion, cache invalidation is expected
    expect(wrapper.contains(<div>list-loading</div>)).toBe(true);
    expect(wrapper.contains(<div>amount:1</div>)).toBe(true);
    expect(wrapper.contains(<span>item-loading</span>)).toBe(false);
    expect(wrapper.contains(<span>foo-1</span>)).toBe(false);
    expect(wrapper.contains(<span>foo-2</span>)).toBe(true);

    await list.resolve();

    expect(wrapper.contains(<div>list-loading</div>)).toBe(false);
    expect(wrapper.contains(<div>amount:1</div>)).toBe(true);
    expect(wrapper.contains(<span>item-loading</span>)).toBe(true);
    expect(wrapper.contains(<span>foo-1</span>)).toBe(false);
    expect(wrapper.contains(<span>foo-2</span>)).toBe(false);
    expect(wrapper.contains(<span>foo-3</span>)).toBe(false);

    await item.resolve();
    callIdleCallbacks();

    expect(wrapper.contains(<div>list-loading</div>)).toBe(false);
    expect(wrapper.contains(<div>amount:1</div>)).toBe(true);
    expect(wrapper.contains(<span>item-loading</span>)).toBe(false);
    expect(wrapper.contains(<span>foo-1</span>)).toBe(false);
    expect(wrapper.contains(<span>foo-2</span>)).toBe(false);
    expect(wrapper.contains(<span>foo-3</span>)).toBe(true);
  });
});
