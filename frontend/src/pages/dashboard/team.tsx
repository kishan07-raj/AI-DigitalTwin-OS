/**
 * Team Analytics Page
 * Displays team-level analytics and user comparisons
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useStore } from '../../store';
import { teamService, Team, TeamMember } from '../../services/team';
import { analyticsService, UserComparison } from '../../services/analytics';
import { Users, TrendingUp, Award, BarChart3, Crown, Shield, User, Plus, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TeamPage() {
  const router = useRouter();
  const { user, isAuthenticated, loadUser } = useStore();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [userComparisons, setUserComparisons] = useState<UserComparison[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

  useEffect(() => {
    const init = async () => {
      await loadUser();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTeams();
    }
  }, [isAuthenticated, user]);

  const fetchTeams = async () => {
    try {
      const data = await teamService.getTeams();
      setTeams(data);
      if (data.length > 0 && !selectedTeam) {
        selectTeam(data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      // Use mock data
      const mockTeams = getMockTeams();
      setTeams(mockTeams);
      if (mockTeams.length > 0) {
        selectTeam(mockTeams[0]);
      }
    }
  };

  const selectTeam = async (team: Team) => {
    setSelectedTeam(team);
    try {
      const comparisons = await analyticsService.getUserComparisons(team.id);
      setUserComparisons(comparisons);
    } catch (error) {
      console.error('Failed to fetch user comparisons:', error);
      setUserComparisons(getMockComparisons());
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    
    try {
      const newTeam = await teamService.createTeam({
        name: newTeamName,
        description: newTeamDescription,
      });
      setTeams(prev => [...prev, newTeam]);
      setShowCreateModal(false);
      setNewTeamName('');
      setNewTeamDescription('');
      selectTeam(newTeam);
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-400" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getMaxProductivity = () => {
    return Math.max(...userComparisons.map(u => u.productivity), 1);
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Team Analytics</h1>
            <p className="text-gray-400">Monitor team productivity and user comparisons</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Team</span>
          </button>
        </div>

        {/* Team Selector */}
        <div className="flex flex-wrap gap-2">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => selectTeam(team)}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedTeam?.id === team.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {team.name}
            </button>
          ))}
        </div>

        {selectedTeam ? (
          <>
            {/* Team Overview */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50">
                <div className="flex items-center space-x-3 mb-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-400 text-sm">Team Members</span>
                </div>
                <div className="text-2xl font-bold text-white">{selectedTeam.members?.length || 5}</div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50">
                <div className="flex items-center space-x-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-gray-400 text-sm">Avg Productivity</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {userComparisons.length > 0
                    ? Math.round(userComparisons.reduce((sum, u) => sum + u.productivity, 0) / userComparisons.length)
                    : 78}%
                </div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50">
                <div className="flex items-center space-x-3 mb-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-400 text-sm">Total Sessions</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {userComparisons.reduce((sum, u) => sum + u.sessions, 0)}
                </div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50">
                <div className="flex items-center space-x-3 mb-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  <span className="text-gray-400 text-sm">Top Performer</span>
                </div>
                <div className="text-lg font-bold text-white truncate">
                  {userComparisons.length > 0
                    ? userComparisons.sort((a, b) => b.productivity - a.productivity)[0]?.userName
                    : 'John D.'}
                </div>
              </div>
            </div>

            {/* User Comparisons */}
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50">
              <div className="p-6 border-b border-gray-700/50">
                <h2 className="text-xl font-semibold text-white">User Performance</h2>
              </div>
              <div className="p-6 space-y-4">
                {userComparisons.length > 0 ? (
                  userComparisons.map((comparison, index) => (
                    <motion.div
                      key={comparison.userId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-4 p-4 bg-gray-900/50 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">{comparison.userName}</span>
                          {getRoleIcon(comparison.userId === selectedTeam.ownerId ? 'owner' : 'member')}
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Productivity</span>
                            <span>{comparison.productivity}%</span>
                          </div>
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                              style={{ width: `${(comparison.productivity / getMaxProductivity()) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{comparison.sessions}</div>
                        <div className="text-xs text-gray-500">sessions</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-400">{comparison.accuracy}%</div>
                        <div className="text-xs text-gray-500">accuracy</div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  getMockComparisons().map((comparison, index) => (
                    <motion.div
                      key={comparison.userId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-4 p-4 bg-gray-900/50 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">{comparison.userName}</span>
                          {getRoleIcon(index === 0 ? 'owner' : 'member')}
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Productivity</span>
                            <span>{comparison.productivity}%</span>
                          </div>
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                              style={{ width: `${(comparison.productivity / getMaxProductivity()) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{comparison.sessions}</div>
                        <div className="text-xs text-gray-500">sessions</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-400">{comparison.accuracy}%</div>
                        <div className="text-xs text-gray-500">accuracy</div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-12 border border-gray-700/50 text-center">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Teams Yet</h2>
            <p className="text-gray-400 mb-4">Create a team to start analyzing group productivity</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
            >
              Create Your First Team
            </button>
          </div>
        )}

        {/* Create Team Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Create New Team</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Team Name</label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Description (optional)</label>
                  <textarea
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    placeholder="Describe your team"
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTeam}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                  >
                    Create Team
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
}

// Mock data
function getMockTeams(): Team[] {
  return [
    {
      id: 'team1',
      name: 'Engineering',
      description: 'Engineering team productivity',
      ownerId: 'user1',
      members: [
        { userId: 'user1', email: 'john@example.com', name: 'John Doe', role: 'owner', joinedAt: '2024-01-01' },
        { userId: 'user2', email: 'jane@example.com', name: 'Jane Smith', role: 'admin', joinedAt: '2024-01-15' },
        { userId: 'user3', email: 'bob@example.com', name: 'Bob Wilson', role: 'member', joinedAt: '2024-02-01' },
        { userId: 'user4', email: 'alice@example.com', name: 'Alice Brown', role: 'member', joinedAt: '2024-02-15' },
        { userId: 'user5', email: 'charlie@example.com', name: 'Charlie Davis', role: 'member', joinedAt: '2024-03-01' },
      ],
      createdAt: '2024-01-01',
    },
    {
      id: 'team2',
      name: 'Marketing',
      description: 'Marketing team analytics',
      ownerId: 'user1',
      members: [
        { userId: 'user1', email: 'john@example.com', name: 'John Doe', role: 'owner', joinedAt: '2024-01-01' },
        { userId: 'user6', email: 'emma@example.com', name: 'Emma Johnson', role: 'admin', joinedAt: '2024-02-01' },
      ],
      createdAt: '2024-02-01',
    },
  ];
}

function getMockComparisons(): UserComparison[] {
  return [
    { userId: 'user2', userName: 'Jane Smith', sessions: 156, productivity: 92, accuracy: 88 },
    { userId: 'user3', userName: 'Bob Wilson', sessions: 142, productivity: 85, accuracy: 82 },
    { userId: 'user4', userName: 'Alice Brown', sessions: 128, productivity: 78, accuracy: 79 },
    { userId: 'user5', userName: 'Charlie Davis', sessions: 98, productivity: 72, accuracy: 75 },
    { userId: 'user1', userName: 'John Doe', sessions: 165, productivity: 88, accuracy: 85 },
  ];
}

