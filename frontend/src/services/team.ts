/**
 * Team Service
 * Handles all team-related API calls
 */

import api from '../utils/api';

export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: TeamMember[];
  createdAt: string;
}

export interface TeamMember {
  userId: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

class TeamService {
  /**
   * Get all teams for current user
   */
  async getTeams(): Promise<Team[]> {
    const response = await api.getTeams();
    return response.data.teams;
  }

  /**
   * Get a specific team
   */
  async getTeam(teamId: string): Promise<Team> {
    const response = await api.getTeam(teamId);
    return response.data.team;
  }

  /**
   * Create a new team
   */
  async createTeam(data: { name: string; description?: string }): Promise<Team> {
    const response = await api.createTeam(data);
    return response.data.team;
  }

  /**
   * Add a member to a team
   */
  async addMember(teamId: string, userEmail: string): Promise<TeamMember> {
    const response = await api.addTeamMember(teamId, userEmail);
    return response.data.member;
  }

  /**
   * Remove a member from a team
   */
  async removeMember(teamId: string, userId: string): Promise<void> {
    await api.removeTeamMember(teamId, userId);
  }
}

export const teamService = new TeamService();
export default teamService;

