import plusnew, { store } from "@plusnew/core";
import enzymeAdapterPlusnew, { mount } from "@plusnew/enzyme-adapter";
import { configure } from "enzyme";
import stateFactory from "../../index";
import { promiseHandler } from "testHelper";

configure({ adapter: new enzymeAdapterPlusnew() });

type blogPostType = {
  id: string;
  model: "blogPost";
  attributes: {
    name: string;
    counter: number;
  };
  relationships: {
    author: {
      model: "user";
      id: string;
    } | null;
  };
};

describe("test item", () => {
  it("commitAttributeChange, should not affect other branches", async () => {
    const { Repository, Branch, Item } = stateFactory<{
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
        counter: 0,
      },
      relationships: {
        author: {
          model: "user" as const,
          id: "1",
        },
      },
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
          <Item model="blogPost" id={"1"}>
            {(view, { commitAttributes }) =>
              view.isLoading ? (
                <span>item-loading</span>
              ) : (
                <h1>
                  <span>{view.item.attributes.counter}</span>
                  <button
                    onclick={() =>
                      commitAttributes({
                        counter: view.item.attributes.counter + 1,
                      })
                    }
                  />
                </h1>
              )
            }
          </Item>
          <Item model="blogPost" id={"2"}>
            {(view, { commitAttributes }) =>
              view.isLoading ? (
                <span>item-loading</span>
              ) : (
                <h2>
                  <span>{view.item.attributes.counter}</span>
                  <button
                    onclick={() =>
                      commitAttributes({
                        counter: view.item.attributes.counter + 1,
                      })
                    }
                  />
                </h2>
              )
            }
          </Item>
        </Branch>

        <Branch>
          <Item model="blogPost" id={"1"}>
            {(view, { commitAttributes }) =>
              view.isLoading ? (
                <span>item-loading</span>
              ) : (
                <h3>
                  <span>{view.item.attributes.counter}</span>
                  <button
                    onclick={() =>
                      commitAttributes({
                        counter: view.item.attributes.counter + 1,
                      })
                    }
                  />
                </h3>
              )
            }
          </Item>
        </Branch>
      </Repository>
    );

    expect(wrapper.contains(<span>item-loading</span>)).toBe(true);

    await item.resolve();

    expect(wrapper.contains(<span>item-loading</span>)).toBe(false);
    expect(wrapper.find("h1").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find("h2").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find("h3").contains(<span>{0}</span>)).toBe(true);

    wrapper.find("h1").find("button").simulate("click");

    expect(wrapper.find("h1").contains(<span>{1}</span>)).toBe(true);
    expect(wrapper.find("h2").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find("h3").contains(<span>{0}</span>)).toBe(true);
  });

  it("commitRelationships, should not affect other branches", async () => {
    const { Repository, Branch, Item } = stateFactory<{
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
        counter: 0,
      },
      relationships: {
        author: {
          model: "user" as const,
          id: "1",
        },
      },
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
          <Item model="blogPost" id={"1"}>
            {(view, { commitRelationships }) =>
              view.isLoading ? (
                <span>item-loading</span>
              ) : (
                <h1>
                  <span>{view.item.relationships.author?.id}</span>
                  <button
                    onclick={() =>
                      commitRelationships({
                        author: {
                          model: "user" as const,
                          id: "2",
                        },
                      })
                    }
                  />
                </h1>
              )
            }
          </Item>
          <Item model="blogPost" id={"2"}>
            {(view, { commitRelationships }) =>
              view.isLoading ? (
                <span>item-loading</span>
              ) : (
                <h2>
                  <span>{view.item.relationships.author?.id}</span>
                  <button
                    onclick={() =>
                      commitRelationships({
                        author: {
                          model: "user" as const,
                          id: "2",
                        },
                      })
                    }
                  />
                </h2>
              )
            }
          </Item>
        </Branch>

        <Branch>
          <Item model="blogPost" id={"1"}>
            {(view, { commitRelationships }) =>
              view.isLoading ? (
                <span>item-loading</span>
              ) : (
                <h3>
                  <span>{view.item.relationships.author?.id}</span>
                  <button
                    onclick={() =>
                      commitRelationships({
                        author: {
                          model: "user" as const,
                          id: "2",
                        },
                      })
                    }
                  />
                </h3>
              )
            }
          </Item>
        </Branch>
      </Repository>
    );

    expect(wrapper.contains(<span>item-loading</span>)).toBe(true);

    await item.resolve();

    expect(wrapper.contains(<span>item-loading</span>)).toBe(false);
    expect(wrapper.find("h1").contains(<span>1</span>)).toBe(true);
    expect(wrapper.find("h2").contains(<span>1</span>)).toBe(true);
    expect(wrapper.find("h3").contains(<span>1</span>)).toBe(true);

    wrapper.find("h1").find("button").simulate("click");

    expect(wrapper.find("h1").contains(<span>2</span>)).toBe(true);
    expect(wrapper.find("h2").contains(<span>1</span>)).toBe(true);
    expect(wrapper.find("h3").contains(<span>1</span>)).toBe(true);
  });

  it("commitRelationships, should be nullable", async () => {
    const { Repository, Branch, Item } = stateFactory<{
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
        counter: 0,
      },
      relationships: {
        author: {
          model: "user" as const,
          id: "1",
        },
      },
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
          <Item model="blogPost" id={"1"}>
            {(view, { commitRelationships }) =>
              view.isLoading ? (
                <span>item-loading</span>
              ) : (
                <h1>
                  <span>
                    {view.item.relationships.author === null
                      ? "no-author"
                      : view.item.relationships.author.id}
                  </span>
                  <button
                    onclick={() =>
                      commitRelationships({
                        author: null,
                      })
                    }
                  />
                </h1>
              )
            }
          </Item>
        </Branch>
      </Repository>
    );

    expect(wrapper.contains(<span>item-loading</span>)).toBe(true);

    await item.resolve();

    expect(wrapper.contains(<span>item-loading</span>)).toBe(false);
    expect(wrapper.find("h1").contains(<span>1</span>)).toBe(true);

    wrapper.find("h1").find("button").simulate("click");

    expect(wrapper.find("h1").contains(<span>no-author</span>)).toBe(true);
  });
  it("commitAttributes should throw error when item is empty", async () => {
    const { Repository, Branch, Item } = stateFactory<{
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
        counter: 0,
      },
      relationships: {
        author: {
          model: "user" as const,
          id: "1",
        },
      },
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
          <Item model="blogPost" id={null}>
            {(view, { commitAttributes }) => (
              <>
                <span>{view.isLoading ? "isLoading" : "notLoading"}</span>
                <span>{view.isEmpty ? "isEmpty" : "notEmpty"}</span>
                <span>{view.item === null ? "itemNull" : "itemNotNUll"}</span>
                <button
                  onclick={() => {
                    commitAttributes({});
                  }}
                />
              </>
            )}
          </Item>
        </Branch>
      </Repository>
    );

    expect(wrapper.contains(<span>notLoading</span>)).toBe(true);
    expect(wrapper.contains(<span>isEmpty</span>)).toBe(true);
    expect(wrapper.contains(<span>itemNull</span>)).toBe(true);
    expect(item.fn).not.toHaveBeenCalled();
    expect(() => {
      wrapper.find("button").prop("onclick")();
    }).toThrowError("Can not commitAttributes with no current item");
  });

  it("commitRelationships should throw error when item is empty", async () => {
    const { Repository, Branch, Item } = stateFactory<{
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
        counter: 0,
      },
      relationships: {
        author: {
          model: "user" as const,
          id: "1",
        },
      },
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
          <Item model="blogPost" id={null as null | string}>
            {(view, { commitRelationships }) => (
              <>
                <span>{view.isLoading ? "isLoading" : "notLoading"}</span>
                <span>{view.isEmpty ? "isEmpty" : "notEmpty"}</span>
                <span>{view.item === null ? "itemNull" : "itemNotNUll"}</span>
                <button
                  onclick={() => {
                    commitRelationships({});
                  }}
                />
              </>
            )}
          </Item>
        </Branch>
      </Repository>
    );

    expect(wrapper.contains(<span>notLoading</span>));
    expect(wrapper.contains(<span>isEmpty</span>));
    expect(wrapper.contains(<span>itemNull</span>));
    expect(item.fn).not.toHaveBeenCalled();
    expect(() => {
      wrapper.find("button").prop("onclick")();
    }).toThrowError("Can not commitRelationships with no current item");
  });

  it("id should be an object too", async () => {
    type blogPostType = {
      id: { foo: string; bar: string };
      model: "blogPost";
      attributes: {
        name: string;
        counter: number;
      };
      relationships: {
        author: {
          model: "user";
          id: string;
        };
      };
    };

    const { Repository, Branch, Item } = stateFactory<{
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
          id: { foo: "foo1", bar: "bar2" },
          model: "blogPost" as const,
        },
      ],
      totalCount: 1,
    }));

    const item = promiseHandler((id: { foo: string; bar: string }) => ({
      id: id,
      model: "blogPost" as const,
      attributes: {
        name: `${id.foo}`,
        counter: 0,
      },
      relationships: {
        author: {
          model: "user" as const,
          id: "1",
        },
      },
    }));

    const toggle = store(true);

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
          <toggle.Observer>
            {(toggleState) => (
              <Item
                model="blogPost"
                id={
                  toggleState
                    ? { foo: "foo1", bar: "bar1", mep: true }
                    : { bar: "bar1", foo: "foo1", mep: true }
                }
              >
                {(view) =>
                  view.isLoading ? (
                    <span>item-loading</span>
                  ) : (
                    <h1>
                      <span>{view.item.attributes.name}</span>
                    </h1>
                  )
                }
              </Item>
            )}
          </toggle.Observer>
        </Branch>
      </Repository>
    );

    expect(wrapper.contains(<span>item-loading</span>)).toBe(true);

    await item.resolve();

    expect(wrapper.find("h1").contains(<span>foo1</span>)).toBe(true);

    toggle.dispatch(false);

    expect(wrapper.find("h1").contains(<span>foo1</span>)).toBe(true);
  });
});
