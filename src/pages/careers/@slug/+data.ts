export async function data(pageContext: any) {
  return {
    slug: pageContext.routeParams?.slug
  }
}