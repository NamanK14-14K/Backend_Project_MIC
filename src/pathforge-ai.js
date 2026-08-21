require("dotenv").config();

async function getAIExplanation({
  currentCertification,
  completedCertifications,
  domain
}) {
  const fallback =
    `${currentCertification.title} comes next because its prerequisites are satisfied in your ${domain.name} learning path. Completing it builds on what you have already finished.`;

  if (!process.env.AI_API_KEY) {
    return {
      explanation: fallback,
      source: "fallback"
    };
  }
  const controller =
    new AbortController();

  const timeout =
    setTimeout(() => {
      controller.abort();
    }, Number(process.env.AI_TIMEOUT_MS || 5000));

  try {

    const prompt = `
You are explaining a learning roadmap.

The backend has already determined the next certification.
You MUST NOT recommend a different certification.

Domain:
${domain.name}

Current certification:
${currentCertification.title}

Completed certifications:
${completedCertifications.join(", ") || "None"}

Explain in 1-2 encouraging sentences why the current certification comes next.

Do not invent prerequisites.
Do not mention information not provided.
`;

    const response = await fetch(
      `${process.env.AI_BASE_URL}/chat/completions`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "Authorization":
            `Bearer ${process.env.AI_API_KEY}`
        },
         body: JSON.stringify({
          model:
            process.env.AI_MODEL ||
            "gpt-4o-mini",

          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 120
        }),

        signal: controller.signal
      }
    );

    if (!response.ok) {
      throw new Error(
        `AI service returned ${response.status}`
      );
    }

    const data =
      await response.json();

    const explanation =
      data?.choices?.[0]?.message?.content
        ?.trim();

    if (!explanation) {
      throw new Error(
        "AI returned an empty explanation"
      );
    }
     return {
      explanation,
      source: "ai"
    };

  } catch (error) {

    return {
      explanation: fallback,
      source: "fallback"
    };

  } finally {

    clearTimeout(timeout);
  }
}


module.exports = {
  getAIExplanation
};







