import plusnew from "@plusnew/core";
import enzymeAdapterPlusnew, { mount } from "@plusnew/enzyme-adapter";
import { configure } from "enzyme";
import stateFactory from "./index";

configure({ adapter: new enzymeAdapterPlusnew() });

describe("test statefactory", () => {
  it("foo", async () => {
    const { Repository, Branch, Item, List } = stateFactory<{
      blogPost: {
        listParameter: {
          sort: "asc" | "desc";
        };
        item: {
          id: string;
          attributes: {
            name: string;
          };
          relationships: {};
        };
      };
    }>();

    const wrapper = mount(
      <Repository>
        <Branch>
          <List type="blogPost" parameter={{ sort: "asc" }}>
            {(listState) =>
              listState.items.map((item) => (
                <Item<"blogPost"> type="blogPost" id={item.id}>
                  {(view) =>
                    view.isLoading ? (
                      <span>loading</span>
                    ) : (
                      view.item.attributes.name
                    )
                  }
                </Item>
              ))
            }
          </List>
        </Branch>
      </Repository>
    );

    wrapper;
  });
});
