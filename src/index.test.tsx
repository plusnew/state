import plusnew from "@plusnew/core";
import enzymeAdapterPlusnew, { mount } from "@plusnew/enzyme-adapter";
import { configure } from "enzyme";
import stateFactory from "./index";

configure({ adapter: new enzymeAdapterPlusnew() });

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
        item: {
          id: string;
          model: "blogPost";
          attributes: {
            name: string;
          };
          relationships: {};
        };
      };
    }>();

    const wrapper = mount(
      <Repository
        requests={{
          read: {
            list: (req) =>
              Promise.resolve({
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
              }),
            item: (req) =>
              Promise.resolve({
                id: req.id,
                model: req.type,
                attributes: {
                  name: `foo-${req.id}`,
                },
                relationships: {},
              }),
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

    await tick(1);

    expect(wrapper.contains(<div>list-loading</div>)).toBe(false);
    expect(wrapper.contains(<span>item-loading</span>)).toBe(true);

    await tick(1);

    expect(wrapper.contains(<div>list-loading</div>)).toBe(false);
    expect(wrapper.contains(<span>item-loading</span>)).toBe(false);
    expect(wrapper.contains(<span>foo-1</span>));
    expect(wrapper.contains(<span>foo-2</span>));
  });
});
