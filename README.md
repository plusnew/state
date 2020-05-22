# state

````jsx
import { component } from "@plusnew/core";
import factory from "@plusnew/state";

const { Repository, Branch, Item, List } = factory<{
  blogPost: {
    listParameter: { sort: "asc", "desc"},
    item: {
      id: string,
      attributes: {
        title: string
      },
      relationships: {
        author: {
          id: string,
          type: 'user',
        }
      }
    }
  },
  user: {
    listParameter: {},
    item: {
      id: string,
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
          read: {
            list: ...
            item: ...
          }
        },
        blogPost: {
          read: {
            list: ...
            item: ...
          }
        }
      }}
    >
      <Branch>
        <List type="blogPost" parameter={{ sort: 'ascending' }}>{({isLoading, items: blogPosts}) =>
          {blogPosts.map(blogPost =>
            <Item type="blogPost" id={blogPost.id}>{(blogPostItemView) =>
              {blogPostItemView.isLoading
                ? 'loading'
                :
                  <>
                    {blogPostItemView.item.attributes.title}
                    <Item type="user" id={blogPostItemView.item.relationships.author.id}>{({isLoading, item: author, changeAttributes}) =>
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

