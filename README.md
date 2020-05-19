# state

````jsx
  <Repository>
    <Branch>{({entities, commit}) =>
      <entities.BlogPosts.List parameter={{ sort: 'ascending' }}>{({isLoading, blogPostIds}) =>
        {blogPostIds.map(blogPostId =>
          <entities.BlogPosts.Item key={blogPostId}>{({isLoading, item: blogPost}) =>
            {isLoading
              ? 'loading'
              :
                <>
                  {blogPost.attributes.title}
                  <entities.BlogPosts.User key={blogPost.relationships.author}>{({isLoading, item: author, changeAttributes}) =>
                    <input
                      value={author?.attributes.name}
                      onchange={(evt) => changeAttributes({'name': evt.currentTarget.value})}
                    />
                  }</entities.BlogPosts.User>
                </>
            }
          }<entities.BlogPosts.Item>
        )}
      }</entities.BlogPosts.List>
    }</Branch
  </Repository>
````

