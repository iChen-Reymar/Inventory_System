# AI Integration with Google Gemini

This document provides a comprehensive overview of the Gemini AI integration for the chatbot functionality in the Inventory Management System.

## Overview

The chatbot uses **Google Gemini 1.5 Flash** to provide natural, conversational responses about product availability. The AI is integrated with real-time product data from Supabase and provides role-based responses for different user types.

## Architecture

### Components

1. **`src/services/geminiService.js`** - Core AI service
   - Initializes Gemini AI client
   - Fetches product context from Supabase
   - Generates system prompts
   - Handles conversation with Gemini API

2. **`src/components/ChatbotWidget.jsx`** - UI component
   - Chat interface
   - Message handling
   - Product context loading
   - Fallback logic

### Data Flow

```
User Message
    ↓
ChatbotWidget (UI)
    ↓
geminiService.chatWithGemini()
    ↓
Load Product Context (Supabase)
    ↓
Create System Prompt (with role-based instructions)
    ↓
Gemini API (Google)
    ↓
AI Response
    ↓
Display to User
```

## Features

### 1. Natural Language Processing
- Understands natural language queries
- Handles conversational context
- Maintains conversation history (last 10 messages)
- Provides human-like responses

### 2. Product Context Integration
- Automatically loads all products from inventory
- Includes product details: name, brand, price, quantity, category, description
- Real-time data synchronization

### 3. Role-Based Responses

#### Regular Users
- Can ask about product availability
- Gets "in stock" or "out of stock" status
- No specific stock quantities shown
- Product information (price, brand, category, description)

#### Admin Users
- Can ask about product availability
- Can ask stock-level questions
- Gets exact stock quantities
- Detailed inventory information

### 4. Conversation History
- Maintains context across messages
- Uses last 10 messages for context
- Enables follow-up questions
- Natural conversation flow

### 5. Fallback System
- If Gemini API is unavailable, falls back to simple keyword matching
- If API key is missing, uses basic product search
- Graceful degradation

## Setup

### Prerequisites

1. **Install Dependencies**
   ```bash
   npm install @google/generative-ai
   ```

2. **Get Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with Google account
   - Click "Create API Key"
   - Copy the API key

3. **Configure Environment Variable**
   Create or update `.env` file in project root:
   ```env
   VITE_GEMINI_API_KEY=your-api-key-here
   ```

4. **Restart Development Server**
   ```bash
   npm run dev
   ```

## API Configuration

### Model Used
- **Model**: `gemini-1.5-flash`
- **Temperature**: 0.8 (balanced creativity)
- **Top-K**: 40
- **Top-P**: 0.95
- **Max Output Tokens**: 1024

### System Prompt Structure

The system prompt includes:
1. **Role Instructions** - Different for admin vs regular users
2. **Product List** - All available products with details
3. **Personality Guidelines** - Conversational, friendly tone
4. **Capabilities** - What the AI can help with
5. **Rules** - What the AI should never do
6. **Current Date** - For time-aware responses

## Usage Examples

### Regular User Queries

```
User: "Do you have brake pads?"
AI: "Yes! We have brake pads available. They're priced at ₱3,500.00 and currently in stock."

User: "What products do you have?"
AI: "We have a great selection of products! We have engine oil, brake pads, air filters, spark plugs, and batteries. What are you looking for?"

User: "Tell me about engine oil"
AI: "Sure! We have engine oil available. It's a full synthetic 5W-30 engine oil priced at ₱2,500.00 and it's currently in stock."
```

### Admin User Queries

```
Admin: "How many units of brake pads do we have?"
AI: "We currently have 30 units of brake pads in stock. The minimum quantity is set to 5 units."

Admin: "What's the stock level of engine oil?"
AI: "Engine oil has 50 units in stock. The minimum quantity is 10 units, so you're well above the threshold."
```

## Security & Privacy

### Data Protection
- **No Financial Data**: AI never discusses wallet balances, payment methods, or transactions
- **No User Data**: AI never shares information about other users or their purchases
- **Product Only**: AI only discusses product availability and information

### API Key Security
- API key stored in environment variables
- Never exposed in client-side code
- Only used for server-side API calls

## Error Handling

### API Errors
- Catches and logs Gemini API errors
- Falls back to keyword-based search
- Shows user-friendly error messages

### Network Issues
- Handles timeout errors
- Retries on failure (if needed)
- Graceful degradation

## Performance

### Optimization
- Products loaded once when chatbot opens
- Conversation history limited to last 10 messages
- Efficient prompt generation
- Cached product data

### Response Time
- Average response: 1-3 seconds
- Depends on Gemini API latency
- Faster with cached product data

## Customization

### Adjusting Personality
Edit `createSystemPrompt()` in `geminiService.js`:
```javascript
// Modify personality guidelines
- Talk naturally, like you're chatting with a friend
- Use casual, friendly language
```

### Changing Model
Edit `chatWithGemini()` in `geminiService.js`:
```javascript
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-pro' // Change model here
});
```

### Adjusting Temperature
Edit generation config:
```javascript
generationConfig: {
  temperature: 0.8, // Lower = more focused, Higher = more creative
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024,
}
```

## Troubleshooting

### Issue: "Gemini AI is not configured"
**Solution**: 
- Check `.env` file exists
- Verify `VITE_GEMINI_API_KEY` is set
- Restart development server
- Check API key is valid

### Issue: Slow responses
**Solution**:
- Check network connection
- Verify Gemini API status
- Reduce `maxOutputTokens` if needed
- Check product data size

### Issue: AI not understanding queries
**Solution**:
- Check system prompt includes product data
- Verify products are loaded correctly
- Check conversation history is being passed
- Review error logs in console

### Issue: Wrong role-based responses
**Solution**:
- Verify `isAdmin` flag is correctly passed
- Check user profile role in database
- Verify role detection in ChatbotWidget

## Best Practices

1. **Keep Product Data Updated**
   - Ensure inventory data is current
   - Update product descriptions regularly

2. **Monitor API Usage**
   - Track API calls
   - Monitor costs (Gemini has free tier)
   - Set usage limits if needed

3. **Test Regularly**
   - Test with different user roles
   - Verify fallback works
   - Check error handling

4. **Update Prompts**
   - Refine system prompts based on user feedback
   - Adjust personality guidelines
   - Update capabilities as needed

## API Limits

### Free Tier (Gemini 1.5 Flash)
- 15 requests per minute (RPM)
- 1,000 requests per day (RPD)
- 1 million tokens per minute (TPM)

### Paid Tier
- Higher limits available
- Check [Google AI Pricing](https://ai.google.dev/pricing)

## Future Enhancements

Potential improvements:
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Product image recognition
- [ ] Advanced analytics
- [ ] Custom training data
- [ ] Integration with other AI models

## Support

For issues or questions:
1. Check this documentation
2. Review error logs in browser console
3. Check Gemini API status
4. Verify environment variables

## References

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Gemini 1.5 Flash Model](https://ai.google.dev/models/gemini)
- [Google AI Studio](https://makersuite.google.com/)

