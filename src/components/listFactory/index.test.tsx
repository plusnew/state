import plusnew from "@plusnew/core";
import enzymeAdapterPlusnew, { mount } from "@plusnew/enzyme-adapter";
import { configure } from "enzyme";
import stateFactory from "../../index";
import { promiseHandler, registerRequestIdleCallback } from "testHelper";

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
    };
  };
};

describe("test list", () => {
  it("list with null-parameter, should not request data", async () => {
    const { Repository, Branch, List } = stateFactory<{
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
          <List model="blogPost" parameter={null}>
            {(view) => (
              <>
                <span>{view.isLoading ? "isLoading" : "notLoading"}</span>
                <span>{view.isEmpty ? "isEmpty" : "notEmpty"}</span>
                <span>
                  {view.items.length === 0 ? "emptyList" : "filledList"}
                </span>
                <span>
                  {view.totalCount === 0
                    ? "totalCountZero"
                    : "totalCountNonZero"}
                </span>
              </>
            )}
          </List>
        </Branch>
      </Repository>
    );

    expect(wrapper.contains(<span>notLoading</span>)).toBe(true);
    expect(wrapper.contains(<span>isEmpty</span>)).toBe(true);
    expect(wrapper.contains(<span>emptyList</span>)).toBe(true);
    expect(wrapper.contains(<span>totalCountZero</span>)).toBe(true);
    expect(list.fn.mock.calls.length).toBe(0);
  });

  it("fetching should only happen once for each id", async () => {
    const callIdleCallbacks = registerRequestIdleCallback();

    const { Repository, Branch, List } = stateFactory<{
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
          <List model="blogPost" parameter={{ sort: "asc" }}>
            {(view) => (
              <h1>
                <span>{view.isLoading ? "isLoading" : "notLoading"}</span>
                <span>{view.isEmpty ? "isEmpty" : "notEmpty"}</span>
                <span>
                  {view.items.length === 0 ? "emptyList" : "filledList"}
                </span>
                <span>
                  {view.totalCount === 0
                    ? "totalCountZero"
                    : "totalCountNonZero"}
                </span>
              </h1>
            )}
          </List>
          <List model="blogPost" parameter={{ sort: "asc" }}>
            {(view) => (
              <h2>
                <span>{view.isLoading ? "isLoading" : "notLoading"}</span>
                <span>{view.isEmpty ? "isEmpty" : "notEmpty"}</span>
                <span>
                  {view.items.length === 0 ? "emptyList" : "filledList"}
                </span>
                <span>
                  {view.totalCount === 0
                    ? "totalCountZero"
                    : "totalCountNonZero"}
                </span>
              </h2>
            )}
          </List>
        </Branch>
      </Repository>
    );

    await list.resolve();
    callIdleCallbacks();

    expect(wrapper.find("h1").contains(<span>totalCountNonZero</span>)).toBe(
      true
    );
    expect(wrapper.find("h2").contains(<span>totalCountNonZero</span>)).toBe(
      true
    );
    expect(list.fn).toHaveBeenCalledTimes(1);
  });
});
