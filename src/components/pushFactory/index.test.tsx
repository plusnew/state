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

describe("test push", () => {
  it("commitAttributeChange should add changes to push, and remove them if it is equal with repo", async () => {
    const { Repository, Branch, Item, Push } = stateFactory<{
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

          <Push>
            {({ changes, push }) => (
              <button
                key="submit"
                disabled={Object.keys(changes).length === 0}
                onclick={() => push(changes)}
              />
            )}
          </Push>
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
  });
});
