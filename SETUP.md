# Drawing Guessing Game Setup Guide

## Prerequisites

1. **Node.js** (version 18 or higher)
2. **AI API Key** - Either OpenAI or Google Gemini (for AI recognition functionality)

## Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

### 1. Set up Environment Variables

Copy the example environment file:
```bash
cp .env.example .env.local
```

### 2. Configure AI Provider

The application supports both OpenAI and Google Gemini. Choose one of the following configurations:

#### Option A: OpenAI Configuration

Edit `.env.local` and configure OpenAI:

```env
# OpenAI Configuration
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
OPENAI_API_URL=https://api.openai.com/v1
AI_MODEL=gpt-4-vision-preview
```

**How to get an OpenAI API Key:**
1. Go to [OpenAI's website](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to the API section
4. Create a new API key
5. Copy the key and paste it in your `.env.local` file

#### Option B: Google Gemini Configuration

Edit `.env.local` and configure Gemini:

```env
# Gemini Configuration
AI_PROVIDER=gemini
GEMINI_API_KEY=your-actual-gemini-api-key-here
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta
AI_MODEL=gemini-2.0-flash-exp
```

**How to get a Gemini API Key:**
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign up or log in with your Google account
3. Navigate to the API keys section
4. Create a new API key
5. Copy the key and paste it in your `.env.local` file

**Important:** Keep your API key secure and never commit it to version control.

### 3. Database Setup

The application uses SQLite for data storage. The database will be automatically created when you first run the application.

## Running the Application

1. **Development mode:**
   ```bash
   npm run dev
   ```

2. **Production build:**
   ```bash
   npm run build
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Troubleshooting

### Common Issues

#### 1. "AI API key is not configured" Error
- Make sure you've set the appropriate API key in your `.env.local` file:
  - For OpenAI: `OPENAI_API_KEY`
  - For Gemini: `GEMINI_API_KEY`
- Ensure the API key is valid and has sufficient credits/quota
- Verify the `AI_PROVIDER` is set correctly (`openai` or `gemini`)
- Restart the development server after changing environment variables

#### 2. "Unable to connect to AI service" Error
- Check your internet connection
- Verify that the OpenAI API is accessible from your network
- The application will automatically use a fallback method if the AI service is unavailable

#### 3. Database Errors
- Make sure the `data` directory exists in your project root
- Check file permissions for the database file
- The application will automatically create the database if it doesn't exist

#### 4. Canvas/Drawing Issues
- Ensure you're using a modern browser that supports HTML5 Canvas
- Try refreshing the page if the drawing area doesn't respond
- Check browser console for any JavaScript errors

## Features

- **Drawing Canvas**: Interactive drawing area with brush and eraser tools
- **AI Recognition**: Uses OpenAI GPT-4 Vision or Google Gemini to recognize drawings
- **Fallback Mode**: Continues working even when AI service is unavailable
- **Game History**: Tracks your drawing sessions and results
- **Responsive Design**: Works on desktop and mobile devices

## API Endpoints

- `POST /api/game/start` - Start a new game session
- `POST /api/game/submit` - Submit a drawing for AI analysis
- `GET /api/history` - Get game history
- `GET /api/prompts/random` - Get a random drawing prompt

## Support

If you encounter any issues:

1. Check the browser console for error messages
2. Verify your environment configuration
3. Ensure all dependencies are properly installed
4. Try restarting the development server

For persistent issues, check the application logs in the terminal where you're running the development server.