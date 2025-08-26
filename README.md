# Point Extractor

[![Netlify Status](https://api.netlify.com/api/v1/badges/295f8d1c-f02e-4359-bfa7-05ab78013106/deploy-status)](https://app.netlify.com/projects/point-extractor/deploys)

A simple tool to distill verbose text into clear, actionable bullet points for better AI chatbot interactions.

**🔗 Try it now: [point-extractor.netlify.app](https://point-extractor.netlify.app/)**

## 🎯 Why Point Extractor?

Ever noticed how chatbots sometimes struggle when you give them long, rambling explanations? Point Extractor was born from a real problem: a friend was getting poor results from ChatGPT because they were using verbose paragraphs to explain what they wanted. 

This app helps you transform lengthy explanations into precise, specific points that chatbots can better understand and act upon.

## ✨ Features

- **Text Distillation**: Convert verbose paragraphs into clear, concise bullet points
- **Multi-Platform Support**: Optimized output for major AI platforms:
  - **OpenAI** (ChatGPT, GPT-4)
  - **Anthropic** (Claude)
  - **Google** (Gemini, Bard)
  - **xAI** (Grok)
  - **Cohere** (Command, Chat)
- **No Installation Required**: Runs entirely in your browser
- **Platform-Optimized**: Tailors output format for each chatbot's preferences
- **Simple Interface**: Clean, user-friendly design for quick text processing
- **Copy-Ready Output**: One-click copy for easy pasting into your favorite chatbot

## 💻 How to Use

1. **Visit the app**: Go to [point-extractor.netlify.app](https://point-extractor.netlify.app/)
2. **Paste your text**: Drop your verbose text into the input field
3. **Select your chatbot**: Choose your target AI platform (OpenAI, Anthropic, Google, xAI, or Cohere)
4. **Extract**: Click the extract button to distill your text into clear points
5. **Copy & Chat**: Copy the extracted points and paste them into your chatbot

### Example

**Before (Verbose Input):**
```
So I'm trying to build this web application and I need help with the database design. 
The application is for managing a library system where we have books, members, and 
borrowing records. Each book should have information like title, author, ISBN, and 
publication year. Members need to have their personal details stored, and we need to 
track when books are borrowed and returned...
```

**After (Extracted Points):**
```
- Build web application for library management
- Need database design help
- Entities: books, members, borrowing records
- Book fields: title, author, ISBN, publication year
- Store member personal details
- Track borrowing and return dates
```

## 🤔 When to Use Point Extractor

Point Extractor works best when you:
- Have complex requirements to explain to an AI
- Want clearer, more actionable responses from chatbots
- Need to break down a rambling thought into structured points
- Want to ensure the AI focuses on your specific needs
- Are switching between different AI platforms and need consistent formatting

## 🤖 Supported Platforms

| Platform | Models | Status |
|----------|--------|--------|
| **OpenAI** | ChatGPT, GPT-4, GPT-3.5 | ✅ Supported |
| **Anthropic** | Claude 3, Claude 2, Claude Instant | ✅ Supported |
| **Google** | Gemini Pro, Gemini Ultra, Bard | ✅ Supported |
| **xAI** | Grok | ✅ Supported |
| **Cohere** | Command, Chat, Generate | ✅ Supported |

## 🛠️ For Developers

Want to contribute or run locally? Here's how:

### Prerequisites
```bash
node >= 14.0.0
npm >= 6.0.0
```

### Local Development
```bash
# Clone the repository
git clone https://github.com/melroser/point-extractor.git

# Navigate to the project directory
cd point-extractor

# Install dependencies
npm install

# Start the development server
npm start
```

### Contributing

Contributions are welcome! Feel free to:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature)
5. Open a Pull Request

### Adding New Platform Support

Want to add support for another AI platform? Check out the platform adapter pattern in `/src/adapters/` and feel free to submit a PR!

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to my friend whose ChatGPT struggles inspired this tool
- The open-source community for various libraries and resources

## 📧 Contact

Project Link: [https://github.com/melroser/point-extractor](https://github.com/melroser/point-extractor)

---

*Making AI conversations more effective, one bullet point at a time.* 🎯
```
