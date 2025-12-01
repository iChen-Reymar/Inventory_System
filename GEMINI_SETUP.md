# Gemini AI Setup Guide

This chatbot uses Google's Gemini AI to provide natural, conversational responses about products.

## Installation

1. Install the Google Generative AI package:
```bash
npm install @google/generative-ai
```

## Setup

1. Get your Gemini API key:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy your API key

2. Add the API key to your `.env` file:
```env
VITE_GEMINI_API_KEY=your-api-key-here
```

3. Restart your development server:
```bash
npm run dev
```

## Features

With Gemini AI enabled, the chatbot can:
- ✅ Answer natural language questions about products
- ✅ Discuss product details, descriptions, and specifications
- ✅ Help find products by category
- ✅ Provide product recommendations
- ✅ Compare products
- ✅ Explain product features
- ✅ Handle complex queries about inventory

## Fallback Mode

If Gemini AI is not configured, the chatbot will automatically fall back to the original simple product availability checker.

## Example Queries

- "What products do you have?"
- "Tell me about engine oil"
- "What's the price of brake pads?"
- "Show me products in the Lubricants category"
- "Do you have any products under ₱2000?"
- "What's the difference between these two products?"
- "Recommend a product for my car"

