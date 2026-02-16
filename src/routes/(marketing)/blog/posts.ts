export const blogInfo = {
  name: "SystemsCraft Blog",
  description: "Insights on operational excellence and system design.",
}

export type BlogPost = {
  link: string
  date: string // date is a string 'YYYY-MM-DD'
  title: string
  description: string
  parsedDate?: Date // Optional because it's added dynamically
}

// Update this list with the actual blog post list
// Create a page in the "(posts)" directory for each entry
const blogPosts: BlogPost[] = [
  {
    title: "How we built a high-performance marketing experience",
    description: "Insights into optimizing the SystemsCraft stack for speed and clarity.",
    link: "/blog/how_we_built_our_41kb_saas_website",
    date: "2024-03-10",
  },
  {
    title: "Exploring the power of structured systems",
    description: "A deep dive into how structured information drives clarity in system design.",
    link: "/blog/awesome_post",
    date: "2022-9-23",
  },
  {
    title: "The importance of operational excellence",
    description: "Why maintaining high operational standards is key to sustainable product growth.",
    link: "/blog/example_blog_post",
    date: "2023-03-13",
  },
]

// Parse post dates from strings to Date objects
for (const post of blogPosts) {
  if (!post.parsedDate) {
    const dateParts = post.date.split("-")
    post.parsedDate = new Date(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2]),
    ) // Note: months are 0-based
  }
}

export const sortedBlogPosts = blogPosts.sort(
  (a: BlogPost, b: BlogPost) =>
    (b.parsedDate?.getTime() ?? 0) - (a.parsedDate?.getTime() ?? 0),
)
