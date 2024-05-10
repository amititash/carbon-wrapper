const {
    PORT,
    DATABASE,
    carbonApiKey,
    carbonApiUrl,
    browse_AI_key,
    browse_AI_Url,
    OPENAI_API_KEY,
    Neo4j_URI,
    Neo4j_USER,
    Neo4j_PASSWORD,
    Neo4j_DATABASE,

} = process.env;

const constants = {
    PORT,
    DATABASE,
    carbonApiKey,
    carbonApiUrl,
    browse_AI_key,
    browse_AI_Url,
    OPENAI_API_KEY,
    Neo4j_URI,
    Neo4j_USER,
    Neo4j_PASSWORD,
    Neo4j_DATABASE,
};

module.exports = {
    constants,
};