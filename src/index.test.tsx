import plusnew, { component, store, Try } from "@plusnew/core";
import enzymeAdapterPlusnew, { mount } from "@plusnew/enzyme-adapter";
import { configure } from "enzyme";
import stateFactory from "./index";

configure({ adapter: new enzymeAdapterPlusnew() });

describe("test statefactory", () => {
  it("foo", async () => {
    const state = stateFactory({
      entities: {
        user: {
          list: {
            read: () => Promise.resolve([]),
          },
          item: {
            create: (entity) => Promise.resolve(entity),
            read: () =>
              Promise.resolve({
                id: "23",
                attribitues: {
                  foo: "bar",
                },
                relationships: {
                  parent: {
                    id: "one",
                  },
                  friends: [
                    {
                      id: "another",
                    },
                  ],
                },
              }),
            update: ({ changedAttributes }) => Promise.resolve({}),
            delete: (entity) => Promise.resolve(entity),
          },
        },
      },
    });
  });
});
