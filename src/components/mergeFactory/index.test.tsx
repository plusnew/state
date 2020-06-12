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
      id: number;
    };
  };
};

describe("test Merge", () => {
  it("commitAttributes should add changes to Merge, and remove them if it is equal with repo", async () => {
    const { Repository, Branch, Item, Merge } = stateFactory<{
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
          id: 1,
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
                    key="increment"
                    onclick={() =>
                      commitAttributes({
                        counter: view.item.attributes.counter + 1,
                      })
                    }
                  />
                  <button
                    key="decrement"
                    onclick={() =>
                      commitAttributes({
                        counter: view.item.attributes.counter - 1,
                      })
                    }
                  />
                </h1>
              )
            }
          </Item>
          <Item model="blogPost" id={"2"}>
            {(view) =>
              view.isLoading ? (
                <span>item-loading</span>
              ) : (
                <h2>
                  <span>{view.item.attributes.counter}</span>
                </h2>
              )
            }
          </Item>

          <Merge>
            {({ changes, merge }) => (
              <button
                key="submit"
                disabled={Object.keys(changes).length === 0}
                onclick={() => merge(changes)}
              />
            )}
          </Merge>
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
    expect(wrapper.find({ key: "submit" }).prop("disabled")).toBe(true);

    wrapper.find("h1").find({ key: "increment" }).simulate("click");

    expect(wrapper.find("h1").contains(<span>{1}</span>)).toBe(true);
    expect(wrapper.find("h2").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find("h3").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find({ key: "submit" }).prop("disabled")).toBe(false);

    wrapper.find("h1").find({ key: "decrement" }).simulate("click");

    expect(wrapper.find("h1").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find("h2").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find("h3").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find({ key: "submit" }).prop("disabled")).toBe(true);

    wrapper.find("h1").find({ key: "increment" }).simulate("click");
    wrapper.find({ key: "submit" }).simulate("click");

    expect(wrapper.find("h1").contains(<span>{1}</span>)).toBe(true);
    expect(wrapper.find("h2").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find("h3").contains(<span>{1}</span>)).toBe(true);
    expect(wrapper.find({ key: "submit" }).prop("disabled")).toBe(true);

    wrapper.find("h1").find({ key: "increment" }).simulate("click");

    expect(wrapper.find("h1").contains(<span>{2}</span>)).toBe(true);
    expect(wrapper.find("h2").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find("h3").contains(<span>{1}</span>)).toBe(true);
    expect(wrapper.find({ key: "submit" }).prop("disabled")).toBe(false);
  });

  it("commitRelationships should add changes to Merge, and remove them if it is equal with repo, for multiple relationship", async () => {
    type blogPostType = {
      id: string;
      model: "blogPost";
      attributes: {
        name: string;
        counter: number;
      };
      relationships: {
        authors: {
          model: "user";
          id: number;
        }[];
      };
    };

    const { Repository, Branch, Item, Merge } = stateFactory<{
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
        authors: [
          {
            model: "user" as const,
            id: 0,
          },
        ],
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
                  <span>{view.item.relationships.authors.length}</span>
                  <button
                    key="increment"
                    onclick={() =>
                      commitRelationships({
                        authors: [
                          ...view.item.relationships.authors,
                          {
                            model: "user",
                            id: view.item.relationships.authors.length,
                          },
                        ],
                      })
                    }
                  />
                  <button
                    key="decrement"
                    onclick={() =>
                      commitRelationships({
                        authors: view.item.relationships.authors.slice(0, -1),
                      })
                    }
                  />
                </h1>
              )
            }
          </Item>
          <Item model="blogPost" id={"2"}>
            {(view) =>
              view.isLoading ? (
                <span>item-loading</span>
              ) : (
                <h2>
                  <span>{view.item.relationships.authors.length}</span>
                </h2>
              )
            }
          </Item>

          <Merge>
            {({ changes, merge }) => (
              <button
                key="submit"
                disabled={Object.keys(changes).length === 0}
                onclick={() => merge(changes)}
              />
            )}
          </Merge>
        </Branch>

        <Branch>
          <Item model="blogPost" id={"1"}>
            {(view, { commitRelationships }) =>
              view.isLoading ? (
                <span>item-loading</span>
              ) : (
                <h3>
                  <span>{view.item.relationships.authors.length}</span>
                  <button
                    onclick={() =>
                      commitRelationships({
                        authors: [
                          ...view.item.relationships.authors,
                          {
                            model: "user",
                            id: view.item.relationships.authors.length,
                          },
                        ],
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
    expect(wrapper.find("h1").contains(<span>{1}</span>)).toBe(true);
    expect(wrapper.find("h2").contains(<span>{1}</span>)).toBe(true);
    expect(wrapper.find("h3").contains(<span>{1}</span>)).toBe(true);
    expect(wrapper.find({ key: "submit" }).prop("disabled")).toBe(true);

    wrapper.find("h1").find({ key: "increment" }).simulate("click");

    expect(wrapper.find("h1").contains(<span>{2}</span>)).toBe(true);
    expect(wrapper.find("h2").contains(<span>{1}</span>)).toBe(true);
    expect(wrapper.find("h3").contains(<span>{1}</span>)).toBe(true);
    expect(wrapper.find({ key: "submit" }).prop("disabled")).toBe(false);

    wrapper.find("h1").find({ key: "decrement" }).simulate("click");

    expect(wrapper.find("h1").contains(<span>{1}</span>)).toBe(true);
    expect(wrapper.find("h2").contains(<span>{1}</span>)).toBe(true);
    expect(wrapper.find("h3").contains(<span>{1}</span>)).toBe(true);
    expect(wrapper.find({ key: "submit" }).prop("disabled")).toBe(true);

    wrapper.find("h1").find({ key: "increment" }).simulate("click");
    wrapper.find({ key: "submit" }).simulate("click");

    expect(wrapper.find("h1").contains(<span>{2}</span>)).toBe(true);
    expect(wrapper.find("h2").contains(<span>{1}</span>)).toBe(true);
    expect(wrapper.find("h3").contains(<span>{2}</span>)).toBe(true);
    expect(wrapper.find({ key: "submit" }).prop("disabled")).toBe(true);

    wrapper.find("h1").find({ key: "increment" }).simulate("click");

    expect(wrapper.find("h1").contains(<span>{3}</span>)).toBe(true);
    expect(wrapper.find("h2").contains(<span>{1}</span>)).toBe(true);
    expect(wrapper.find("h3").contains(<span>{2}</span>)).toBe(true);
    expect(wrapper.find({ key: "submit" }).prop("disabled")).toBe(false);
  });

  it("commitRelationships should add changes to Merge, and remove them if it is equal with repo, for multiple relationship, with different quantity", async () => {
    type blogPostType = {
      id: string;
      model: "blogPost";
      attributes: {
        name: string;
        counter: number;
      };
      relationships: {
        authors: {
          model: "user";
          id: number;
        }[];
      };
    };

    const { Repository, Branch, Item, Merge } = stateFactory<{
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
        authors: [
          {
            model: "user" as const,
            id: 0,
          },
        ],
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
                  <span>{view.item.relationships.authors[0].id}</span>
                  <button
                    key="increment"
                    onclick={() =>
                      commitRelationships({
                        authors: [
                          {
                            model: "user",
                            id: view.item.relationships.authors[0].id + 1,
                          },
                        ],
                      })
                    }
                  />
                  <button
                    key="decrement"
                    onclick={() =>
                      commitRelationships({
                        authors: [
                          {
                            model: "user",
                            id: view.item.relationships.authors[0].id - 1,
                          },
                        ],
                      })
                    }
                  />
                </h1>
              )
            }
          </Item>
          <Item model="blogPost" id={"2"}>
            {(view) =>
              view.isLoading ? (
                <span>item-loading</span>
              ) : (
                <h2>
                  <span>{view.item.relationships.authors[0].id}</span>
                </h2>
              )
            }
          </Item>

          <Merge>
            {({ changes, merge }) => (
              <button
                key="submit"
                disabled={Object.keys(changes).length === 0}
                onclick={() => merge(changes)}
              />
            )}
          </Merge>
        </Branch>

        <Branch>
          <Item model="blogPost" id={"1"}>
            {(view, { commitRelationships }) =>
              view.isLoading ? (
                <span>item-loading</span>
              ) : (
                <h3>
                  <span>{view.item.relationships.authors[0].id}</span>
                  <button
                    onclick={() =>
                      commitRelationships({
                        authors: [
                          {
                            model: "user",
                            id: view.item.relationships.authors[0].id + 1,
                          },
                        ],
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
    expect(wrapper.find("h1").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find("h2").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find("h3").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find({ key: "submit" }).prop("disabled")).toBe(true);

    wrapper.find("h1").find({ key: "increment" }).simulate("click");

    expect(wrapper.find("h1").contains(<span>{1}</span>)).toBe(true);
    expect(wrapper.find("h2").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find("h3").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find({ key: "submit" }).prop("disabled")).toBe(false);

    wrapper.find("h1").find({ key: "decrement" }).simulate("click");

    expect(wrapper.find("h1").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find("h2").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find("h3").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find({ key: "submit" }).prop("disabled")).toBe(true);

    wrapper.find("h1").find({ key: "increment" }).simulate("click");
    wrapper.find({ key: "submit" }).simulate("click");

    expect(wrapper.find("h1").contains(<span>{1}</span>)).toBe(true);
    expect(wrapper.find("h2").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find("h3").contains(<span>{1}</span>)).toBe(true);
    expect(wrapper.find({ key: "submit" }).prop("disabled")).toBe(true);

    wrapper.find("h1").find({ key: "increment" }).simulate("click");

    expect(wrapper.find("h1").contains(<span>{2}</span>)).toBe(true);
    expect(wrapper.find("h2").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find("h3").contains(<span>{1}</span>)).toBe(true);
    expect(wrapper.find({ key: "submit" }).prop("disabled")).toBe(false);
  });

  it("commitRelationships should add changes to Merge, and remove them if it is equal with repo, for single relationships", async () => {
    const { Repository, Branch, Item, Merge } = stateFactory<{
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
          id: 0,
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
                    key="increment"
                    onclick={() =>
                      commitRelationships({
                        author: {
                          model: "user",
                          id: view.item.relationships.author.id + 1,
                        },
                      })
                    }
                  />
                  <button
                    key="decrement"
                    onclick={() =>
                      commitRelationships({
                        author: {
                          model: "user",
                          id: view.item.relationships.author.id - 1,
                        },
                      })
                    }
                  />
                </h1>
              )
            }
          </Item>
          <Item model="blogPost" id={"2"}>
            {(view) =>
              view.isLoading ? (
                <span>item-loading</span>
              ) : (
                <h2>
                  <span>{view.item.relationships.author.id}</span>
                </h2>
              )
            }
          </Item>

          <Merge>
            {({ changes, merge }) => (
              <button
                key="submit"
                disabled={Object.keys(changes).length === 0}
                onclick={() => merge(changes)}
              />
            )}
          </Merge>
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
                          model: "user",
                          id: view.item.relationships.author.id + 1,
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
    expect(wrapper.find("h1").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find("h2").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find("h3").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find({ key: "submit" }).prop("disabled")).toBe(true);

    wrapper.find("h1").find({ key: "increment" }).simulate("click");

    expect(wrapper.find("h1").contains(<span>{1}</span>)).toBe(true);
    expect(wrapper.find("h2").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find("h3").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find({ key: "submit" }).prop("disabled")).toBe(false);

    wrapper.find("h1").find({ key: "decrement" }).simulate("click");

    expect(wrapper.find("h1").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find("h2").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find("h3").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find({ key: "submit" }).prop("disabled")).toBe(true);

    wrapper.find("h1").find({ key: "increment" }).simulate("click");
    wrapper.find({ key: "submit" }).simulate("click");

    expect(wrapper.find("h1").contains(<span>{1}</span>)).toBe(true);
    expect(wrapper.find("h2").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find("h3").contains(<span>{1}</span>)).toBe(true);
    expect(wrapper.find({ key: "submit" }).prop("disabled")).toBe(true);

    wrapper.find("h1").find({ key: "increment" }).simulate("click");

    expect(wrapper.find("h1").contains(<span>{2}</span>)).toBe(true);
    expect(wrapper.find("h2").contains(<span>{0}</span>)).toBe(true);
    expect(wrapper.find("h3").contains(<span>{1}</span>)).toBe(true);
    expect(wrapper.find({ key: "submit" }).prop("disabled")).toBe(false);
  });

  it("merge invalidates list cache", async () => {
    const { Repository, Branch, Item, List, Merge } = stateFactory<{
      blogPost: {
        listParameter: {
          sort: "asc" | "desc";
        };
        item: blogPostType;
      };
    }>();

    const items = [
      {
        id: "0",
        model: "blogPost" as const,
      },
      {
        id: "1",
        model: "blogPost" as const,
      },
    ];

    const list = promiseHandler((_parameter: { sort: "asc" | "desc" }) => ({
      items,
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
          id: 0,
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
            {(listState) => (
              <>
                {listState.isLoading && <div>list-loading</div>}
                {listState.items.map((item) => (
                  <Item model="blogPost" id={item.id}>
                    {(view) =>
                      view.isLoading ? (
                        <span>item-loading</span>
                      ) : (
                        <span class="name">{view.item.attributes.name}</span>
                      )
                    }
                  </Item>
                ))}
                <Merge>
                  {({ merge }) => (
                    <button
                      onclick={() => {
                        const id = `${items.length}`;
                        items.push({
                          id: id,
                          model: "blogPost",
                        });
                        merge({
                          blogPost: {
                            [id]: {
                              id: id,
                              model: "blogPost",
                              attributes: {
                                name: `bar-${id}`,
                                counter: 0,
                              },
                              relationships: {
                                author: {
                                  model: "user",
                                  id: 0,
                                },
                              },
                            },
                          },
                        });
                      }}
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
    expect(wrapper.contains(<span>item-loading</span>)).toBe(false);

    await list.resolve();

    expect(wrapper.contains(<div>list-loading</div>)).toBe(false);
    expect(wrapper.contains(<span>item-loading</span>)).toBe(true);

    await item.resolve();

    expect(wrapper.contains(<div>list-loading</div>)).toBe(false);
    expect(wrapper.contains(<span>item-loading</span>)).toBe(false);
    expect(wrapper.containsMatchingElement(<span>foo-0</span>)).toBe(true);
    expect(wrapper.containsMatchingElement(<span>foo-1</span>)).toBe(true);
    expect(wrapper.find(".name").length).toBe(2);

    wrapper.find("button").simulate("click");

    expect(wrapper.contains(<div>list-loading</div>)).toBe(true);
    expect(wrapper.containsMatchingElement(<span>item-loading</span>)).toBe(
      false
    );
    expect(wrapper.containsMatchingElement(<span>foo-0</span>)).toBe(true);
    expect(wrapper.containsMatchingElement(<span>foo-1</span>)).toBe(true);
    expect(wrapper.find(".name").length).toBe(2);

    await list.resolve();

    expect(wrapper.contains(<div>list-loading</div>)).toBe(false);
    expect(wrapper.containsMatchingElement(<span>item-loading</span>)).toBe(
      false
    );
    expect(wrapper.containsMatchingElement(<span>foo-0</span>)).toBe(true);
    expect(wrapper.containsMatchingElement(<span>foo-1</span>)).toBe(true);
    expect(wrapper.containsMatchingElement(<span>bar-2</span>)).toBe(true);
    expect(wrapper.find(".name").length).toBe(3);
  });
});
