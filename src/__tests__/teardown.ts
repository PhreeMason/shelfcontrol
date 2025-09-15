// Global test teardown
export default async function teardown() {
  // Clean up any global test state if needed
  // Close any open handles
  await new Promise(resolve => setTimeout(resolve, 100));
}