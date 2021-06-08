import plusnew, { store } from "@plusnew/core";
import enzymeAdapterPlusnew, { mount } from "@plusnew/enzyme-adapter";
import { configure } from "enzyme";
import stateFactory from "../../index";
import { promiseHandler, registerRequestIdleCallback } from "testHelper";

configure({ adapter: new enzymeAdapterPlusnew() });

type blogPostType = {
  id: number;
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

describe("test reduce", () => {
  it("basic reduce test, with unloaded items", async () => {
    const callIdleCallbacks = registerRequestIdleCallback();

    const { Repository, Branch, Reduce } =
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
          id: 1,
          model: "blogPost" as const,
        },
        {
          id: 2,
          model: "blogPost" as const,
        },
      ],
      totalCount: 5,
    }));

    const item = promiseHandler((id: number) => ({
      id: id,
      model: "blogPost" as const,
      attributes: {
        name: `foo-${id}`,
        counter: id,
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
          <Reduce
            model="blogPost"
            parameter={{
              sort: "asc",
            }}
            initialValue={0}
            callback={({ accumulator, currentValue }) =>
              accumulator + currentValue.attributes.counter
            }
          >
            {({ isLoading, accumulator }) => (
              <>
                {isLoading ? <span>is-loading</span> : <span>not-loading</span>}
                <div>{accumulator}</div>
              </>
            )}
          </Reduce>
        </Branch>
      </Repository>
    );

    expect(wrapper.contains(<span>is-loading</span>)).toBe(true);
    expect(wrapper.contains(<div>{0}</div>)).toBe(true);

    await list.resolve();

    expect(wrapper.contains(<span>is-loading</span>)).toBe(true);
    expect(wrapper.contains(<div>{0}</div>)).toBe(true);

    await item.resolve();
    callIdleCallbacks();

    expect(wrapper.contains(<span>not-loading</span>)).toBe(true);
    expect(wrapper.contains(<div>{3}</div>)).toBe(true);
  });

  it("basic reduce test, with loading items", async () => {
    const callIdleCallbacks = registerRequestIdleCallback();

    const { Repository, Branch, Reduce, Item } =
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
          id: 1,
          model: "blogPost" as const,
        },
        {
          id: 2,
          model: "blogPost" as const,
        },
      ],
      totalCount: 5,
    }));

    const item = promiseHandler((id: number) => ({
      id: id,
      model: "blogPost" as const,
      attributes: {
        name: `foo-${id}`,
        counter: id,
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
          <Item model="blogPost" id={1}>
            {() => null}
          </Item>
          <Item model="blogPost" id={2}>
            {() => null}
          </Item>
          <Reduce
            model="blogPost"
            parameter={{
              sort: "asc",
            }}
            initialValue={0}
            callback={({ accumulator, currentValue }) =>
              accumulator + currentValue.attributes.counter
            }
          >
            {({ isLoading, accumulator }) => (
              <>
                {isLoading ? <span>is-loading</span> : <span>not-loading</span>}
                <div>{accumulator}</div>
              </>
            )}
          </Reduce>
        </Branch>
      </Repository>
    );

    expect(wrapper.contains(<span>is-loading</span>)).toBe(true);
    expect(wrapper.contains(<div>{0}</div>)).toBe(true);

    await list.resolve();

    expect(wrapper.contains(<span>is-loading</span>)).toBe(true);
    expect(wrapper.contains(<div>{0}</div>)).toBe(true);

    await item.resolve();
    callIdleCallbacks();

    expect(wrapper.contains(<span>not-loading</span>)).toBe(true);
    expect(wrapper.contains(<div>{3}</div>)).toBe(true);
  });

  it("basic reduce test, with loaded items", async () => {
    const callIdleCallbacks = registerRequestIdleCallback();

    const { Repository, Branch, Reduce, Item } =
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
          id: 1,
          model: "blogPost" as const,
        },
        {
          id: 2,
          model: "blogPost" as const,
        },
      ],
      totalCount: 5,
    }));

    const item = promiseHandler((id: number) => ({
      id: id,
      model: "blogPost" as const,
      attributes: {
        name: `foo-${id}`,
        counter: id,
      },
      relationships: {
        author: {
          model: "user" as const,
          id: "1",
        },
      },
    }));

    const show = store(false);

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
          <Item model="blogPost" id={1}>
            {() => null}
          </Item>
          <Item model="blogPost" id={2}>
            {() => null}
          </Item>
          <show.Observer>
            {(showState) =>
              showState && (
                <Reduce
                  model="blogPost"
                  parameter={{
                    sort: "asc",
                  }}
                  initialValue={0}
                  callback={({ accumulator, currentValue }) =>
                    accumulator + currentValue.attributes.counter
                  }
                >
                  {({ isLoading, accumulator }) => (
                    <>
                      {isLoading ? (
                        <span>is-loading</span>
                      ) : (
                        <span>not-loading</span>
                      )}
                      <div>{accumulator}</div>
                    </>
                  )}
                </Reduce>
              )
            }
          </show.Observer>
        </Branch>
      </Repository>
    );

    await item.resolve();
    callIdleCallbacks();
    show.dispatch(true);

    expect(wrapper.contains(<span>is-loading</span>)).toBe(true);
    expect(wrapper.contains(<div>{0}</div>)).toBe(true);

    await list.resolve();

    expect(wrapper.contains(<span>not-loading</span>)).toBe(true);
    expect(wrapper.contains(<div>{3}</div>)).toBe(true);
  });

  it("reduce with null-parameter, should not request data", async () => {
    const { Repository, Branch, Reduce } =
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
          id: 1,
          model: "blogPost" as const,
        },
        {
          id: 2,
          model: "blogPost" as const,
        },
      ],
      totalCount: 5,
    }));

    const item = promiseHandler((id: number) => ({
      id: id,
      model: "blogPost" as const,
      attributes: {
        name: `foo-${id}`,
        counter: id,
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
          <Reduce
            model="blogPost"
            parameter={null}
            initialValue={0}
            callback={({ accumulator }) => accumulator + 1}
          >
            {(view) => (
              <>
                <span>{view.isLoading ? "isLoading" : "notLoading"}</span>
                <span>{view.isEmpty ? "isEmpty" : "notEmpty"}</span>
                <span>
                  {view.accumulator === 0
                    ? "zeroAccumulation"
                    : "toMuchAccumulation"}
                </span>
              </>
            )}
          </Reduce>
        </Branch>
      </Repository>
    );

    expect(wrapper.contains(<span>notLoading</span>)).toBe(true);
    expect(wrapper.contains(<span>isEmpty</span>)).toBe(true);
    expect(wrapper.contains(<span>zeroAccumulation</span>)).toBe(true);
    expect(list.fn.mock.calls.length).toBe(0);
  });
});
