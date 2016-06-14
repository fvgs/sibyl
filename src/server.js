import TeamServer from './TeamServer';

const slackTestToken = process.env.SIBYL_SLACK_TEST_TOKEN;
const teamServer = new TeamServer(slackTestToken);
