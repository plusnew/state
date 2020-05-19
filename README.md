# state

````jsx
  <Repository>
    <Branch>{({entities, commit}) =>
      <entities.blogPosts.List parameter={{ sort: 'ascending' }}>{({isLoading, blogPostIds}) =>
        {blogPostIds.map(blogPostId =>
          <entities.blogPosts.Item key={blogPostId}>{({isLoading, item: blogPost}) =>
            {isLoading
              ? 'loading'
              :
                <>
                  {blogPost.attributes.title}
                  <entities.user.Item key={blogPost.relationships.author}>{({isLoading, item: author, changeAttributes}) =>
                    <input
                      value={author?.attributes.name}
                      onchange={(evt) => changeAttributes({'name': evt.currentTarget.value})}
                    />
                  }</entities.user.Item>
                </>
            }
          }<entities.blogPosts.Item>
        )}
      }</entities.blogPosts.List>
    }</Branch
  </Repository>
````

