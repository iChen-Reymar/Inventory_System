import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * Get product context from Supabase for Gemini AI
 */
export async function getProductContext(supabase) {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('id, name, brand, description, price, quantity, min_quantity, category')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching products:', err);
    return [];
  }
}

/**
 * Get low stock products (quantity <= min_quantity or quantity < 10)
 */
export async function getLowStockProducts(supabase) {
  try {
    // Get all products first
    const { data: allProducts, error } = await supabase
      .from('inventory')
      .select('id, name, brand, price, quantity, min_quantity, category')
      .order('quantity', { ascending: true });

    if (error) throw error;

    // Filter for low stock: quantity <= min_quantity OR quantity < 10
    const lowStock = (allProducts || []).filter(p => {
      const isLowByMin = p.min_quantity && p.quantity <= p.min_quantity;
      const isLowByThreshold = p.quantity < 10;
      return isLowByMin || isLowByThreshold;
    });

    return lowStock;
  } catch (err) {
    console.error('Error fetching low stock products:', err);
    return [];
  }
}

/**
 * Get high demand products (most sold items)
 */
export async function getHighDemandProducts(supabase) {
  try {
    // Get sale items with product info and count quantities sold
    const { data: saleItems, error: saleError } = await supabase
      .from('sale_items')
      .select('inventory_id, quantity, inventory(name, brand, price, quantity, category)')
      .order('created_at', { ascending: false })
      .limit(1000); // Get recent sales

    if (saleError) throw saleError;

    // Count total quantity sold per product
    const productSales = {};
    (saleItems || []).forEach(item => {
      if (item.inventory && item.inventory_id) {
        if (!productSales[item.inventory_id]) {
          productSales[item.inventory_id] = {
            product: item.inventory,
            totalSold: 0
          };
        }
        productSales[item.inventory_id].totalSold += item.quantity;
      }
    });

    // Sort by total sold and return top products
    const highDemand = Object.values(productSales)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10) // Top 10
      .map(item => ({
        ...item.product,
        totalSold: item.totalSold
      }));

    return highDemand;
  } catch (err) {
    console.error('Error fetching high demand products:', err);
    return [];
  }
}

/**
 * Generate system prompt with product context
 */
function createSystemPrompt(products, isAdmin = false) {
  const productList = products.length > 0 ? products.map(p => {
    const stockStatus = p.quantity > 0 ? `In Stock (${p.quantity} units)` : 'Out of Stock';
    const minQtyInfo = p.min_quantity ? ` (Min: ${p.min_quantity})` : '';
    return `- ${p.name}${p.brand ? ` (${p.brand})` : ''} - ₱${p.price} - ${stockStatus}${minQtyInfo}${p.category ? ` - Category: ${p.category}` : ''}${p.description ? ` - ${p.description}` : ''}`;
  }).join('\n') : 'No products available at the moment.';

  const roleInstructions = isAdmin 
    ? `You are assisting an ADMIN user. Admins can ask about:
- Product availability (same as regular users)
- Stock levels and quantities (e.g., "How many units of X do we have?", "What's the stock level of Y?")
- Current inventory quantities for any product

You should provide detailed stock information when admins ask about stock levels.`
    : `You are assisting a REGULAR USER. Users can only ask about:
- Product availability (whether products are in stock or not)
- Product information (prices, descriptions, brands, categories)

You should NOT provide detailed stock quantities or inventory management information to regular users. Only mention if products are "in stock" or "out of stock" without specific quantities.`;

  return `You are a friendly, helpful, and natural-sounding customer service assistant for an inventory management system. Your primary role is to help users check product availability. Talk like a real person - be warm, conversational, and human-like in your responses.

${roleInstructions}

Available Products in Inventory:
${productList}

Your personality and communication style:
- Talk naturally, like you're chatting with a friend or colleague
- Use casual, friendly language (but still professional)
- Show enthusiasm when helping customers
- Be empathetic and understanding
- Use natural phrases like "Sure thing!", "Absolutely!", "Let me check that for you", "I'd be happy to help"
- Ask follow-up questions when appropriate
- Acknowledge the customer's needs before providing information
- Use contractions naturally (I'm, you're, we've, etc.)

When discussing products, ALWAYS:
1. **Check availability first** - Always mention if a product is in stock or out of stock
2. **Provide clear stock information** - Say things like "We have X units available" or "Unfortunately, that's currently out of stock"
3. **Include pricing** - Always mention the price in Philippine Peso (₱) format
4. **Be specific** - Include brand, category, and description when relevant
5. **Offer alternatives** - If something is out of stock, suggest similar products if available

Example natural responses:
- "Yes! We do have that in stock. We currently have [quantity] units available at ₱[price]."
- "I'm sorry, but that product is currently out of stock. However, we do have [alternative] available if you're interested."
- "Let me check our inventory for you... Yes! We have [product name] available. It's priced at ₱[price] and we have [quantity] units in stock."
- "Absolutely! I can help you with that. [Product] is available and we have [quantity] units ready to go."

Your capabilities:
1. **Product Availability**: Always check and clearly state product availability${isAdmin ? ' with exact stock quantities' : ' (in stock/out of stock)'}
2. **Product Information**: Provide details about prices, descriptions, brands, and categories
3. **Product Search**: Help users find products naturally through conversation
4. **Product Recommendations**: Suggest products based on customer needs when items are out of stock${isAdmin ? '\n5. **Stock Level Queries**: Answer questions about current stock quantities, inventory levels, and stock status for admins' : ''}

Important rules:
- Your primary purpose is to help users check product availability${isAdmin ? ' and answer stock-level questions' : ''}
- ALWAYS mention product availability (in stock/out of stock) when discussing products
${isAdmin ? '- For admins: Include exact stock quantities when discussing products (e.g., "We have 25 units available")' : '- For regular users: Only mention if products are "in stock" or "out of stock" without specific quantities'}
- Use the product list above for accurate information
- Be conversational and natural - avoid robotic or overly formal language
- If asked about topics unrelated to product availability${isAdmin ? ' or stock levels' : ''}, politely redirect them to product availability questions. For admins, you can also help with stock-level questions.
- NEVER discuss financial transactions, account details, payment methods, wallet balances, or any private user data
- NEVER provide information about other users, their purchases, or personal information
- Keep responses natural in length - don't be too brief or too verbose
- Use emojis occasionally for friendliness (😊, 👍, ✅, ❌) but don't overdo it
- Show genuine interest in helping the customer find products

Current date: ${new Date().toLocaleDateString()}`;
}

/**
 * Chat with Gemini AI about product availability
 */
export async function chatWithGemini(userMessage, products, conversationHistory = [], isAdmin = false) {
  if (!genAI) {
    return {
      error: 'Gemini AI is not configured. Please set VITE_GEMINI_API_KEY in your .env file.',
      fallback: true
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Create system prompt with product context and role-based instructions
    const systemPrompt = createSystemPrompt(products, isAdmin);
    
    // Build conversation history for Gemini
    const history = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Use system instruction for better context handling
    const systemInstruction = {
      role: 'user',
      parts: [{ text: systemPrompt }]
    };
    
    const systemResponse = {
      role: 'model',
      parts: [{ text: 'I understand. I\'m ready to help you with product information and general questions!' }]
    };

    // If we have history, use chat mode with system instruction
    if (history.length > 0) {
      // Start chat with system instruction and history
      const chat = model.startChat({
        history: [systemInstruction, systemResponse, ...history],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      // Send message and get response
      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      const text = response.text();

      return { text, error: null };
    } else {
      // First message - include system prompt
      const fullPrompt = `${systemPrompt}\n\nUser: ${userMessage}`;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return { text, error: null };
    }
  } catch (error) {
    console.error('Gemini AI Error:', error);
    return {
      error: error.message || 'Failed to get AI response',
      fallback: true
    };
  }
}

/**
 * Check if Gemini AI is available
 */
export function isGeminiAvailable() {
  return genAI !== null && API_KEY !== '';
}

