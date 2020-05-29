import plusnew from "@plusnew/core";
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
    };
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
                  <span>{view.item.relationships.author.id}</span>
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
                  <span>{view.item.relationships.author.id}</span>
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
                  <span>{view.item.relationships.author.id}</span>
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
});
