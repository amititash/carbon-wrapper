require('dotenv').config();
const openai = require('openai');
const { constants } = require("../config/constants");


const apiKey = constants.OPENAI_API_KEY;

const openaiClient = new openai.OpenAI({
    apiKey: apiKey
});

async function summarizeJobDescription(jobDescription) {
    try {
        const openai_response_model = {
            graph_params: [
                {
                    hardskills: ['skill one', 'skill two'],
                    tools: ['tool one', 'tool two'],
                    softskills: ['speaking', 'writing'],
                    qualifications: ['qualifications one', 'qualifications two'],
                    salary_range: ['starting salary_range', 'ending salary_range']
                }
            ]
        };


        const systemQuery = `
        You're an expert in natural language processing and you are capable of named entity extraction.
        You will be given a text which will contain hardskills, programming languages, tools, other skills, 
        accounting, management, graphic design skills
        and softskills required for performing various jobs.
        Your task is to extract all the entities related to list below using NER principles.
        
        # hardskills: List of required hardskills, programming languages, tools, other skills, accounting, management, graphic design skills.
        # tools: List of tools mentioned.
        # softskills: List of soft skills mentioned.
        # qualifications: List of qualifications mentioned.
        # salary_range: The salary range specified in the job description. If not found then return Empty list.
        `;

        const openaiResponse = await openaiClient.chat.completions.create({
            model: "gpt-3.5-turbo-0125",
            messages: [
                {
                    role: "system",
                    content: systemQuery + "Provide output in valid JSON. The data schema should be strictly followed otherwise i will penalise you" + JSON.stringify(openai_response_model)
                },
                {
                    role: "user",
                    content: "job description" + jobDescription
                }
            ],
            response_format: { type: "json_object" },
            max_tokens: 3000,
        });

        const openaiResponseJson = openaiResponse.choices[0].message.content;
        // console.log("OpenAI Response:", openaiResponseJson);
        return openaiResponseJson
    } catch (error) {
        console.error("Error while summarizing job description:", error);
        throw error;
    }
}

module.exports = summarizeJobDescription;
