# Gemini AI Chatbot - Quick Reference

## Quick Setup

1. **Get API Key**
   ```
   https://makersuite.google.com/app/apikey
   ```

2. **Add to .env**
   ```env
   VITE_GEMINI_API_KEY=your-key-here
   ```

3. **Restart Server**
   ```bash
   npm run dev
   ```

## File Structure

```
src/
├── services/
│   └── geminiService.js      # AI service & API calls
├── components/
│   └── ChatbotWidget.jsx     # Chat UI component
└── .env                       # API key configuration
```

## Key Functions

### `geminiService.js`

- `getProductContext(supabase)` - Fetches all products
- `chatWithGemini(message, products, history, isAdmin)` - Main chat function
- `isGeminiAvailable()` - Checks if API key is set
- `createSystemPrompt(products, isAdmin)` - Generates AI instructions

### `ChatbotWidget.jsx`

- `loadProducts()` - Loads product data
- `send()` - Handles user messages
- `clearChat()` - Resets conversation

## Role-Based Behavior

| Feature | Regular User | Admin User |
|---------|-------------|------------|
| Product Availability | ✅ | ✅ |
| Stock Quantities | ❌ | ✅ |
| Stock Level Queries | ❌ | ✅ |
| Product Details | ✅ | ✅ |

## Example Queries

### Regular Users
- "Do you have [product]?"
- "What products are available?"
- "Tell me about [product]"
- "Show all products"

### Admin Users
- "How many units of [product]?"
- "What's the stock level?"
- "Show me low stock items"
- All regular user queries

## Configuration

### Model Settings
```javascript
model: 'gemini-1.5-flash'
temperature: 0.8
maxOutputTokens: 1024
```

### Conversation History
- Last 10 messages kept for context
- Auto-scrolls to latest message
- Cleared on chat reset

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Not configured" | Check `.env` file |
| Slow responses | Check network/Gemini status |
| Wrong responses | Verify product data loaded |
| Role issues | Check `isAdmin` flag |

## Testing

```bash
# Test with API key
npm run dev

# Test fallback (no API key)
# Remove VITE_GEMINI_API_KEY from .env
```

## API Limits

- **Free Tier**: 15 RPM, 1K RPD
- **Model**: gemini-1.5-flash
- **Cost**: Free tier available

## Security Notes

✅ Safe:
- Product information
- Availability queries
- Stock levels (admins only)

❌ Never:
- Wallet balances
- Payment info
- User personal data
- Other users' data

