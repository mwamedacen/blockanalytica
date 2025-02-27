import 'dotenv/config';
import { constructCachedAsyncFn, constructInMemoryCachedAsyncFn } from './CachedFunction';

/**
 * Example of an expensive operation that we want to cache
 * This simulates fetching data from an external API
 */
async function fetchDataFromAPI(userId: string): Promise<any> {
  console.log(`Actually fetching data for user ${userId} from API...`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock data
  return {
    id: userId,
    name: `User ${userId}`,
    email: `user${userId}@example.com`,
    lastUpdated: new Date().toISOString(),
    data: {
      items: Array.from({ length: 5 }, (_, i) => ({
        id: `item-${i}`,
        value: Math.random() * 100
      }))
    }
  };
}

/**
 * Example of using the Redis-based cached function
 */
async function demoRedisCachedFunction() {
  try {
    console.log('=== Redis-based Caching Demo ===');
    
    // Create a cached version of our API function with 30 second cache time
    const cachedFetchData = constructCachedAsyncFn(
      fetchDataFromAPI,
      30, // Cache for 30 seconds
    );
    
    // First call - should hit the API
    console.log('First call for user "123"...');
    const result1 = await cachedFetchData('123');
    console.log('Result:', result1.name);
    
    // Second call with same args - should use cache
    console.log('\nSecond call for user "123" (should use cache)...');
    const result2 = await cachedFetchData('123');
    console.log('Result:', result2.name);
    
    // Call with different args - should hit the API again
    console.log('\nCall for different user "456" (should hit API)...');
    const result3 = await cachedFetchData('456');
    console.log('Result:', result3.name);
    
    // Call the original function again for comparison
    console.log('\nCalling original function for user "123" (no cache)...');
    const result4 = await fetchDataFromAPI('123');
    console.log('Result:', result4.name);
    
    console.log('\nDemo completed successfully!');
  } catch (error) {
    console.error('Demo failed:', error);
  }
}

/**
 * Example of using the in-memory cached function
 */
async function demoInMemoryCachedFunction() {
  try {
    console.log('\n=== In-Memory Caching Demo ===');
    
    // Create an in-memory cached version of our API function with 30 second cache time
    const cachedFetchData = constructInMemoryCachedAsyncFn(
      fetchDataFromAPI,
      30, // Cache for 30 seconds
    );
    
    // First call - should hit the API
    console.log('First call for user "789"...');
    const result1 = await cachedFetchData('789');
    console.log('Result:', result1.name);
    
    // Second call with same args - should use cache
    console.log('\nSecond call for user "789" (should use cache)...');
    const result2 = await cachedFetchData('789');
    console.log('Result:', result2.name);
    
    // Call with different args - should hit the API again
    console.log('\nCall for different user "abc" (should hit API)...');
    const result3 = await cachedFetchData('abc');
    console.log('Result:', result3.name);
    
    console.log('\nDemo completed successfully!');
  } catch (error) {
    console.error('Demo failed:', error);
  }
}

// Run the demos if this file is executed directly
if (require.main === module) {
  // Run the Redis demo first, then the in-memory demo
  demoRedisCachedFunction()
    .then(() => demoInMemoryCachedFunction())
    .catch(console.error);
} 