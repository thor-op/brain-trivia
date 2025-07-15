import { GoogleGenAI, Type } from "@google/genai";
import { TriviaQuestion, Category } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const triviaSchema = {
  type: Type.OBJECT,
  properties: {
    question: {
      type: Type.STRING,
      description: "An interesting and unique trivia question. It should not contain any markdown or HTML formatting."
    },
    options: {
      type: Type.ARRAY,
      description: "An array of 4 strings, where one is the correct answer and three are plausible incorrect answers. These should not contain any markdown or HTML.",
      items: {
        type: Type.STRING
      }
    },
    answer: {
      type: Type.STRING,
      description: "The correct answer to the question. Must be one of the strings from the 'options' array."
    }
  },
  required: ["question", "options", "answer"]
};

const dailyQuizSchema = {
    type: Type.OBJECT,
    properties: {
        questions: {
            type: Type.ARRAY,
            description: "An array of exactly 20 unique trivia questions.",
            items: triviaSchema
        }
    },
    required: ["questions"]
};

export async function generateTriviaQuestion(category: Category, existingQuestions: string[]): Promise<TriviaQuestion> {
  try {
    const prompt = `Generate a new, unique trivia question about ${category}. 
    Avoid questions from this list: [${existingQuestions.join(", ")}].
    The question should be of medium difficulty.
    Provide 4 multiple-choice options, with one being the correct answer. The question and options must be plain text without any markdown or HTML.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: triviaSchema,
        temperature: 1,
      },
    });

    if (!response.text) {
      throw new Error("API response did not contain text");
    }
    const jsonText = response.text.trim();
    const triviaData = JSON.parse(jsonText) as TriviaQuestion;

    if (!triviaData.question || !Array.isArray(triviaData.options) || triviaData.options.length !== 4 || !triviaData.answer) {
      throw new Error("Invalid trivia data structure from API");
    }
    if (!triviaData.options.includes(triviaData.answer)) {
      throw new Error("Correct answer not found in options");
    }
    
    const shuffledOptions = [...triviaData.options].sort(() => Math.random() - 0.5);

    return {
        ...triviaData,
        options: shuffledOptions,
    };

  } catch (error) {
    console.error("Error generating trivia question:", error);
    throw new Error("Failed to conjure a new trivia question. The spirits of knowledge are busy.");
  }
}

export async function generateDailyQuizSet(category: Category): Promise<TriviaQuestion[]> {
  try {
    const prompt = `Generate a new, unique set of 20 trivia questions about ${category}. 
    The questions should be of medium difficulty and cover a range of topics within the category.
    Each question must have 4 multiple-choice options, with one being the correct answer. 
    The questions and options must be plain text without any markdown or HTML.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: dailyQuizSchema,
        temperature: 0.9,
      },
    });

    if (!response.text) {
      throw new Error("API response did not contain text");
    }
    const jsonText = response.text.trim();
    const quizData = JSON.parse(jsonText) as { questions: TriviaQuestion[] };

    if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length < 20) {
        throw new Error("API did not return a valid set of 20 questions.");
    }

    return quizData.questions.map(q => ({
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5)
    }));

  } catch (error) {
    console.error("Error generating daily quiz set:", error);
    throw new Error("Failed to conjure a new daily quiz. The cosmos is rebooting.");
  }
}