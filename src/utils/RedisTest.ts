import 'dotenv/config';
import { 
  getRedisClient, 
  setRedisValue, 
  getRedisValue, 
  deleteRedisKey, 
  hasRedisKey,
  setRedisJson,
  getRedisJson
} from './RedisClient';

/**
 * Simple test function to verify Redis client functionality
 */
async function testRedisClient() {
  try {
    console.log('Testing Redis client...');
    
    // Test basic set/get
    const testKey = 'test:key';
    const testValue = 'Hello Redis!';
    
    console.log(`Setting key "${testKey}" with value "${testValue}"...`);
    await setRedisValue(testKey, testValue);
    
    console.log(`Checking if key "${testKey}" exists...`);
    const exists = await hasRedisKey(testKey);
    console.log(`Key "${testKey}" exists: ${exists}`);
    
    console.log(`Getting value for key "${testKey}"...`);
    const retrievedValue = await getRedisValue(testKey);
    console.log(`Retrieved value: "${retrievedValue}"`);
    
    // Test JSON set/get
    const jsonKey = 'test:json';
    const jsonValue = {
      name: 'BlockAnalytica',
      features: ['Blockchain Analysis', 'Side Wallet Detection', 'Copy Trader Detection'],
      active: true
    };
    
    console.log(`Setting JSON key "${jsonKey}"...`);
    await setRedisJson(jsonKey, jsonValue);
    
    console.log(`Getting JSON value for key "${jsonKey}"...`);
    const retrievedJson = await getRedisJson(jsonKey);
    console.log('Retrieved JSON:', retrievedJson);
    
    // Test expiration
    const expiringKey = 'test:expiring';
    console.log(`Setting key "${expiringKey}" with 5 second expiration...`);
    await setRedisValue(expiringKey, 'This will expire soon', 5);
    
    console.log(`Value immediately after setting: "${await getRedisValue(expiringKey)}"`);
    
    console.log('Waiting 6 seconds for expiration...');
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    console.log(`Value after waiting: "${await getRedisValue(expiringKey)}"`);
    
    // Clean up
    console.log('Cleaning up test keys...');
    await deleteRedisKey(testKey);
    await deleteRedisKey(jsonKey);
    
    console.log('Redis client test completed successfully!');
    
    // Close the Redis connection
    const client = await getRedisClient();
    await client.quit();
    console.log('Redis connection closed');
    
  } catch (error) {
    console.error('Redis test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testRedisClient().catch(console.error);
} 