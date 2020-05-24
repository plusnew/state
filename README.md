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
        read: {
          list: (req) => fetch(`/api/${req.model}`).then((res) => res.json()),
          item: (req) => fetch(`/api/${req.model}/${req.id}`).then((res) => res.json())
        }
      }}
    >
      <Branch>
        <List model="blogPost" parameter={{ sort: 'ascending' }}>{({isLoading, items: blogPosts}) =>
          {blogPosts.map(blogPost =>
            <Item model="blogPost" id={blogPost.id}>{(blogPostItemView) =>
              {blogPostItemView.isLoading
                ? 'loading'
                :
                  <>
                    {blogPostItemView.item.attributes.title}
                    <Item model="user" id={blogPostItemView.item.relationships.author.id}>{({isLoading, item: author, changeAttributes}) =>
                      <input
                        value={author?.attributes.name}
                        onchange={(evt) => changeAttributes({'name': evt.currentTarget.value})}
                      />
                    }</Item>
                    <BranchActions>{({commit}) =>
                      <button
                        onclick={commit}
                      />
                    }</BranchActions>
                  </>
              }
            }<Item>
          )}
        }</List>
      </Branch>
    </Repository>
);
````

