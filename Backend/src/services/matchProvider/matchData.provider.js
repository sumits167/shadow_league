import { DUMMY_MATCHES } from './dummyMatchData.js';

export class MatchDataProvider {
  /**
   * Fetch all upcoming cricket matches available for league creation
   * @returns {Promise<Array>} List of upcoming matches
   */
  static async getUpcomingMatches() {
    // If future external API integration is enabled and working, we can query it here:
    // const hasExternalApi = !!process.env.CRICKET_DATA_API_KEY;
    // if (hasExternalApi) { ... }

    // Currently returns structured dummy matches
    return DUMMY_MATCHES.map(match => ({
      id: match.id,
      name: match.name,
      series: match.series,
      format: match.format,
      venue: match.venue,
      matchDate: match.matchDate,
      lineupLockTime: match.lineupLockTime,
      status: match.status,
      team1: match.team1,
      team2: match.team2,
      totalEligiblePlayers: match.squad.length
    }));
  }

  /**
   * Get match details and its eligible squad pool for the draft
   * @param {string} matchId
   * @returns {Promise<Object|null>}
   */
  static async getMatchById(matchId) {
    const match = DUMMY_MATCHES.find(m => m.id === matchId);
    if (!match) return null;
    return match;
  }

  /**
   * Get eligible player pool for a specific match
   * @param {string} matchId 
   * @returns {Promise<Array>}
   */
  static async getMatchPlayers(matchId) {
    const match = DUMMY_MATCHES.find(m => m.id === matchId);
    if (!match) return [];
    return match.squad;
  }

  /**
   * Get live match fantasy scores and player performance statistics
   * @param {string} matchId 
   * @returns {Promise<Object>}
   */
  static async getMatchLiveScore(matchId) {
    const match = DUMMY_MATCHES.find(m => m.id === matchId);
    if (!match) return null;

    // Simulate fantasy points from match performance
    const playerScores = match.squad.map(player => ({
      playerId: player.id,
      name: player.name,
      position: player.position,
      realTeam: player.realTeam,
      runs: Math.floor(Math.random() * 65),
      wickets: player.position === "BOWL" || player.position === "AR" ? Math.floor(Math.random() * 4) : 0,
      catches: Math.floor(Math.random() * 2),
      fantasyPoints: Math.floor(Math.random() * 90) + 20
    }));

    return {
      matchId,
      status: match.status,
      playerScores
    };
  }
}
