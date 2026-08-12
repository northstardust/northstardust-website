// Blocks public access to non-website paths kept in the repo for source/
// reference/documentation purposes. Runs before static asset serving;
// every other request passes through unchanged via context.next().
const BLOCKED = [
  /^\/assets-source\//,
  /^\/assets\/references\//,
  /^\/Trash Bin\//,
  /^\/README\.md$/,
  /^\/Website\.txt$/,
  /^\/North_Stardust_Website_Development_Prompt\.md$/,
  /^\/North_Stardust_Claude_Final_Clarifications\.md$/,
  /^\/north-stardust-website-v1-spec\.md$/,
];

export async function onRequest(context) {
  const pathname = decodeURIComponent(new URL(context.request.url).pathname);
  if (BLOCKED.some((re) => re.test(pathname))) {
    return new Response('Not found', { status: 404 });
  }
  return context.next();
}
