import { ChatOpenAI } from "@langchain/openai";

/**
 * Returns a singleton ChatOpenAI instance configured to use the Ora API with DeepSeek-V3 model
 * Uses closure pattern to ensure only one instance is created
 */
// export const getMiniChatAPI = (() => {
//   // Create a variable in the closure to hold our instance
//   let instance: ChatOpenAI | null = null;
  
//   // Return a function that creates the instance only once
//   return () => {
//     // If we already have an instance, return it
//     if (instance) {
//       return instance;
//     }
    
//     // Otherwise, create a new instance
//     const oraAPIKey = process.env.ORA_API_KEY;
//     if (!oraAPIKey) {
//       throw new Error("ORA_API_KEY environment variable is required");
//     }

//     instance = new ChatOpenAI({
//       model: "meta-llama/Llama-3.2-3B-Instruct",
//       temperature: 0,
//       configuration: {
//         baseURL: "https://api.ora.io/v1",
//         apiKey: oraAPIKey
//       },
//     });
    
//     return instance;
//   };
// })(); 

export const getMiniChatAPI = (() => {
  // Create a variable in the closure to hold our instance
  let instance: ChatOpenAI | null = null;
  
  // Return a function that creates the instance only once
  return () => {
    // If we already have an instance, return it
    if (instance) {
      return instance;
    }
    
    // Otherwise, create a new instance
    const apiKey = process.env.OPEN_GRADIENT_WALLET_PRIVATE_KEY;
    if (!apiKey) {
      throw new Error("OPEN_GRADIENT_WALLET_PRIVATE_KEY environment variable is required");
    }

    instance = new ChatOpenAI({
      model: "Qwen/Qwen2.5-72B-Instruct",
      temperature: 0,
      configuration: {
        baseURL: "https://llm.opengradient.ai/v1",
        apiKey
      },
    });
    
    return instance;
  };
})(); 

/**
 * Returns a singleton ChatOpenAI instance configured to use the Ora API with DeepSeek-V3 model
 * Uses closure pattern to ensure only one instance is created
 */
export const getChatAPI = (() => {
  // Create a variable in the closure to hold our instance
  let instance: ChatOpenAI | null = null;
  
  // Return a function that creates the instance only once
  return () => {
    // If we already have an instance, return it
    if (instance) {
      return instance;
    }
    
    // Otherwise, create a new instance
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }

    instance = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0,
      apiKey
    });
    
    return instance;
  };
})(); 

/**
 * Returns a singleton ChatOpenAI instance configured to use the Ora API with DeepSeek-V3 model
 * Uses closure pattern to ensure only one instance is created
 */
export const getReasoningChatAPI = (() => {
  // Create a variable in the closure to hold our instance
  let instance: ChatOpenAI | null = null;
  
  // Return a function that creates the instance only once
  return () => {
    // If we already have an instance, return it
    if (instance) {
      return instance;
    }
    
    // Otherwise, create a new instance
    const apiKey = process.env.ORA_API_KEY;
    if (!apiKey) {
      throw new Error("ORA_API_KEY environment variable is required");
    }

    instance = new ChatOpenAI({
      //model: "deepseek-ai/DeepSeek-R1",
      model: "deepseek-ai/DeepSeek-V3",
      temperature: 0,
      configuration: {
        baseURL: "https://api.ora.io/v1",
        apiKey
      },
    });
    
    return instance;
  };
})(); 