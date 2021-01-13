# state

````jsx
import { component } from "@plusnew/core";
import factory from "@plusnew/state";

const { Repository, Branch, Item, List } = factory<{
  blogPost: {
    listParameter: { sort: "asc", "desc"},
    item: {
      id: string,
      model: "blogPost",
      attributes: {
        title: string
      },
      relationships: {
        author: {
          id: string,
          model: 'user',
        }
      }
    }
  },
  user: {
    listParameter: {},
    item: {
      id: string,
      model: "user",
      attributes: {
        name: string
      },
      relationships: {}
    }
  }
}>();

export default component(
  "Example"
  () =>
    <Repository
      requests={{
        blogPost: {
          readList: ({ sort }) => fetch(`/api/blogPost?sort=${sort}`).then((res) => res.json()),
          readItem: (id) => fetch(`/api/blogPost/${id}`).then((res) => res.json())
        },
        user: {
          readList: () => fetch(`/api/user`).then((res) => res.json()),
          readItem: (id) => fetch(`/api/user/${id}`).then((res) => res.json())
        },
      }}
    >
      <Branch>
        <List model="blogPost" parameter={{ sort: 'asc' }}>{({isLoading, items: blogPosts}) =>
          {blogPosts.map(blogPost =>
            <Item model="blogPost" id={blogPost.id}>{(blogPostItemView) =>
              {blogPostItemView.isLoading
                ? 'loading'
                :
                  <>
                    {blogPostItemView.item.attributes.title}
                    <Item model="user" id={blogPostItemView.item.relationships.author.id}>{({isLoading, item: author, commitAttributes}) =>
                      <input
                        value={author?.attributes.name}
                        onchange={(evt) => commitAttributes({'name': evt.currentTarget.value})}
                      />
                    }</Item>
                    <Merge>{({ merge, changes }) =>
                      <button
                        onclick={() => merge(changes)}
                      />
                    }</Merge>
                  </>
              }
            }<Item>
          )}
        }</List>
      </Branch>
    </Repository>
);
````

