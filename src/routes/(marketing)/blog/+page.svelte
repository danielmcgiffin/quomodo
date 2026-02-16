<script lang="ts">
  // TODO(LP-008): Legacy starter blog route retained temporarily. Do not add new product scope here.
  import { sortedBlogPosts, blogInfo } from "./posts"
</script>

<svelte:head>
  <title>{blogInfo.name}</title>
  <meta name="description" content={blogInfo.description} />
</svelte:head>

<div class="py-12 lg:py-20 px-6 max-w-2xl mx-auto">
  <div class="text-center mb-12">
    <div
      class="text-4xl lg:text-6xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary to-accent inline-block"
    >
      {blogInfo.name}
    </div>
    <div class="mt-4 text-xl text-slate-400">
      {blogInfo.description}
    </div>
  </div>

  {#each sortedBlogPosts as post}
    <a href={post.link} class="block group">
      <div
        class="card my-6 bg-[#141416] border border-white/5 hover:border-primary/30 transition-all shadow-xl flex-row overflow-hidden"
      >
        <div class="flex-none w-2 md:w-4 bg-primary/20 group-hover:bg-primary/40 transition-colors"></div>
        <div class="py-8 px-8">
          <div class="text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
            {post.title}
          </div>
          <div class="text-sm font-medium text-accent/80 mb-3 uppercase tracking-wider">
            {post.parsedDate?.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div class="text-slate-400 leading-relaxed">
            {post.description}
          </div>
        </div>
      </div>
    </a>
  {/each}
</div>
