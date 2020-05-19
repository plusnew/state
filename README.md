# state

````jsx
  <Repository>
    <Branch>
      <entities.blogPost.List parameter={{ sort: 'ascending' }}>{({isLoading, itemIds: blogPostIds}) =>
        {blogPostIds.map(blogPostId =>
          <entities.blogPost.Item key={blogPostId}>{(blogPostItemView) =>
            {blogPostItemView.isLoading
              ? 'loading'
              :
                <>
                  {blogPostItemView.item.attributes.title}
                  <entities.user.Item key={blogPostItemView.item.relationships.author}>{({isLoading, item: author, changeAttributes}) =>
                    <input
                      value={author?.attributes.name}
                      onchange={(evt) => changeAttributes({'name': evt.currentTarget.value})}
                    />
                  }</entities.user.Item>
                  <BranchActions>{commit =>
                    <button
                      onclick={commit}
                    />
                  }</BranchAction>
                </>
            }
          }<entities.blogPost.Item>
        )}
      }</entities.blogPost.List>
    </Branch>
  </Repository>
````

