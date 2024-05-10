
const { connectToNeo4j } = require('../db')

async function createNeo4jGraph(payload) {
    try {
        // connection to Neo4j
        const session = connectToNeo4j();

        const cypherQuery = `
    MERGE (job:Job {
        id: $id,
        position: $position,
        title: $title,
        link: $link,
        location: $location,
        status: $status,
        description: $description,
        time_ago: $time_ago
    })
    MERGE (company:Company {name: $company})
    MERGE (job)-[:OFFERED_BY]->(company)

    MERGE (employmentType:EmploymentType {type: $employment_type})
    MERGE (job)-[:TYPE_OF_EMPLOYMENT]->(employmentType)

    MERGE (jobFunction:JobFunction {function: $industries})
    MERGE (job)-[:FUNCTIONS_AS]->(jobFunction)

    MERGE (domain:Domain {name: $domain})
    MERGE (job)-[:IN_DOMAIN]->(domain)

    FOREACH (i IN range(0, $skillsCount - 1) |
    MERGE (skill:Skill {name: $hardskills[i]})
    MERGE (job)-[:REQUIRES]->(skill)
  )

  FOREACH (j IN range(0, $toolsCount - 1) |
    MERGE (tool:Tool {name: $tools[j]})
    MERGE (job)-[:USES]->(tool)
  )
`;
        // console.log("this is payload :: ", payload)
        const parameters = {
            id: payload._id.toString(),
            position: payload.position || '',
            title: payload.title || '',
            link: payload.post_link || '',
            location: payload.location || '',
            status: payload.actively_status || '',
            description: payload.description || '',
            time_ago: payload.time_ago || '',
            company: payload.company || '',
            employment_type: payload.employment_type || '',
            industries: payload.industries || '',
            hardskills: payload.hardskills || [],
            skillsCount: (payload.hardskills || []).length,
            tools: payload.tools || [],
            toolsCount: (payload.tools || []).length,
            domain: payload.domain || ''
        };

        // Execute Cypher query
        const result = await session.run(cypherQuery, parameters);
        return result;

    } catch (error) {
        console.error('Error submitting job', error);
        throw new Error('Failed to submit job');
    }
}

module.exports = { createNeo4jGraph };
