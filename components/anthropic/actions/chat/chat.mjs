import anthropic from "../../app/anthropic.app.mjs";
import constants from "../common/constants.mjs";

export default {
  name: "Chat",
  version: "0.0.4",
  key: "anthropic-chat",
  description: "The Chat API. [See the documentation](https://docs.anthropic.com/claude/reference/complete_post)",
  type: "action",
  props: {
    anthropic,
    model: {
      label: "Model",
      description: "Select the model to use for your query. Defaults to the latest stable `claude-2` model, which Anthropic describes as having \"superior performance on tasks that require complex reasoning\".",
      type: "string",
      options: constants.COMPLETION_MODELS,
      default: constants.COMPLETION_MODELS[0],
    },
    userMessage: {
      label: "User Message",
      type: "string",
      description: "The user messages provide instructions to the assistant",
    },
    messages: {
      label: "Prior Message History",
      type: "string[]",
      description: "All relevant information must be supplied via the conversation. You can provide an array of messages from prior conversations here always beginning with the human message.",
      optional: true,
    },
    temperature: {
      label: "Temperature",
      description: "**Optional**. Amount of randomness injected into the response. Ranges from 0 to 1. Use temp closer to 0 for analytical / multiple choice, and temp closer to 1 for creative and generative tasks.",
      type: "string",
      optional: true,
    },
    topK: {
      label: "Top K",
      description: "Only sample from the top K options for each subsequent token. Used to remove `long tail` low probability responses.",
      type: "integer",
      optional: true,
    },
    topP: {
      label: "Top P",
      description: "Does nucleus sampling, in which we compute the cumulative distribution over all the options for each subsequent token in decreasing probability order and cut it off once it reaches a particular probability specified.",
      type: "string",
      optional: true,
    },
    maxTokensToSample: {
      label: "Maximum Tokens To Sample",
      description: "A maximum number of tokens to generate before stopping.",
      type: "integer",
    },
  },
  async run({ $ }) {
    let prompt = "";

    this.messages = typeof this.messages === "string"
      ? JSON.parse(this.messages)
      : this.messages;

    if (this.messages && this.messages.length) {
      let isUserMessage = true;

      for (const message of this.messages) {
        prompt += `\n\n${isUserMessage
          ? "Human"
          : "Assistant"}: ${message}`;

        isUserMessage = !isUserMessage;
      }
    } else {
      this.messages = [];
    }

    prompt = `\n\nHuman: ${this.userMessage}\n\nAssistant:`;
    this.messages.push(this.userMessage);

    const response = await this.anthropic.createChatCompletion({
      $,
      data: {
        prompt,
        model: this.model,
        max_tokens_to_sample: this.maxTokensToSample,
        temperature: this.temperature
          ? parseFloat(this.temperature)
          : undefined,
        top_p: this.topP
          ? parseFloat(this.topP)
          : undefined,
        top_k: this.topK,
      },
    });

    if (response) {
      $.export("$summary", `Successfully sent chat with ID ${response.log_id}`);
    }

    return {
      original_messages: this.messages,
      original_messages_with_assistant_response: this.messages.concat(response.completion),
      ...response,
    };
  },
};
